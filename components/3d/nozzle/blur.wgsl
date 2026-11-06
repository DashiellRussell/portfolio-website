// Separable 9-tap Gaussian, as linear-filtered 5 taps (FS_BLUR in the reference).
struct Blur {
  dir: vec2f,  // step in source texels' uv
  out: vec2f,  // destination size in px
}

@group(0) @binding(0) var<uniform> blur: Blur;
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var srcSampler: sampler;

fn tap(uv: vec2f) -> vec3f {
  return textureSampleLevel(src, srcSampler, uv, 0.0).rgb;
}

@fragment
fn fs_main(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let uv = pos.xy / blur.out;
  var c = tap(uv) * 0.2270;
  c += (tap(uv + blur.dir * 1.3846) + tap(uv - blur.dir * 1.3846)) * 0.3162;
  c += (tap(uv + blur.dir * 3.2308) + tap(uv - blur.dir * 3.2308)) * 0.0703;
  return vec4f(c, 1.0);
}
