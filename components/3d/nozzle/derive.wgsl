// Display fields per cell (FS_DER in the reference), written to a filterable
// rgba16float texture the glow pass samples bilinearly:
//   x Mach, y T/T_amb, z log10 p/p_amb, w |grad ln rho|
// Wall cells take the average of their open neighbours so the glow does not
// pick up the solver's frozen in-wall values at the boundary.
import { GAM, Grid, toPrim, ghostCell, isSolidCell } from "./common.wgsl";

@group(0) @binding(0) var<uniform> grid: Grid;
@group(0) @binding(1) var<storage, read> src: array<vec4f>;
@group(0) @binding(2) var fields: texture_storage_2d<rgba16float, write>;

fn getP(c: vec2i) -> vec4f {
  let g = ghostCell(c, grid.n);
  var W = toPrim(src[g.y * grid.n.x + g.x]);
  if (g.z == 1) { W.z = -W.z; }
  return W;
}

fn derive(c: vec2i) -> vec4f {
  let W = getP(c);
  let cs = sqrt(GAM * W.w / W.x);
  return vec4f(length(W.yz) / cs, W.w / W.x, log(W.w) * 0.4342945, 0.0);
}

fn rho(q: vec2i, rc: f32) -> f32 {
  if (isSolidCell(q, grid.n, grid.h)) { return rc; }
  return getP(q).x;
}

@compute @workgroup_size(16, 8)
fn cs_main(@builtin(global_invocation_id) id: vec3u) {
  let c = vec2i(id.xy);
  if (c.x >= grid.n.x || c.y >= grid.n.y) { return; }
  if (isSolidCell(c, grid.n, grid.h)) {
    var acc = vec4f(0.0);
    var cnt = 0.0;
    for (var dy = -1; dy <= 1; dy++) {
      for (var dx = -1; dx <= 1; dx++) {
        let q = c + vec2i(dx, dy);
        if (!isSolidCell(q, grid.n, grid.h)) { acc += derive(q); cnt += 1.0; }
      }
    }
    textureStore(fields, c, select(vec4f(0.0, 1.0, 0.0, 0.0), acc / max(cnt, 1.0), cnt > 0.0));
    return;
  }
  var D = derive(c);
  let rc = getP(c).x;
  let g = vec2f(
    log(rho(c + vec2i(1, 0), rc)) - log(rho(c - vec2i(1, 0), rc)),
    log(rho(c + vec2i(0, 1), rc)) - log(rho(c - vec2i(0, 1), rc))) * 0.5;
  D.w = length(g);
  textureStore(fields, c, D);
}
