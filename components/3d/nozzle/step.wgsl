// One full SSP-RK2 step of the axisymmetric Euler solver per dispatch:
//   U1 = U0 + dt L(U0)
//   U2 = (U0 + U1 + dt L(U1)) / 2,   L = HLLC + MUSCL (van Leer)
//
// Same physics as FS_STEP in public/sims/nozzle.html, restructured for compute.
// A workgroup owns a 16x8 tile. It loads the tile plus a 4-cell halo of U0 into
// shared memory, runs stage 1 on the tile plus a 2-cell ring, then stage 2 on
// the tile from those, so the intermediate state never leaves the workgroup
// and a step costs one dispatch instead of two. Every face flux of a stage is
// solved once and shared by the two cells it separates.

import { GAM, RE, XE, Grid, ss, solidAt, reservoirAt, toPrim, toCons, vnoise, ghostCell, isSolidCell } from "./common.wgsl";

// What changes from stage to stage is uploaded once per frame, two rows per
// step, and each dispatch finds its rows through a step counter kept on the
// GPU: it reads `counterIn` and writes the next index to `counterOut`, and the
// next dispatch binds them the other way round. So the CPU encodes a frame's
// steps without a single set() between them.
struct StageParams {
  p0: f32,    // chamber pressure this stage, roughness included
  time: f32,  // solver time, drives the combustion noise
  turb: f32,  // 0..1, 0 before ignition
  pad: f32,
}

@group(0) @binding(0) var<uniform> grid: Grid;
@group(0) @binding(2) var<storage, read> src: array<vec4f>;
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
const THREADS: i32 = 128;   // TX * TY

// Regions, all row-major, as offsets from the tile origin:
//   R0  24x16, halo 4: U0 primitives and wall flags (stage-1 input)
//   R1  20x12, halo 2: stage-1 cells, then U1 primitives (stage-2 input)
const W0: i32 = 24;
const N0: i32 = 384;
const W1: i32 = 20;
const N1: i32 = 240;
const NFX1: i32 = 252;  // (W1 + 1) * 12 x-faces of R1
const NFY1: i32 = 260;  // W1 * 13 y-faces of R1
const NFX2: i32 = 136;  // (TX + 1) * TY x-faces of the tile
const NFY2: i32 = 144;  // TX * (TY + 1) y-faces of the tile

// One shared vec4 pool, reused stage by stage to stay under 16 KB:
//   [0, 384)    A: U0 primitives (R0) -> U1 conserved (R1) -> stage-2 fluxes
//   [384, 896)  B: stage-1 fluxes -> U1 primitives (R1)
const A: i32 = 0;
const B: i32 = 384;
var<workgroup> S: array<vec4f, 896>;
var<workgroup> SOL: array<u32, 384>; // R0 wall flags

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

// Flux across the face between cells a and a + d (indices into S), with wall
// flags at sa and sa + sd in SOL, as faceFlux() in the reference: walls
// reflect, open faces reconstruct with limited slopes.
fn faceFlux(a: i32, d: i32, sa: i32, sd: i32, ax: i32) -> vec4f {
  let b = a + d;
  let solidA = SOL[sa] != 0u;
  let solidB = SOL[sa + sd] != 0u;
  if (solidA && solidB) { return vec4f(0.0); }
  var WL: vec4f;
  var WR: vec4f;
  if (solidB) {
    WL = S[a];
    WR = mirrorW(WL, ax);
  } else if (solidA) {
    WR = S[b];
    WL = mirrorW(WR, ax);
  } else {
    let Pa = S[a];
    let Pb = S[b];
    let dab = Pb - Pa;
    var sA = vec4f(0.0);
    var sB = vec4f(0.0);
    if (SOL[sa - sd] == 0u) { sA = vl(Pa - S[a - d], dab); }
    if (SOL[sa + 2 * sd] == 0u) { sB = vl(dab, S[b + d] - Pb); }
    WL = Pa + 0.5 * sA;
    WR = Pb - 0.5 * sB;
    if (WL.x <= 1e-5 || WL.w <= 1e-5) { WL = Pa; }
    if (WR.x <= 1e-5 || WR.w <= 1e-5) { WR = Pb; }
  }
  return hllc(WL, WR, ax);
}

