// Visual render (FS_VIS in the reference): treat the axisymmetric solution as a
// 3D emitter and integrate glow along each camera ray (optically thin).
// Emission = density x thermal spectrum, T/T_amb mapped to Kelvin.
// Drawn at half resolution, then blurred and composited by display.wgsl.
import { XE, XC0, WALL, nozR, ss, vnoise } from "./common.wgsl";

struct Vis {
  fit: vec3f,   // origin (px, GL convention: y up) and px per sim unit
  rot: f32,     // 1 = engine fires downward (portrait)
  ext: vec2f,   // simulated extent (x, r)
  xv: f32,      // displayed length
  height: f32,  // this target's height in px, to flip into the GL convention
  band: vec3f,
  soot: f32,
  bandK: f32,
  tK: f32,
  time: f32,
  turb: f32,
}

@group(0) @binding(0) var<uniform> vis: Vis;
@group(0) @binding(1) var fields: texture_2d<f32>;
@group(0) @binding(2) var fieldSampler: sampler;

// Ray samples: 24 is the reference's `lite` count (High); the Low quality tier
// uses the fs_low entry with half as many.
const N_HIGH: i32 = 24;
const N_LOW: i32 = 12;

// Planck radiance (Wien limit) sampled at 620/540/460 nm, normalised to red at 3000 K
fn thermal(K: f32) -> vec3f {
  let L = vec3f(0.62, 0.54, 0.46);
  return pow(L, vec3f(-5.0)) * exp(-1.4388e4 / (L * K)) / 4.77e-3;
}

@fragment
fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  return glow(pos, N_HIGH);
}

@fragment
fn fs_low(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  return glow(pos, N_LOW);
}

fn glow(pos: vec4f, N: i32) -> vec4f {
  let fc = vec2f(pos.x, vis.height - pos.y);
  let d = (fc - vis.fit.xy) / vis.fit.z;
  var q = d;
  if (vis.rot > 0.5) { q = vec2f(-d.y, d.x); }
  let y = abs(q.y);
  let RV = 0.5;
  if (q.x < 0.0 || q.x > vis.xv || y >= RV) { return vec4f(0.0, 0.0, 0.0, 1.0); }
  let zr = sqrt(RV * RV - y * y);
  let dz = zr / f32(N);
  var col = vec3f(0.0);
  for (var i = 0; i < N; i++) {
    let z = (f32(i) + 0.5) * dz;
    let r = sqrt(y * y + z * z);
    let D = textureSampleLevel(fields, fieldSampler, vec2f(q.x / vis.ext.x, r / vis.ext.y), 0.0);
    let T = D.y;
    if (T < 1.15) { continue; }
    if (q.x < XE && r < nozR(max(q.x, XC0)) + WALL) { continue; } // hidden behind the engine wall
    let rho = pow(10.0, D.z) / T;
    let K = T * vis.tK;
    let soot = thermal(K) * vis.soot;
    let band = vis.band * vis.bandK * (0.15 * ss(1.3, 2.2, T) + ss(2.2, 3.6, T));
    let np = vec3f(q.x * 16.0 - vis.time * 60.0, y * 16.0, z * 16.0);
    let fl = 0.65 * vnoise(np) + 0.35 * vnoise(np * 2.1 + 7.3);
    let flick = 1.0 + vis.turb * 0.9 * (fl - 0.5) * ss(XE, XE + 0.25, q.x);
    col += rho * ss(1.15, 1.6, T) * (soot + band) * dz * max(flick, 0.0);
  }
  return vec4f(col * 2.0, 1.0);
}
