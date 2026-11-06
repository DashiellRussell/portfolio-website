// One SSP-RK2 stage of the axisymmetric Euler solver:
//   dst = a * base + b * (src + dt * L(src)),  L = HLLC + MUSCL (van Leer)
//
// Same physics as FS_STEP in public/sims/nozzle.html, restructured for compute.
// The fragment version rebuilt every face flux twice (once from each side) and
// converted each neighbour to primitives ~16 times per cell. Here a workgroup
// loads its tile plus a two-cell halo into shared memory once, computes every
// face flux once, then updates its cells from those.

import { GAM, RE, XE, Grid, ss, solidAt, reservoirAt, toPrim, toCons, vnoise, ghostCell, isSolidCell } from "./common.wgsl";

// Fixed per kernel: stage 1 is (a, b) = (0, 1), stage 2 is (0.5, 0.5).
struct Stage {
  a: f32,
  b: f32,
}

// What changes from stage to stage is uploaded once per frame as one row per
// stage, and each dispatch finds its row through a step counter kept on the
// GPU: it reads `counterIn` and writes the next index to `counterOut`, and the
// next dispatch binds them the other way round. So the CPU encodes a frame's
// ~240 dispatches without a single set() between them.
struct StageParams {
  p0: f32,    // chamber pressure this stage, roughness included
  time: f32,  // solver time, drives the combustion noise
  turb: f32,  // 0..1, 0 before ignition
  pad: f32,
}

@group(0) @binding(0) var<uniform> grid: Grid;
@group(0) @binding(1) var<uniform> stage: Stage;
@group(0) @binding(2) var<storage, read> src: array<vec4f>;
@group(0) @binding(3) var<storage, read> base: array<vec4f>;
@group(0) @binding(4) var<storage, read_write> dst: array<vec4f>;
@group(0) @binding(6) var<storage, read> params: array<StageParams>;
@group(0) @binding(7) var<storage, read> counterIn: array<u32>;
@group(0) @binding(8) var<storage, read_write> counterOut: array<u32>;

// The visitor's pointer, as a probe stuck into the flow: inside its radius the
// gas is dragged toward the probe's own velocity (Brinkman penalisation), so a
// still cursor is an obstacle the supersonic jet has to shock around, and a
// moving one sweeps the plume along with it. Axisymmetric, so it acts as a ring.
struct Probe {
  pos: vec2f,      // (x, r) in sim units
  vel: vec2f,      // sim units per sim time
  radius: f32,
  strength: f32,   // 0 = no pointer, 1 = fully on
}
@group(0) @binding(5) var<uniform> probe: Probe;

const TX: i32 = 16;
const TY: i32 = 8;
const HALO: i32 = 2;
const LX: i32 = 20; // TX + 2 * HALO
const LY: i32 = 12; // TY + 2 * HALO
const NL: i32 = 240; // LX * LY
const NFX: i32 = 136; // (TX + 1) * TY
const NFY: i32 = 144; // TX * (TY + 1)
const THREADS: i32 = 128; // TX * TY

var<workgroup> P: array<vec4f, 240>;
var<workgroup> SOL: array<u32, 240>;
var<workgroup> FX: array<vec4f, 136>;
var<workgroup> FY: array<vec4f, 144>;

fn vl(a: vec4f, b: vec4f) -> vec4f {
  return (a * abs(b) + abs(a) * b) / (abs(a) + abs(b) + 1e-20);
}

fn mirrorW(W: vec4f, ax: i32) -> vec4f {
  var o = W;
  if (ax == 0) { o.y = -o.y; } else { o.z = -o.z; }
  return o;
}

fn physF(W: vec4f, E: f32) -> vec4f {
  return vec4f(W.x * W.y, W.x * W.y * W.y + W.w, W.x * W.y * W.z, W.y * (E + W.w));
}

fn hllc(Lin: vec4f, Rin: vec4f, ax: i32) -> vec4f {
  var L = Lin;
  var R = Rin;
  if (ax == 1) { L = L.xzyw; R = R.xzyw; }
  let EL = L.w / (GAM - 1.0) + 0.5 * L.x * (L.y * L.y + L.z * L.z);
  let ER = R.w / (GAM - 1.0) + 0.5 * R.x * (R.y * R.y + R.z * R.z);
  let cL = sqrt(GAM * L.w / L.x);
  let cR = sqrt(GAM * R.w / R.x);
  let SL = min(L.y - cL, R.y - cR);
  let SR = max(L.y + cL, R.y + cR);
  var F: vec4f;
  if (SL >= 0.0) {
    F = physF(L, EL);
  } else if (SR <= 0.0) {
    F = physF(R, ER);
  } else {
    let SM = (R.w - L.w + L.x * L.y * (SL - L.y) - R.x * R.y * (SR - R.y)) / (L.x * (SL - L.y) - R.x * (SR - R.y));
    if (SM >= 0.0) {
      let U = vec4f(L.x, L.x * L.y, L.x * L.z, EL);
      let f = L.x * (SL - L.y) / (SL - SM);
      let Us = f * vec4f(1.0, SM, L.z, EL / L.x + (SM - L.y) * (SM + L.w / (L.x * (SL - L.y))));
      F = physF(L, EL) + SL * (Us - U);
    } else {
      let U = vec4f(R.x, R.x * R.y, R.x * R.z, ER);
      let f = R.x * (SR - R.y) / (SR - SM);
      let Us = f * vec4f(1.0, SM, R.z, ER / R.x + (SM - R.y) * (SM + R.w / (R.x * (SR - R.y))));
      F = physF(R, ER) + SR * (Us - U);
    }
  }
  if (ax == 1) { F = F.xzyw; }
  return F;
}

