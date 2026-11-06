// Bakes three.js's RoomEnvironment (examples/jsm/environments) into an
// equirect atlas of GGX-prefiltered levels, once, at startup.
//
// three bakes it by rendering the scene into a cube map and blurring it
// (PMREMGenerator). Here the room is ray-traced instead: it is one room box
// lit by a point light, six boxes inside it, and six emissive panels, so each
// direction is a handful of ray/box tests. Each level integrates a GGX lobe
// of its roughness with a Hammersley sequence (N = V = R, as split-sum IBL
// assumes), so standard.wgsl can read radiance for any roughness and
// irradiance from the roughest level, as three's textureCubeUV does.

import { PI, BRDF_GGX, BRDF_Lambert, getDistanceAttenuation, equirectToDir } from "./pbr.wgsl";

struct Bake {
  rect: vec4f,     // this level's rectangle in the atlas, px
  roughness: f32,
  samples: u32,
}
@group(0) @binding(0) var<uniform> bake: Bake;

struct Hit { t: f32, n: vec3f, emit: f32 }

// Ray against a box made from BoxGeometry(1,1,1) with position, Y rotation and
// scale, as RoomEnvironment places them. `inside` returns the exit face.
fn box(ro: vec3f, rd: vec3f, pos: vec3f, ry: f32, scale: vec3f, inside: bool, emit: f32, best: Hit) -> Hit {
  let c = cos(ry);
  let s = sin(ry);
  // world -> local: undo translation, then rotation (R_y(-ry)), then scale
  let o = ro - pos;
  let lo = vec3f(c * o.x - s * o.z, o.y, s * o.x + c * o.z) / scale;
  let ld = vec3f(c * rd.x - s * rd.z, rd.y, s * rd.x + c * rd.z) / scale;
  let inv = 1.0 / ld;
  let t0 = (vec3f(-0.5) - lo) * inv;
  let t1 = (vec3f(0.5) - lo) * inv;
  let tmin = min(t0, t1);
  let tmax = max(t0, t1);
  let tn = max(max(tmin.x, tmin.y), tmin.z);
  let tf = min(min(tmax.x, tmax.y), tmax.z);
  if (tf < max(tn, 0.0)) { return best; }
  var t = tn;
  var ln: vec3f;
  if (inside) {
    t = tf;
    // exit face, normal pointing back into the room (BackSide)
    if (tf == tmax.x) { ln = vec3f(-sign(ld.x), 0.0, 0.0); }
    else if (tf == tmax.y) { ln = vec3f(0.0, -sign(ld.y), 0.0); }
    else { ln = vec3f(0.0, 0.0, -sign(ld.z)); }
  } else {
    if (tn <= 0.0) { return best; }
    if (tn == tmin.x) { ln = vec3f(-sign(ld.x), 0.0, 0.0); }
    else if (tn == tmin.y) { ln = vec3f(0.0, -sign(ld.y), 0.0); }
    else { ln = vec3f(0.0, 0.0, -sign(ld.z)); }
  }
  if (t >= best.t) { return best; }
  // local -> world normal: inverse-transpose of scale, then the rotation
  let sn = ln / scale;
  let wn = normalize(vec3f(c * sn.x + s * sn.z, sn.y, -s * sn.x + c * sn.z));
  return Hit(t, wn, emit);
}

