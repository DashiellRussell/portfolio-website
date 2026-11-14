// Flipbook capture, second half: writes one layer of the flipbook, the
// stashed even frame in .xy and the current (odd) frame in .zw, so playback
// gets either frame with a single filtered fetch.

struct Cap {
  layer: u32,
}

@group(0) @binding(0) var<uniform> cap: Cap;
@group(0) @binding(1) var fields: texture_2d<f32>;
@group(0) @binding(2) var stash: texture_2d<f32>;
@group(0) @binding(3) var flipOut: texture_storage_2d_array<rgba16float, write>;

@compute @workgroup_size(16, 8)
fn cs_main(@builtin(global_invocation_id) id: vec3u) {
  let size = textureDimensions(flipOut);
  if (id.x >= size.x || id.y >= size.y) { return; }
  let c = vec2i(id.xy);
  let even = textureLoad(stash, c, 0).xy;
  let odd = textureLoad(fields, c, 0).yz;
  textureStore(flipOut, c, cap.layer, vec4f(even, odd));
}
