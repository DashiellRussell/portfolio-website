// Visual render (FS_VIS in the reference), now a lookup: project.wgsl has
// already integrated the glow along every camera ray in sim space, so each
// pixel maps itself to (x, |y|) on the axis plane and takes one bilinear
// sample. Drawn at half resolution, then blurred and composited by display.wgsl.

struct Vis {
  fit: vec3f,   // origin (px, GL convention: y up) and px per sim unit
  rot: f32,     // 1 = engine fires downward (portrait)
  span: vec2f,  // sim units the projection covers: x, |y|
  xv: f32,      // displayed length
  height: f32,  // this target's height in px, to flip into the GL convention
}

@group(0) @binding(0) var<uniform> vis: Vis;
@group(0) @binding(1) var glowTex: texture_2d<f32>;
@group(0) @binding(2) var glowSampler: sampler;

@fragment
fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let fc = vec2f(pos.x, vis.height - pos.y);
  let d = (fc - vis.fit.xy) / vis.fit.z;
  var q = d;
  if (vis.rot > 0.5) { q = vec2f(-d.y, d.x); }
  let y = abs(q.y);
  if (q.x < 0.0 || q.x > vis.xv || y >= 0.5) { return vec4f(0.0, 0.0, 0.0, 1.0); }
  return vec4f(textureSampleLevel(glowTex, glowSampler, vec2f(q.x, y) / vis.span, 0.0).rgb, 1.0);
}
