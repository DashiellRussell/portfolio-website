// Shading functions ported from three.js r182's GLSL chunks (MIT), so the
// vgpu renderer lights a MeshStandard/MeshPhysical material the way
// three's WebGLRenderer does: GGX + Smith-correlated visibility, Schlick
// Fresnel, split-sum IBL through three's DFG LUT, multiscatter energy
// compensation, Frostbite distance attenuation and AgX tone mapping.

export const PI: f32 = 3.141592653589793;
export const RECIPROCAL_PI: f32 = 0.3183098861837907;
export const EPSILON: f32 = 1e-6;

fn pow2(x: f32) -> f32 { return x * x; }

// common.glsl.js
export fn F_Schlick(f0: vec3f, f90: f32, dotVH: f32) -> vec3f {
  let fresnel = exp2((-5.55473 * dotVH - 6.98316) * dotVH);
  return f0 * (1.0 - fresnel) + (f90 * fresnel);
}

export fn BRDF_Lambert(diffuseColor: vec3f) -> vec3f {
  return RECIPROCAL_PI * diffuseColor;
}

// lights_physical_pars_fragment.glsl.js
export fn V_GGX_SmithCorrelated(alpha: f32, dotNL: f32, dotNV: f32) -> f32 {
  let a2 = pow2(alpha);
  let gv = dotNL * sqrt(a2 + (1.0 - a2) * pow2(dotNV));
  let gl = dotNV * sqrt(a2 + (1.0 - a2) * pow2(dotNL));
  return 0.5 / max(gv + gl, EPSILON);
}

export fn D_GGX(alpha: f32, dotNH: f32) -> f32 {
  let a2 = pow2(alpha);
  let denom = pow2(dotNH) * (a2 - 1.0) + 1.0;
  return RECIPROCAL_PI * a2 / pow2(denom);
}

export fn BRDF_GGX(lightDir: vec3f, viewDir: vec3f, normal: vec3f, f0: vec3f, f90: f32, roughness: f32) -> vec3f {
  let alpha = pow2(roughness);
  let halfDir = normalize(lightDir + viewDir);
  let dotNL = saturate(dot(normal, lightDir));
  let dotNV = saturate(dot(normal, viewDir));
  let dotNH = saturate(dot(normal, halfDir));
  let dotVH = saturate(dot(viewDir, halfDir));
  let F = F_Schlick(f0, f90, dotVH);
  let V = V_GGX_SmithCorrelated(alpha, dotNL, dotNV);
  let D = D_GGX(alpha, dotNH);
  return F * (V * D);
}

// lights_pars_begin.glsl.js
export fn getDistanceAttenuation(lightDistance: f32, cutoffDistance: f32, decayExponent: f32) -> f32 {
  var distanceFalloff = 1.0 / max(pow(lightDistance, decayExponent), 0.01);
  if (cutoffDistance > 0.0) {
    let r = lightDistance / cutoffDistance;
    distanceFalloff *= pow2(saturate(1.0 - r * r * r * r));
  }
  return distanceFalloff;
}

// tonemapping_pars_fragment.glsl.js. WGSL mat3x3 constructors take columns,
// exactly like GLSL's mat3(vec3, vec3, vec3), so the constants copy over.
const LINEAR_SRGB_TO_LINEAR_REC2020 = mat3x3f(
  vec3f(0.6274, 0.0691, 0.0164),
  vec3f(0.3293, 0.9195, 0.0880),
  vec3f(0.0433, 0.0113, 0.8956));
const LINEAR_REC2020_TO_LINEAR_SRGB = mat3x3f(
  vec3f(1.6605, -0.1246, -0.0182),
  vec3f(-0.5876, 1.1329, -0.1006),
  vec3f(-0.0728, -0.0083, 1.1187));
const AgXInsetMatrix = mat3x3f(
  vec3f(0.856627153315983, 0.137318972929847, 0.11189821299995),
  vec3f(0.0951212405381588, 0.761241990602591, 0.0767994186031903),
  vec3f(0.0482516061458583, 0.101439036467562, 0.811302368396859));
const AgXOutsetMatrix = mat3x3f(
  vec3f(1.1271005818144368, -0.1413297634984383, -0.14132976349843826),
  vec3f(-0.11060664309660323, 1.157823702216272, -0.11060664309660294),
  vec3f(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405));

