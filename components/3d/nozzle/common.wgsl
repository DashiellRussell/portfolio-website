// Shared geometry and gas model for the nozzle solver.
//
// A line-for-line port of the GEO / SIMLIB blocks in public/sims/nozzle.html
// (the WebGL 2 reference, still used as the fallback). Units: lengths in
// domain units, ambient p = rho = 1, gamma = 1.3. Bell nozzle, area ratio ~5.

export const GAM: f32 = 1.3;
export const XC0: f32 = 0.03;
export const XC1: f32 = 0.17;
export const XT: f32 = 0.25;
export const XE: f32 = 0.50;
export const RC: f32 = 0.095;
export const RT: f32 = 0.043;
export const RE: f32 = 0.096;
export const WALL: f32 = 0.018;
export const XR: f32 = 0.07;

// GLSL's smoothstep with the edges in either order. WGSL leaves
// smoothstep(low, high, x) undefined for low >= high, and the reference
// shaders use reversed edges as a falling ramp.
export fn ss(a: f32, b: f32, x: f32) -> f32 {
  let t = clamp((x - a) / (b - a), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

export fn nozR(x: f32) -> f32 {
  if (x < XC1) { return RC; }
  if (x < XT) {
    var k = (x - XC1) / (XT - XC1);
    k = k * k * (3.0 - 2.0 * k);
    return mix(RC, RT, k);
  }
  let k = clamp((x - XT) / (XE - XT), 0.0, 1.0);
  return RT + (RE - RT) * (1.0 - (1.0 - k) * (1.0 - k));
}

export fn solidAt(p: vec2f) -> bool {
  if (p.x < XC0) { return p.y < RC + WALL; }
  if (p.x <= XE) {
    let R = nozR(p.x);
    return p.y > R && p.y < R + WALL;
  }
  return false;
}

export fn reservoirAt(p: vec2f) -> bool {
  return p.x >= XC0 && p.x < XR && p.y < RC;
}

// conserved (rho, rho u, rho v, E) <-> primitive (rho, u, v, p)
export fn toPrim(u: vec4f) -> vec4f {
  let r = max(u.x, 1e-5);
  let v = u.yz / r;
  let p = max((GAM - 1.0) * (u.w - 0.5 * r * dot(v, v)), 1e-5);
  return vec4f(r, v, p);
}

export fn toCons(W: vec4f) -> vec4f {
  return vec4f(W.x, W.x * W.y, W.x * W.z, W.w / (GAM - 1.0) + 0.5 * W.x * (W.y * W.y + W.z * W.z));
}

export fn h3(q: vec3f) -> f32 {
  var p = fract(q * 0.3183099 + 0.1);
  p = p * 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

export fn vnoise(x: vec3f) -> f32 {
  let i = floor(x);
  var f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(h3(i), h3(i + vec3f(1.0, 0.0, 0.0)), f.x),
        mix(h3(i + vec3f(0.0, 1.0, 0.0)), h3(i + vec3f(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(h3(i + vec3f(0.0, 0.0, 1.0)), h3(i + vec3f(1.0, 0.0, 1.0)), f.x),
        mix(h3(i + vec3f(0.0, 1.0, 1.0)), h3(i + vec3f(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

// Grid constants shared by every kernel.
export struct Grid {
  n: vec2i,   // cells in x (axial) and y (radial)
  h: f32,     // cell size
  dt: f32,    // time step
  t0: f32,    // chamber temperature / ambient
}

// The primitive state of cell `c`, with the reference's ghost handling:
// below the axis -> mirror, outside x / above the top -> zero-gradient.
export fn ghostCell(c: vec2i, n: vec2i) -> vec3i {
  var q = c;
  var m = 0;
  if (q.y < 0) { q.y = -q.y - 1; m = 1; }
  q = clamp(q, vec2i(0), n - 1);
  return vec3i(q, m);
}

export fn isSolidCell(c: vec2i, n: vec2i, h: f32) -> bool {
  if (c.y < 0 || c.x < 0 || c.x >= n.x || c.y >= n.y) { return false; }
  return solidAt((vec2f(c) + 0.5) * h);
}