// The cell update shared by both stages: a * U0 + b * (U + dt L(U)), with the
// reservoir, walls, lip forcing and pointer probe of the reference.
fn update(c: vec2i, U0: vec4f, U: vec4f, W: vec4f, Fe: vec4f, Fw: vec4f, Gn: vec4f, Gs: vec4f, a: f32, b: f32, sp: StageParams) -> vec4f {
  let p = (vec2f(c) + 0.5) * grid.h;
  if (solidAt(p)) { return U0; }
  if (reservoirAt(p)) {
    // combustion roughness: drifting hot/cold pockets (entropy spots) in the chamber gas
    let Tf = grid.t0 * (1.0 + sp.turb * 0.22 * (vnoise(vec3f(p * 34.0, sp.time * 22.0)) - 0.5));
    return toCons(vec4f(sp.p0 / Tf, 0.0, 0.0, sp.p0));
  }
  // axisymmetric source: -(1/r) * (rho v, rho u v, rho v^2, v (E+p))
  let srcTerm = vec4f(W.x * W.z, W.x * W.y * W.z, W.x * W.z * W.z, W.z * (U.w + W.w)) / p.y;
  let Ln = -(Fe - Fw) / grid.h - (Gn - Gs) / grid.h - srcTerm;
  var Un = a * U0 + b * (U + grid.dt * Ln);
  // seed the lip shear layer with small random radial forcing so it rolls up and wanders
  let lip = ss(0.03, 0.0, abs(p.y - RE)) * ss(XE - 0.01, XE + 0.01, p.x) * ss(XE + 0.09, XE + 0.02, p.x);
  if (lip > 0.0) {
    Un.z += b * grid.dt * sp.turb * lip * Un.x * 24.0 * (vnoise(vec3f(p * 60.0, sp.time * 40.0)) - 0.5);
  }
  if (probe.strength > 0.0) {
    let w = ss(probe.radius, probe.radius * 0.45, distance(p, probe.pos)) * probe.strength;
    if (w > 0.0) {
      // Swap the momentum, keep density and pressure. Radial velocity has to
      // vanish on the axis (the source term above divides by r), so the
      // probe's radial push fades out over its own radius toward the axis;
      // forcing flow through the centreline is what blew the solver up.
      let pushTo = vec2f(probe.vel.x, probe.vel.y * saturate(p.y / probe.radius));
      var Wn = toPrim(Un);
      Wn = vec4f(Wn.x, mix(Wn.yz, pushTo, w * 0.35), Wn.w);
      Un = toCons(Wn);
    }
  }
  Un.x = max(Un.x, 1e-4);
  Un.w = max(Un.w, 0.5 * (Un.y * Un.y + Un.z * Un.z) / Un.x + 1e-4 / (GAM - 1.0));
  return guard(Un);
}

// Last line of defence: a non-finite cell would spread to the whole grid in a
// few steps and stay there (the flame "goes out forever"), so it is replaced by
// still ambient air and the reservoir refills the plume. Speed and temperature
// are capped far above anything the plume reaches (|u| ~4.8, T ~4.4) and below
// what the fixed time step can carry, so normal flow never touches them.
const V_CAP: f32 = 9.0;
const T_CAP: f32 = 10.0;

fn finite(u: vec4f) -> bool {
  // bit test rather than u != u: shader compilers may assume NaN never occurs
  let e = bitcast<vec4u>(u) & vec4u(0x7f800000u);
  return all(e != vec4u(0x7f800000u));
}

fn guard(U: vec4f) -> vec4f {
  if (!finite(U)) { return toCons(vec4f(1.0, 0.0, 0.0, 1.0)); }
  let W = toPrim(U);
  let speed = length(W.yz);
  if (speed <= V_CAP && W.w <= T_CAP * W.x) { return U; }
  let v = W.yz * min(1.0, V_CAP / max(speed, 1e-6));
  return toCons(vec4f(W.x, v, min(W.w, T_CAP * W.x)));
}

fn inDomain(c: vec2i, n: vec2i) -> bool {
  return c.x >= 0 && c.y >= 0 && c.x < n.x && c.y < n.y;
}

// R1 index -> SOL (R0) index
fn sol1(i: i32) -> i32 { return (i / W1 + 2) * W0 + (i % W1) + 2; }

// The 112 R1 cells outside the tile: rows 0-1, rows 10-11, then columns
// 0-1 and 18-19 of rows 2-9. Thread t < 112 computes ring cell t.
fn ringCell(h: i32) -> i32 {
  if (h < 40) { return h; }
  if (h < 80) { return 200 + (h - 40); }
  let k = h - 80;
  let col = k % 4;
  return (2 + k / 4) * W1 + select(16 + col, col, col < 2);
}

