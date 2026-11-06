// One shader for every mesh in a three.js scene drawn by the vgpu renderer:
// MeshStandardMaterial and MeshPhysicalMaterial (with the extensions the
// models use: ior, specular intensity, clearcoat, an approximation of
// transmission), MeshBasicMaterial (unlit), with color and alpha maps.
// The lighting is three's physical model; see pbr.wgsl.

import {
  PI, RECIPROCAL_PI, EPSILON, F_Schlick, BRDF_Lambert, BRDF_GGX,
  getDistanceAttenuation, AgXToneMapping, linearToSRGB, sampleEnv,
} from "./pbr.wgsl";

// Shared by every draw (one `uniforms(gpu)` object), updated once per frame.
struct Scene {
  viewProj: mat4x4f,
  cameraPos: vec3f,
  exposure: f32,
  ambient: vec3f,
  envIntensity: f32,
  dirDir: array<vec4f, 2>,    // xyz: direction toward the light
  dirColor: array<vec4f, 2>,  // rgb: color x intensity
  pointPos: array<vec4f, 2>,  // xyz: position, w: cutoff distance
  pointColor: array<vec4f, 2>, // rgb: color x intensity, w: decay
  counts: vec4u,              // x: directional, y: point, z: tone map on
}

struct Object {
  model: mat4x4f,
  normalMatrix: mat4x4f,
}

struct Material {
  color: vec3f,
  opacity: f32,
  emissive: vec3f,
  roughness: f32,
  metalness: f32,
  ior: f32,
  specularIntensity: f32,
  clearcoat: f32,
  clearcoatRoughness: f32,
  transmission: f32,
  flags: u32, // 1 map, 2 alphaMap, 4 unlit, 8 toneMapped, 16 double sided
  pad: f32,
}

@group(0) @binding(0) var<uniform> scene: Scene;
@group(0) @binding(1) var<uniform> object: Object;
@group(0) @binding(2) var<uniform> material: Material;
@group(0) @binding(3) var map: texture_2d<f32>;
@group(0) @binding(4) var alphaMap: texture_2d<f32>;
@group(0) @binding(5) var mapSampler: sampler;
@group(0) @binding(6) var envAtlas: texture_2d<f32>;
@group(0) @binding(7) var dfgLUT: texture_2d<f32>;
@group(0) @binding(8) var clampSampler: sampler;

struct VOut {
  @builtin(position) position: vec4f,
  @location(0) worldPos: vec3f,
  @location(1) normal: vec3f,
  @location(2) uv: vec2f,
}

@vertex
fn vs_main(@location(0) position: vec3f, @location(1) normal: vec3f, @location(2) uv: vec2f) -> VOut {
  var o: VOut;
  let world = object.model * vec4f(position, 1.0);
  o.position = scene.viewProj * world;
  o.worldPos = world.xyz;
  o.normal = (object.normalMatrix * vec4f(normal, 0.0)).xyz;
  o.uv = uv;
  return o;
}

fn dfg(roughness: f32, dotNV: f32) -> vec2f {
  // 16x16 LUT: u = roughness, v = dot(N, V), sampled at texel centres as three's DataTexture is
  let uv = (vec2f(roughness, dotNV) * 15.0 + 0.5) / 16.0;
  return textureSampleLevel(dfgLUT, clampSampler, uv, 0.0).rg;
}

// computeMultiscattering (Fdez-Aguera), lights_physical_pars_fragment
fn multiscatter(Fr: vec3f, f90: f32, fab: vec2f, single: ptr<function, vec3f>, multi: ptr<function, vec3f>) {
  let FssEss = Fr * fab.x + f90 * fab.y;
  let Ess = fab.x + fab.y;
  let Ems = 1.0 - Ess;
  let Favg = Fr + (1.0 - Fr) * 0.047619;
  let Fms = FssEss * Favg / (1.0 - Ems * Favg);
  *single += FssEss;
  *multi += Fms * Ems;
}

