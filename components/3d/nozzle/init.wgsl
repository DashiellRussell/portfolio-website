// Ambient air at rest everywhere (FS_INIT in the reference).
import { Grid, toCons } from "./common.wgsl";

@group(0) @binding(0) var<uniform> grid: Grid;
@group(0) @binding(1) var<storage, read_write> dst: array<vec4f>;

@compute @workgroup_size(16, 8)
fn cs_main(@builtin(global_invocation_id) id: vec3u) {
  let c = vec2i(id.xy);
  if (c.x >= grid.n.x || c.y >= grid.n.y) { return; }
  dst[c.y * grid.n.x + c.x] = toCons(vec4f(1.0, 0.0, 0.0, 1.0));
}