@compute @workgroup_size(16, 8)
fn cs_main(@builtin(workgroup_id) wg: vec3u, @builtin(local_invocation_id) lid: vec3u) {
  let n = grid.n;
  let s = counterIn[0];
  let sp1 = params[2u * s];
  let sp2 = params[2u * s + 1u];
  if (all(wg == vec3u(0u)) && all(lid == vec3u(0u))) { counterOut[0] = s + 1u; }
  let tile = vec2i(wg.xy) * vec2i(TX, TY);
  let o0 = tile - vec2i(4);
  let o1 = tile - vec2i(2);
  let tid = i32(lid.y) * TX + i32(lid.x);
  let lx = i32(lid.x);
  let ly = i32(lid.y);

  // 1. R0: U0 -> primitives (ghost cells mirrored / clamped) and wall flags
  for (var k = tid; k < N0; k += THREADS) {
    let c = o0 + vec2i(k % W0, k / W0);
    let g = ghostCell(c, n);
    var W = toPrim(src[g.y * n.x + g.x]);
    if (g.z == 1) { W.z = -W.z; }
    S[A + k] = W;
    SOL[k] = select(0u, 1u, isSolidCell(c, n, grid.h));
  }
  workgroupBarrier();

  // 2. stage-1 fluxes on every face of R1
  for (var k = tid; k < NFX1; k += THREADS) {
    let fx = k % (W1 + 1);
    let fy = k / (W1 + 1);
    let i = (fy + 2) * W0 + (fx + 1); // R0 cell left of the face
    S[B + k] = faceFlux(A + i, 1, i, 1, 0);
  }
  for (var k = tid; k < NFY1; k += THREADS) {
    let fx = k % W1;
    let fy = k / W1;
    let i = (fy + 1) * W0 + (fx + 2); // R0 cell below the face
    S[B + NFX1 + k] = faceFlux(A + i, W0, i, W0, 1);
  }
  workgroupBarrier();

  // 3. stage 1 on R1 (in-domain cells): this thread's own tile cell, plus one
  //    ring cell for the first 112 threads. Results wait in registers until
  //    every thread has finished reading R0.
  let own = (ly + 2) * W1 + lx + 2;
  var todo = array<i32, 2>(own, -1);
  if (tid < 112) { todo[1] = ringCell(tid); }
  var u1 = array<vec4f, 2>(vec4f(0.0), vec4f(0.0));
  for (var j = 0; j < 2; j++) {
    let i = todo[j];
    if (i < 0) { continue; }
    let rx = i % W1;
    let ry = i / W1;
    let c = o1 + vec2i(rx, ry);
    if (!inDomain(c, n)) { continue; }
    let U0 = src[c.y * n.x + c.x];
    let Fe = S[B + ry * (W1 + 1) + rx + 1];
    let Fw = S[B + ry * (W1 + 1) + rx];
    let Gn = S[B + NFX1 + (ry + 1) * W1 + rx];
    let Gs = S[B + NFX1 + ry * W1 + rx];
    let W = S[A + (ry + 2) * W0 + rx + 2];
    u1[j] = update(c, U0, U0, W, Fe, Fw, Gn, Gs, 0.0, 1.0, sp1);
  }
  workgroupBarrier();
  for (var j = 0; j < 2; j++) {
    if (todo[j] >= 0) { S[A + todo[j]] = u1[j]; }
  }
  workgroupBarrier();

  // 4. U1 -> primitives over R1. Cells outside the domain take the mirrored /
  //    clamped in-domain cell, exactly as the two-pass solver read U1 back.
  for (var k = tid; k < N1; k += THREADS) {
    let c = o1 + vec2i(k % W1, k / W1);
    let g = ghostCell(c, n);
    let li = clamp(g.y - o1.y, 0, 11) * W1 + clamp(g.x - o1.x, 0, W1 - 1);
    var W = toPrim(S[A + li]);
    if (g.z == 1) { W.z = -W.z; }
    S[B + k] = W;
  }
  workgroupBarrier();

  // 5. stage-2 fluxes on every face of the tile
  for (var k = tid; k < NFX2; k += THREADS) {
    let fx = k % (TX + 1);
    let fy = k / (TX + 1);
    let i = (fy + 2) * W1 + (fx + 1); // R1 cell left of the face
    S[A + k] = faceFlux(B + i, 1, sol1(i), 1, 0);
  }
  for (var k = tid; k < NFY2; k += THREADS) {
    let fx = k % TX;
    let fy = k / TX;
    let i = (fy + 1) * W1 + (fx + 2); // R1 cell below the face
    S[A + NFX2 + k] = faceFlux(B + i, W1, sol1(i), W0, 1);
  }
  workgroupBarrier();

  // 6. stage 2 on this thread's tile cell
  let c = tile + vec2i(lx, ly);
  if (!inDomain(c, n)) { return; }
  let idx = c.y * n.x + c.x;
  let Fe = S[A + ly * (TX + 1) + lx + 1];
  let Fw = S[A + ly * (TX + 1) + lx];
  let Gn = S[A + NFX2 + (ly + 1) * TX + lx];
  let Gs = S[A + NFX2 + ly * TX + lx];
  let W = S[B + own];
  dst[idx] = update(c, src[idx], u1[0], W, Fe, Fw, Gn, Gs, 0.5, 0.5, sp2);
}