fn agxDefaultContrastApprox(x: vec3f) -> vec3f {
  let x2 = x * x;
  let x4 = x2 * x2;
  return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
}

export fn AgXToneMapping(colorIn: vec3f, exposure: f32) -> vec3f {
  let AgxMinEv = -12.47393;
  let AgxMaxEv = 4.026069;
  var color = colorIn * exposure;
  color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
  color = AgXInsetMatrix * color;
  color = max(color, vec3f(1e-10));
  color = log2(color);
  color = (color - AgxMinEv) / (AgxMaxEv - AgxMinEv);
  color = clamp(color, vec3f(0.0), vec3f(1.0));
  color = agxDefaultContrastApprox(color);
  color = AgXOutsetMatrix * color;
  color = pow(max(vec3f(0.0), color), vec3f(2.2));
  color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
  return clamp(color, vec3f(0.0), vec3f(1.0));
}

// colorspace_pars_fragment.glsl.js: sRGBTransferOETF
export fn linearToSRGB(c: vec3f) -> vec3f {
  return mix(pow(c, vec3f(0.41666)) * 1.055 - vec3f(0.055), c * 12.92, vec3f(lessThanEqual3(c, vec3f(0.0031308))));
}
fn lessThanEqual3(a: vec3f, b: vec3f) -> vec3f {
  return vec3f(select(0.0, 1.0, a.x <= b.x), select(0.0, 1.0, a.y <= b.y), select(0.0, 1.0, a.z <= b.z));
}

// ---- environment: equirect atlas of GGX-prefiltered levels (see room-env.wgsl)

export const ENV_LEVELS: i32 = 7;

export fn dirToEquirect(d: vec3f) -> vec2f {
  let u = atan2(d.z, d.x) * (0.5 * RECIPROCAL_PI) + 0.5;
  let v = acos(clamp(d.y, -1.0, 1.0)) * RECIPROCAL_PI;
  return vec2f(u, v);
}

export fn equirectToDir(uv: vec2f) -> vec3f {
  let phi = (uv.x - 0.5) * 2.0 * PI;
  let theta = uv.y * PI;
  return vec3f(sin(theta) * cos(phi), cos(theta), sin(theta) * sin(phi));
}

// Level i's rectangle in the atlas, in pixels: (x, y, w, h).
export fn envLevelRect(i: i32) -> vec4f {
  if (i == 0) { return vec4f(0.0, 0.0, 256.0, 128.0); }
  if (i == 1) { return vec4f(0.0, 128.0, 128.0, 64.0); }
  if (i == 2) { return vec4f(0.0, 192.0, 64.0, 32.0); }
  return vec4f(0.0, 224.0 + 16.0 * f32(i - 3), 32.0, 16.0);
}
export const ENV_ATLAS: vec2f = vec2f(256.0, 288.0);

// Roughness of level i: evenly spaced, level 0 sharp, last level fully rough.
export fn envLevelRoughness(i: i32) -> f32 {
  return f32(i) / f32(ENV_LEVELS - 1);
}

fn sampleLevel(atlas: texture_2d<f32>, samp: sampler, i: i32, uv: vec2f) -> vec3f {
  let r = envLevelRect(i);
  // stay half a texel inside the level so bilinear never reads a neighbour
  let p = r.xy + clamp(uv * r.zw, vec2f(0.5), r.zw - vec2f(0.5));
  return textureSampleLevel(atlas, samp, p / ENV_ATLAS, 0.0).rgb;
}

// three's textureCubeUV(envMap, dir, roughness), on the equirect atlas
export fn sampleEnv(atlas: texture_2d<f32>, samp: sampler, dir: vec3f, roughness: f32) -> vec3f {
  let uv = dirToEquirect(normalize(dir));
  let f = clamp(roughness, 0.0, 1.0) * f32(ENV_LEVELS - 1);
  let i0 = i32(floor(f));
  let i1 = min(i0 + 1, ENV_LEVELS - 1);
  return mix(sampleLevel(atlas, samp, i0, uv), sampleLevel(atlas, samp, i1, uv), f - f32(i0));
}