// Flux across the face between local cells a and a + d, as faceFlux() in the
// reference: walls reflect, open faces reconstruct with limited slopes.
fn faceFlux(a: i32, d: i32, ax: i32) -> vec4f {
  let b = a + d;
  let sa = SOL[a] != 0u;
  let sb = SOL[b] != 0u;
  if (sa && sb) { return vec4f(0.0); }
  var WL: vec4f;
  var WR: vec4f;
  if (sb) {
    WL = P[a];
    WR = mirrorW(WL, ax);
  } else if (sa) {
    WR = P[b];
    WL = mirrorW(WR, ax);
  } else {
    let Pa = P[a];
    let Pb = P[b];
    let dab = Pb - Pa;
    let am = a - d;
    let bp = b + d;
    var sA = vec4f(0.0);
    var sB = vec4f(0.0);
    if (SOL[am] == 0u) { sA = vl(Pa - P[am], dab); }
    if (SOL[bp] == 0u) { sB = vl(dab, P[bp] - Pb); }
    WL = Pa + 0.5 * sA;
    WR = Pb - 0.5 * sB;
    if (WL.x <= 1e-5 || WL.w <= 1e-5) { WL = Pa; }
    if (WR.x <= 1e-5 || WR.w <= 1e-5) { WR = Pb; }
  }
  return hllc(WL, WR, ax);
}

@compute @workgroup_size(16, 8)
fn cs_main(@builtin(workgroup_id) wg: vec3u, @builtin(local_invocation_id) lid: vec3u) {
  let n = grid.n;
  let k = counterIn[0];
  let sp = params[k];
  if (all(wg == vec3u(0u)) && all(lid == vec3u(0u))) { counterOut[0] = k + 1u; }
  let origin = vec2i(wg.xy) * vec2i(TX, TY) - vec2i(HALO);
  let tid = i32(lid.y) * TX + i32(lid.x);

  // 1. tile + halo -> primitives and solid flags
  for (var k = tid; k < NL; k += THREADS) {
    let c = origin + vec2i(k % LX, k / LX);
    let g = ghostCell(c, n);
    var W = toPrim(src[g.y * n.x + g.x]);
    if (g.z == 1) { W.z = -W.z; }
    P[k] = W;
    SOL[k] = select(0u, 1u, isSolidCell(c, n, grid.h));
  }
  workgroupBarrier();

  // 2. every face of the tile, once: x-faces sit left of cell fx (fx = 0..TX),
  //    y-faces below cell fy (fy = 0..TY)
  for (var k = tid; k < NFX; k += THREADS) {
    let fx = k % (TX + 1);
    let fy = k / (TX + 1);
    let a = (fy + HALO) * LX + (fx - 1 + HALO);
    FX[k] = faceFlux(a, 1, 0);
  }
  for (var k = tid; k < NFY; k += THREADS) {
    let fx = k % TX;
    let fy = k / TX;
    let a = (fy - 1 + HALO) * LX + (fx + HALO);
    FY[k] = faceFlux(a, LX, 1);
  }
  workgroupBarrier();

  // 3. update this thread's cell
  let lx = i32(lid.x);
  let ly = i32(lid.y);
  let c = origin + vec2i(lx + HALO, ly + HALO);
  if (c.x >= n.x || c.y >= n.y) { return; }
  let idx = c.y * n.x + c.x;
  let U0 = base[idx];
  let p = (vec2f(c) + 0.5) * grid.h;
  if (solidAt(p)) { dst[idx] = U0; return; }
  if (reservoirAt(p)) {
    // combustion roughness: drifting hot/cold pockets (entropy spots) in the chamber gas
    let Tf = grid.t0 * (1.0 + sp.turb * 0.22 * (vnoise(vec3f(p * 34.0, sp.time * 22.0)) - 0.5));
    dst[idx] = toCons(vec4f(sp.p0 / Tf, 0.0, 0.0, sp.p0));
    return;
  }
  let U = src[idx];
  let Fe = FX[ly * (TX + 1) + lx + 1];
  let Fw = FX[ly * (TX + 1) + lx];
  let Gn = FY[(ly + 1) * TX + lx];
  let Gs = FY[ly * TX + lx];
  let W = P[(ly + HALO) * LX + lx + HALO];
  // axisymmetric source: -(1/r) * (rho v, rho u v, rho v^2, v (E+p))
  let srcTerm = vec4f(W.x * W.z, W.x * W.y * W.z, W.x * W.z * W.z, W.z * (U.w + W.w)) / p.y;
  let Ln = -(Fe - Fw) / grid.h - (Gn - Gs) / grid.h - srcTerm;
  var Un = stage.a * U0 + stage.b * (U + grid.dt * Ln);
  // seed the lip shear layer with small random radial forcing so it rolls up and wanders
  let lip = ss(0.03, 0.0, abs(p.y - RE)) * ss(XE - 0.01, XE + 0.01, p.x) * ss(XE + 0.09, XE + 0.02, p.x);
  if (lip > 0.0) {
    Un.z += stage.b * grid.dt * sp.turb * lip * Un.x * 24.0 * (vnoise(vec3f(p * 60.0, sp.time * 40.0)) - 0.5);
  }
  if (probe.strength > 0.0) {
    let w = ss(probe.radius, probe.radius * 0.45, distance(p, probe.pos)) * probe.strength;
    if (w > 0.0) {
      // swap the momentum, keep density and pressure
      var Wn = toPrim(Un);
      Wn = vec4f(Wn.x, mix(Wn.yz, probe.vel, w * 0.35), Wn.w);
      Un = toCons(Wn);
    }
  }
  Un.x = max(Un.x, 1e-4);
  Un.w = max(Un.w, 0.5 * (Un.y * Un.y + Un.z * Un.z) / Un.x + 1e-4 / (GAM - 1.0));
  dst[idx] = Un;
}
