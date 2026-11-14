// Glow projection, done once per texel of the flow rather than once per pixel.
//
// The plume is axisymmetric, so the glow seen along a camera ray depends only
// on where the ray crosses the axis plane: (x, |y|) in sim units. That is the
// Abel projection of the emitter, so this kernel integrates it on a fixed grid
// in sim space, one half only (the other is its mirror image). visual.wgsl then
// stretches the result over the screen with one bilinear fetch per pixel.
//
// Cost no longer grows with the canvas: about 38k texels x 24 samples, against
// one ray per half-resolution pixel, both halves, before. The integrand is the
// reference's FS_VIS (density x thermal spectrum, optically thin, with the same
// wall occlusion and flicker noise), so the look is unchanged.
//
// The gas state comes from the live solver, from the baked flipbook (two
// frames per texel, see flip-pair.wgsl), or a crossfade of the two while the
// sim hands over between them.
import { XE, XC0, WALL, nozR, ss, vnoise } from "./common.wgsl";

struct Proj {
  size: vec2f,  // output texels
  span: vec2f,  // sim units covered: x in [0, span.x], |y| in [0, span.y]
  ext: vec2f,   // simulated extent (x, r)
  band: vec3f,
  soot: f32,
  bandK: f32,
  tK: f32,
  time: f32,
  turb: f32,
  blend: f32,     // 0 = live solver, 1 = flipbook
  flipLayer: u32,
  flipHalf: u32,  // 0 = the layer's .xy frame, 1 = its .zw frame
}

@group(0) @binding(0) var<uniform> proj: Proj;
@group(0) @binding(1) var fields: texture_2d<f32>;
@group(0) @binding(2) var fieldSampler: sampler;
@group(0) @binding(3) var glowOut: texture_storage_2d<rgba16float, write>;
@group(0) @binding(4) var flip: texture_2d_array<f32>;

// Ray samples: 24 is the reference's `lite` count (High). Low sets 12.
override SAMPLES: i32 = 24;

// Planck radiance (Wien limit) sampled at 620/540/460 nm, normalised to red at 3000 K
fn thermal(K: f32) -> vec3f {
  let L = vec3f(0.62, 0.54, 0.46);
  return pow(L, vec3f(-5.0)) * exp(-1.4388e4 / (L * K)) / 4.77e-3;
}

// (T/T_amb, log10 p/p_amb) at (x, r). Uniform branches: only the sources in
// use are fetched, so the flipbook costs one fetch per sample.
fn gas(x: f32, r: f32) -> vec2f {
  var d = vec2f(0.0);
  if (proj.blend < 1.0) {
    d = textureSampleLevel(fields, fieldSampler, vec2f(x / proj.ext.x, r / proj.ext.y), 0.0).yz;
  }
  if (proj.blend > 0.0) {
    let b = textureSampleLevel(flip, fieldSampler, vec2f(x, r) / proj.span, proj.flipLayer, 0.0);
    d = mix(d, select(b.xy, b.zw, proj.flipHalf == 1u), proj.blend);
  }
  return d;
}

@compute @workgroup_size(16, 8)
fn cs_main(@builtin(global_invocation_id) id: vec3u) {
  let px = vec2f(id.xy);
  if (px.x >= proj.size.x || px.y >= proj.size.y) { return; }
  let q = (px + 0.5) / proj.size * proj.span;
  let x = q.x;
  let y = q.y;
  let RV = 0.5;
  let zr = sqrt(max(RV * RV - y * y, 0.0));
  let dz = zr / f32(SAMPLES);
  let flickOn = proj.turb * 0.9 * ss(XE, XE + 0.25, x);
  let wallR = nozR(max(x, XC0)) + WALL;
  var col = vec3f(0.0);
  for (var i = 0; i < SAMPLES; i++) {
    let z = (f32(i) + 0.5) * dz;
    let r = sqrt(y * y + z * z);
    let D = gas(x, r);
    let T = D.x;
    if (T < 1.15) { continue; }
    if (x < XE && r < wallR) { continue; } // hidden behind the engine wall
    let rho = pow(10.0, D.y) / T;
    let soot = thermal(T * proj.tK) * proj.soot;
    let band = proj.band * proj.bandK * (0.15 * ss(1.3, 2.2, T) + ss(2.2, 3.6, T));
    var flick = 1.0;
    if (flickOn > 0.0) {
      let np = vec3f(x * 16.0 - proj.time * 60.0, y * 16.0, z * 16.0);
      let fl = 0.65 * vnoise(np) + 0.35 * vnoise(np * 2.1 + 7.3);
      flick = max(1.0 + flickOn * (fl - 0.5), 0.0);
    }
    col += rho * ss(1.15, 1.6, T) * (soot + band) * dz * flick;
  }
  textureStore(glowOut, vec2i(id.xy), vec4f(col * 2.0, 1.0));
}
