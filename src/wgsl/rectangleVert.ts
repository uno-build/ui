export default /* wgsl */ `
struct Viewport {
  size: vec2f,
  padding: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
}

@group(0) @binding(0) var<uniform> viewport: Viewport;

@vertex
fn main(
  @location(0) position: vec2f,
  @location(1) rect: vec4f,
  @location(2) color: vec4f,
) -> VertexOutput {
  let pixel = rect.xy + position * rect.zw;
  let clip = vec2f(
    pixel.x / viewport.size.x * 2.0 - 1.0,
    1.0 - pixel.y / viewport.size.y * 2.0,
  );

  var output: VertexOutput;
  output.position = vec4f(clip, 0.0, 1.0);
  output.color = color;
  return output;
}
`
