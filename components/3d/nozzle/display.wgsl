// Composite to the canvas (FS_DISP in the reference, "visual" mode on both
// halves with `clean` edges, which is how the site embeds it): tone-mapped
// glow plus bloom, the engine lit by its own plume, and LOX frost on the
// injector end.
import { XC0, XT, XE, RC, WALL, nozR, ss } from "./common.wgsl";

struct Disp {
  fit: vec3f,
  rot: f32,
  res: vec2f,   // canvas size in px
  xv: f32,
  vr: f32,
  bg: vec3f,
  expo: f32,
  frost: f32,
}

@group(0) @binding(0) var<uniform> disp: Disp;
@group(0) @binding(1) var glow: texture_2d<f32>;
@group(0) @binding(2) var bloomA: texture_2d<f32>;
@group(0) @binding(3) var bloomB: texture_2d<f32>;
@group(0) @binding(4) var linearSampler: sampler;

fn aces(x: vec3f) -> vec3f {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), vec3f(0.0), vec3f(1.0));
}
fn fh(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453); }
fn fn2(p: vec2f) -> f32 {
  let i = floor(p);
  var f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(fh(i), fh(i + vec2f(1.0, 0.0)), f.x), mix(fh(i + vec2f(0.0, 1.0)), fh(i + vec2f(1.0, 1.0)), f.x), f.y);
}
fn ffbm(p: vec2f) -> f32 { return 0.5 * fn2(p) + 0.3 * fn2(p * 2.3 + 5.1) + 0.2 * fn2(p * 5.1 + 1.7); }
fn gam(c: vec3f) -> vec3f { return pow(c, vec3f(1.0 / 2.2)); }

@fragment
fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let fc = vec2f(pos.x, disp.res.y - pos.y);
  let d = (fc - disp.fit.xy) / disp.fit.z;
  var q = d;
  if (disp.rot > 0.5) { q = vec2f(-d.y, d.x); }
  let px = 1.0 / disp.fit.z;
  if (q.x < -px || q.x > disp.xv + px || abs(q.y) > disp.vr + px) { return vec4f(disp.bg, 1.0); }
  let p = vec2f(q.x, abs(q.y));

  // screen-space buffers share this pass's pixel grid, so they sample at the
  // fragment's own uv with no flip
  let uv = pos.xy / disp.res;
  let bl = textureSampleLevel(bloomA, linearSampler, uv, 0.0).rgb * 0.45
         + textureSampleLevel(bloomB, linearSampler, uv, 0.0).rgb * 0.7;
  let e = textureSampleLevel(glow, linearSampler, uv, 0.0).rgb;
  var col = vec3f(0.012, 0.013, 0.016) + gam(aces(e * disp.expo));

  // engine seen from outside (opaque), lit by its own plume
  var Rx = RC + WALL;
  if (p.x >= XC0) { Rx = nozR(clamp(p.x, XC0, XE)) + WALL; }
  let ea = ss(px, -px, p.y - Rx) * ss(px, -px, p.x - XE) * step(0.0, p.x);
  if (ea > 0.0) {
    let ny = clamp(p.y / Rx, 0.0, 1.0);
    let nz = sqrt(1.0 - ny * ny);
    var base = vec3f(0.11, 0.115, 0.125);
    if (p.x < XT) { base = vec3f(0.20, 0.12, 0.08); }
    var tubes = 1.0;
    if (p.x > XT) { tubes = 0.85 + 0.15 * cos(asin(ny) * 50.0); }
    var ec = base * (0.12 + 0.85 * pow(nz, 0.7) * (0.55 + 0.45 * sign(q.y) * ny * 0.5 + 0.25)) * tubes;
    ec += vec3f(0.7, 0.75, 0.8) * exp(-pow((ny - 0.42) * 7.0, 2.0)) * 0.18 * tubes;
    ec += base * bl * disp.expo * 3.0 * nz;
    ec *= mix(1.0, 0.6, ss(XE - 0.012, XE - 0.004, p.x));
    // cryogenic rime: LOX chill-down frosts the cold injector end; it thins toward the
    // throat (the hot end stays bare) and builds up on the underside where drips collect
    if (disp.frost > 0.0) {
      let ang = asin(ny) * sign(q.y);                       // -1.57 underside .. +1.57 top
      let fp = vec2f(p.x * 70.0, ang * 9.0);
      let n = ffbm(fp);
      let fine = fn2(fp * 6.0);
      let along = 1.0 - ss(XC0 + 0.04, XT + 0.015, p.x);    // full at injector, gone by the throat
      let under = ss(0.4, -1.2, ang);                        // thicker underneath
      var cover = ss(0.32, 0.62, along * (0.55 + 0.5 * n) + under * 0.22 * along + 0.08 * fine) * disp.frost;
      // icicle drips hanging off the lower edge
      let drip = step(0.86, fn2(vec2f(p.x * 160.0, 3.0))) * ss(-1.2, -1.5, ang) * along;
      cover = max(cover, drip * disp.frost);
      let lit = 0.35 + 0.65 * pow(nz, 0.6);
      var rime = vec3f(0.80, 0.86, 0.92) * lit * (0.85 + 0.3 * fine);
      rime += vec3f(1.0) * ss(0.93, 1.0, fn2(fp * 14.0)) * 0.35 * lit;  // crystal sparkle
      rime += bl * disp.expo * 1.6 * nz;                                // the plume lights the frost
      ec = mix(ec, rime, cover);
    }
    col = mix(col, ec, ea);
  }
  col += gam(aces(bl * disp.expo)) * 0.55;

  // clean edges: fade into the host page instead of drawing a frame
  let edge = min(min(q.x, disp.xv - q.x), disp.vr - abs(q.y));
  col = mix(disp.bg, col, ss(0.0, 0.14, min(disp.xv - q.x, disp.vr - abs(q.y))));
  col = mix(col, disp.bg, ss(0.0, -px, edge));
  return vec4f(col, 1.0);
}