// Radiance seen from the room's origin along `rd`, linear HDR.
fn trace(rd: vec3f) -> vec3f {
  let ro = vec3f(0.0);
  var h = Hit(1e9, vec3f(0.0, 1.0, 0.0), 0.0);
  h = box(ro, rd, vec3f(-0.757, 13.219, 0.717), 0.0, vec3f(31.713, 28.305, 28.591), true, 0.0, h);
  h = box(ro, rd, vec3f(-10.906, 2.009, 1.846), -0.195, vec3f(2.328, 7.905, 4.651), false, 0.0, h);
  h = box(ro, rd, vec3f(-5.607, -0.754, -0.758), 0.994, vec3f(1.970, 1.534, 3.955), false, 0.0, h);
  h = box(ro, rd, vec3f(6.167, 0.857, 7.803), 0.561, vec3f(3.927, 6.285, 3.687), false, 0.0, h);
  h = box(ro, rd, vec3f(-2.017, 0.018, 6.124), 0.333, vec3f(2.002, 4.566, 2.064), false, 0.0, h);
  h = box(ro, rd, vec3f(2.291, -0.756, -2.621), -0.286, vec3f(1.546, 1.552, 1.496), false, 0.0, h);
  h = box(ro, rd, vec3f(-2.193, -0.369, -5.547), 0.516, vec3f(3.875, 3.487, 2.986), false, 0.0, h);
  // emissive panels: MeshLambertMaterial, black, emissive white x intensity
  h = box(ro, rd, vec3f(-16.116, 14.37, 8.208), 0.0, vec3f(0.1, 2.428, 2.739), false, 50.0, h);
  h = box(ro, rd, vec3f(-16.109, 18.021, -8.207), 0.0, vec3f(0.1, 2.425, 2.751), false, 50.0, h);
  h = box(ro, rd, vec3f(14.904, 12.198, -1.832), 0.0, vec3f(0.15, 4.265, 6.331), false, 17.0, h);
  h = box(ro, rd, vec3f(-0.462, 8.89, 14.520), 0.0, vec3f(4.38, 5.441, 0.088), false, 43.0, h);
  h = box(ro, rd, vec3f(3.235, 11.486, -12.541), 0.0, vec3f(2.5, 2.0, 0.1), false, 20.0, h);
  h = box(ro, rd, vec3f(0.0, 20.0, 0.0), 0.0, vec3f(1.0, 0.1, 1.0), false, 100.0, h);
  if (h.emit > 0.0) { return vec3f(h.emit); }
  if (h.t >= 1e9) { return vec3f(0.0); }
  // room and boxes: MeshStandardMaterial defaults (white, roughness 1,
  // metalness 0) lit by PointLight(0xffffff, 900, 28, 2), no shadows
  let p = ro + rd * h.t;
  let toL = vec3f(0.418, 16.199, 0.300) - p;
  let d = length(toL);
  let l = toL / d;
  let irradiance = saturate(dot(h.n, l)) * 900.0 * getDistanceAttenuation(d, 28.0, 2.0);
  let v = -rd;
  return irradiance * (BRDF_Lambert(vec3f(1.0)) + BRDF_GGX(l, v, h.n, vec3f(0.04), 1.0, 1.0));
}

fn radicalInverse(bitsIn: u32) -> f32 {
  var bits = (bitsIn << 16u) | (bitsIn >> 16u);
  bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
  bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
  bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
  bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
  return f32(bits) * 2.3283064365386963e-10;
}

@fragment
fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = (pos.xy - bake.rect.xy) / bake.rect.zw;
  let N = equirectToDir(uv);
  if (bake.roughness <= 0.0) {
    // sharp level: a 2x2 supersample so the panel edges do not alias
    let px = vec2f(0.25) / bake.rect.zw;
    let c = trace(N) + trace(equirectToDir(uv + vec2f(px.x, 0.0)))
          + trace(equirectToDir(uv + vec2f(0.0, px.y))) + trace(equirectToDir(uv + px));
    return vec4f(c * 0.25, 1.0);
  }
  // tangent frame around N
  var up = vec3f(0.0, 1.0, 0.0);
  if (abs(N.y) > 0.999) { up = vec3f(1.0, 0.0, 0.0); }
  let T = normalize(cross(up, N));
  let B = cross(N, T);
  let a = bake.roughness * bake.roughness;
  var sum = vec3f(0.0);
  var weight = 0.0;
  for (var i = 0u; i < bake.samples; i++) {
    let xi = vec2f(f32(i) / f32(bake.samples), radicalInverse(i));
    // GGX importance sample of the half vector
    let phi = 2.0 * PI * xi.x;
    let cosT = sqrt((1.0 - xi.y) / (1.0 + (a * a - 1.0) * xi.y));
    let sinT = sqrt(1.0 - cosT * cosT);
    let H = normalize(T * (cos(phi) * sinT) + B * (sin(phi) * sinT) + N * cosT);
    let L = 2.0 * dot(N, H) * H - N;
    let nl = dot(N, L);
    if (nl > 0.0) {
      sum += trace(L) * nl;
      weight += nl;
    }
  }
  return vec4f(sum / max(weight, 1e-4), 1.0);
}