@fragment
fn fs_main(v: VOut, @builtin(front_facing) front: bool) -> @location(0) vec4f {
  // derivatives first, while control flow is still uniform
  let nonPerturbed = normalize(v.normal);
  let dxy = max(abs(dpdx(nonPerturbed)), abs(dpdy(nonPerturbed)));
  let geometryRoughness = max(max(dxy.x, dxy.y), dxy.z);
  let texel = textureSample(map, mapSampler, v.uv);
  let alphaTexel = textureSample(alphaMap, mapSampler, v.uv);

  var diffuseColor = vec4f(material.color, material.opacity);
  if ((material.flags & 1u) != 0u) { diffuseColor *= texel; }
  if ((material.flags & 2u) != 0u) { diffuseColor.a *= alphaTexel.g; }

  var outgoing: vec3f;
  if ((material.flags & 4u) != 0u) {
    outgoing = diffuseColor.rgb; // MeshBasicMaterial: unlit
  } else {
    var N = nonPerturbed;
    // double-sided faces turn their normal toward the viewer (three's faceDirection)
    if ((material.flags & 16u) != 0u && !front) { N = -N; }
    let V = normalize(scene.cameraPos - v.worldPos);

    // lights_physical_fragment
    let metalness = material.metalness;
    let diffuseContribution = diffuseColor.rgb * (1.0 - metalness);
    let roughness = min(max(material.roughness, 0.0525) + geometryRoughness, 1.0);
    let ior = material.ior;
    let specularF90 = mix(material.specularIntensity, 1.0, metalness);
    let specularColor = min(vec3f(pow((ior - 1.0) / (ior + 1.0), 2.0)), vec3f(1.0)) * material.specularIntensity;
    let specularBlended = mix(specularColor, diffuseColor.rgb, metalness);
    let dotNV = saturate(dot(N, V));
    let dfgV = dfg(roughness, dotNV);

    var directDiffuse = vec3f(0.0);
    var directSpecular = vec3f(0.0);
    var ccSpecular = vec3f(0.0);
    let ccRoughness = min(max(material.clearcoatRoughness, 0.0525) + geometryRoughness, 1.0);

    // RE_Direct_Physical with BRDF_GGX_Multiscatter
    for (var i = 0u; i < 4u; i++) {
      var L: vec3f;
      var color: vec3f;
      if (i < 2u) {
        if (i >= scene.counts.x) { continue; }
        L = normalize(scene.dirDir[i].xyz);
        color = scene.dirColor[i].rgb;
      } else {
        let k = i - 2u;
        if (k >= scene.counts.y) { continue; }
        let toL = scene.pointPos[k].xyz - v.worldPos;
        let d = length(toL);
        L = toL / d;
        color = scene.pointColor[k].rgb * getDistanceAttenuation(d, scene.pointPos[k].w, scene.pointColor[k].w);
      }
      let dotNL = saturate(dot(N, L));
      let irradiance = dotNL * color;
      let single = BRDF_GGX(L, V, N, specularBlended, specularF90, roughness);
      let dfgL = dfg(roughness, dotNL);
      let FssEssV = specularBlended * dfgV.x + specularF90 * dfgV.y;
      let FssEssL = specularBlended * dfgL.x + specularF90 * dfgL.y;
      let EmsV = 1.0 - (dfgV.x + dfgV.y);
      let EmsL = 1.0 - (dfgL.x + dfgL.y);
      let Favg = specularBlended + (1.0 - specularBlended) * 0.047619;
      let Fms = FssEssV * FssEssL * Favg / (1.0 - EmsV * EmsL * Favg + EPSILON);
      directSpecular += irradiance * (single + Fms * EmsV * EmsL);
      directDiffuse += irradiance * BRDF_Lambert(diffuseContribution);
      if (material.clearcoat > 0.0) {
        ccSpecular += irradiance * BRDF_GGX(L, V, N, vec3f(0.04), 1.0, ccRoughness);
      }
    }

    // ambient light -> RE_IndirectDiffuse_Physical
    var indirectDiffuse = scene.ambient * BRDF_Lambert(diffuseContribution);

    // environment -> getIBLIrradiance / getIBLRadiance / RE_IndirectSpecular_Physical
    let iblIrradiance = PI * sampleEnv(envAtlas, clampSampler, N, 1.0) * scene.envIntensity;
    var R = reflect(-V, N);
    R = normalize(mix(R, N, roughness * roughness * roughness * roughness));
    let radiance = sampleEnv(envAtlas, clampSampler, R, roughness) * scene.envIntensity;
    var ssD = vec3f(0.0); var msD = vec3f(0.0);
    var ssM = vec3f(0.0); var msM = vec3f(0.0);
    multiscatter(specularColor, specularF90, dfgV, &ssD, &msD);
    multiscatter(diffuseColor.rgb, specularF90, dfgV, &ssM, &msM);
    let single = mix(ssD, ssM, metalness);
    let multi = mix(msD, msM, metalness);
    let cosineWeighted = iblIrradiance * RECIPROCAL_PI;
    let indirectSpecular = radiance * single + multi * cosineWeighted;
    indirectDiffuse += diffuseContribution * (1.0 - (ssD + msD)) * cosineWeighted;

    var totalDiffuse = directDiffuse + indirectDiffuse;
    // transmission, approximated: the tinted acrylic lets the scene behind show
    // through (drawn in the transparent pass) instead of refracting a capture
    totalDiffuse *= 1.0 - material.transmission;
    outgoing = totalDiffuse + directSpecular + indirectSpecular + material.emissive;

    if (material.clearcoat > 0.0) {
      let ccRadiance = sampleEnv(envAtlas, clampSampler, R, ccRoughness) * scene.envIntensity;
      let ccDfg = dfg(ccRoughness, dotNV);
      let ccIndirect = ccRadiance * (vec3f(0.04) * ccDfg.x + ccDfg.y);
      let Fcc = F_Schlick(vec3f(0.04), 1.0, dotNV);
      outgoing = outgoing * (1.0 - material.clearcoat * Fcc) + (ccSpecular + ccIndirect) * material.clearcoat;
    }
  }

  var color = outgoing;
  if ((material.flags & 8u) != 0u && scene.counts.z != 0u) { color = AgXToneMapping(color, scene.exposure); }
  return vec4f(linearToSRGB(color), diffuseColor.a);
}
