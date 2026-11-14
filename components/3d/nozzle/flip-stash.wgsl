// Flipbook capture, first half (see nozzle-gpu.ts): the flipbook stores two
// frames per texel, so an even frame waits here until the odd one after it.
// Only what the glow reads is kept: T/T_amb and log10 p/p_amb (fields.yz),
// over the displayed region, which starts at the grid's origin.

@group(0) @binding(0) var fields: texture_2d<f32>;
@group(0) @binding(1) var stashOut: texture_storage_2d<rgba16float, write>;

@compute @workgroup_size(16, 8)
fn cs_main(@builtin(global_invocation_id) id: vec3u) {
  let size = textureDimensions(stashOut);
  if (id.x >= size.x || id.y >= size.y) { return; }
  let f = textureLoad(fields, vec2i(id.xy), 0);
  textureStore(stashOut, vec2i(id.xy), vec4f(f.yz, 0.0, 0.0));
}
