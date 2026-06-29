export const nodeVertexWGSL = /* wgsl */ `
struct Viewport {
    size: vec2f,
    padding: vec2f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) local_position: vec2f,
    @location(1) rect_size: vec2f,
    @location(2) clipping: vec4f,
    @location(3) opacity: f32,
    @location(4) border_radius_x: vec4f,
    @location(5) border_radius_y: vec4f,
    @location(6) border_top_color: vec4f,
    @location(7) border_right_color: vec4f,
    @location(8) border_bottom_color: vec4f,
    @location(9) border_left_color: vec4f,
    @location(10) border_widths: vec4f,
    @location(11) background_color: vec4f,
    @location(12) background_image_mode: f32,
    @location(13) background_uv_rect: vec4f,
    @location(14) background_image_size: vec2f,
}

@group(0) @binding(0) var<uniform> viewport: Viewport;

@vertex
fn main(
    @location(0) position: vec2f,
    @location(1) layout_node: vec4f,
    @location(2) clipping: vec4f,
    @location(3) opacity: f32,
    @location(4) border_radius_x: vec4f,
    @location(5) border_radius_y: vec4f,
    @location(6) border_top_color: vec4f,
    @location(7) border_right_color: vec4f,
    @location(8) border_bottom_color: vec4f,
    @location(9) border_left_color: vec4f,
    @location(10) border_widths: vec4f,
    @location(11) background_color: vec4f,
    @location(12) background_image_mode: f32,
    @location(13) background_uv_rect: vec4f,
    @location(14) background_image_size: vec2f,
) -> VertexOutput {
    let local_position = position * layout_node.zw;
    let pixel = layout_node.xy + local_position;
    let clip = vec2f(
        pixel.x / viewport.size.x * 2.0 - 1.0,
        1.0 - pixel.y / viewport.size.y * 2.0,
    );

    var output: VertexOutput;
    output.position = vec4f(clip, 0.0, 1.0);
    output.local_position = local_position;
    output.rect_size = layout_node.zw;
    output.clipping = clipping;
    output.opacity = opacity;
    output.border_radius_x = border_radius_x;
    output.border_radius_y = border_radius_y;
    output.border_top_color = border_top_color;
    output.border_right_color = border_right_color;
    output.border_bottom_color = border_bottom_color;
    output.border_left_color = border_left_color;
    output.border_widths = border_widths;
    output.background_color = background_color;
    output.background_image_mode = background_image_mode;
    output.background_uv_rect = background_uv_rect;
    output.background_image_size = background_image_size;
    return output;
}
`

export const nodeFragmentWGSL = /* wgsl */ `
struct FragmentInput {
    @location(0) local_position: vec2f,
    @location(1) rect_size: vec2f,
    @location(2) clipping: vec4f,
    @location(3) opacity: f32,
    @location(4) border_radius_x: vec4f,
    @location(5) border_radius_y: vec4f,
    @location(6) border_top_color: vec4f,
    @location(7) border_right_color: vec4f,
    @location(8) border_bottom_color: vec4f,
    @location(9) border_left_color: vec4f,
    @location(10) border_widths: vec4f,
    @location(11) background_color: vec4f,
    @location(12) background_image_mode: f32,
    @location(13) background_uv_rect: vec4f,
    @location(14) background_image_size: vec2f,
}

@group(0) @binding(1) var background_image_sampler: sampler;
@group(0) @binding(2) var background_image_texture: texture_2d<f32>;

fn cornerRadius(
    local_position: vec2f,
    rect_size: vec2f,
    border_radius_x: vec4f,
    border_radius_y: vec4f,
) -> vec2f {
    let top_radius = select(
        vec2f(border_radius_x.y, border_radius_y.y),
        vec2f(border_radius_x.x, border_radius_y.x),
        local_position.x < rect_size.x * 0.5,
    );
    let bottom_radius = select(
        vec2f(border_radius_x.z, border_radius_y.z),
        vec2f(border_radius_x.w, border_radius_y.w),
        local_position.x < rect_size.x * 0.5,
    );

    return select(bottom_radius, top_radius, local_position.y < rect_size.y * 0.5);
}

fn roundedRectCoverage(
    local_position: vec2f,
    rect_size: vec2f,
    border_radius_x: vec4f,
    border_radius_y: vec4f,
) -> f32 {
    let border_radius = cornerRadius(
        local_position,
        rect_size,
        border_radius_x,
        border_radius_y,
    );
    let radius = min(border_radius, rect_size * 0.5);
    let rect_distance = min(
        min(local_position.x, local_position.y),
        min(rect_size.x - local_position.x, rect_size.y - local_position.y),
    );
    let corner_distance = min(local_position, rect_size - local_position);
    let corner_delta = max(radius - corner_distance, vec2f(0.0));
    let rounded_distance = 1.0 - length(corner_delta / max(radius, vec2f(0.0001)));
    let distance = select(rect_distance, rounded_distance, all(radius > vec2f(0.0)));
    let antialias = max(fwidth(distance) * 0.5, 0.0001);

    return smoothstep(-antialias, antialias, distance);
}

fn compositeOver(top: vec4f, bottom: vec4f) -> vec4f {
    let alpha = top.a + bottom.a * (1.0 - top.a);
    let color =
        (top.rgb * top.a + bottom.rgb * bottom.a * (1.0 - top.a)) /
        max(alpha, 0.0001);

    return vec4f(color, alpha);
}

fn borderColorForPosition(input: FragmentInput) -> vec4f {
    let left_distance = input.local_position.x;
    let right_distance = input.rect_size.x - input.local_position.x;
    let top_distance = input.local_position.y;
    let bottom_distance = input.rect_size.y - input.local_position.y;
    let horizontal_color = select(
        input.border_left_color,
        input.border_right_color,
        right_distance < left_distance,
    );
    let vertical_color = select(
        input.border_top_color,
        input.border_bottom_color,
        bottom_distance < top_distance,
    );
    let horizontal_distance = min(left_distance, right_distance);
    let vertical_distance = min(top_distance, bottom_distance);

    return select(vertical_color, horizontal_color, horizontal_distance < vertical_distance);
}

fn backgroundImageColor(input: FragmentInput, local_position: vec2f, rect_size: vec2f) -> vec4f {
    let scale = max(
        rect_size.x / input.background_image_size.x,
        rect_size.y / input.background_image_size.y,
    );
    let scaled_size = input.background_image_size * scale;
    let offset = (scaled_size - rect_size) * 0.5;
    let image_uv = (local_position + offset) / scaled_size;
    let texture_uv = input.background_uv_rect.xy + image_uv * input.background_uv_rect.zw;

    return textureSampleLevel(background_image_texture, background_image_sampler, texture_uv, 0.0);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    if (
        input.local_position.x < input.clipping.w ||
        input.local_position.y < input.clipping.x ||
        input.local_position.x > input.rect_size.x - input.clipping.y ||
        input.local_position.y > input.rect_size.y - input.clipping.z
    ) {
        discard;
    }

    let outer_coverage = roundedRectCoverage(
        input.local_position,
        input.rect_size,
        input.border_radius_x,
        input.border_radius_y,
    );
    let border_top_width = input.border_widths.x;
    let border_right_width = input.border_widths.y;
    let border_bottom_width = input.border_widths.z;
    let border_left_width = input.border_widths.w;
    let inner_size = input.rect_size - vec2f(
        border_left_width + border_right_width,
        border_top_width + border_bottom_width,
    );
    let inner_position = input.local_position - vec2f(border_left_width, border_top_width);
    let inner_border_radius_x = max(
        input.border_radius_x - vec4f(
            border_left_width,
            border_right_width,
            border_right_width,
            border_left_width,
        ),
        vec4f(0.0),
    );
    let inner_border_radius_y = max(
        input.border_radius_y - vec4f(
            border_top_width,
            border_top_width,
            border_bottom_width,
            border_bottom_width,
        ),
        vec4f(0.0),
    );
    let inner_coverage = select(
        0.0,
        roundedRectCoverage(
            inner_position,
            inner_size,
            inner_border_radius_x,
            inner_border_radius_y,
        ),
        all(inner_size > vec2f(0.0)),
    );

    var color = input.background_color;
    if (input.background_image_mode > 0.5 && all(inner_size > vec2f(0.0))) {
        color = compositeOver(
            backgroundImageColor(input, inner_position, inner_size),
            input.background_color,
        );
    }
    if (any(input.border_widths > vec4f(0.0))) {
        let border_color = compositeOver(borderColorForPosition(input), color);
        color = mix(border_color, color, inner_coverage);
    }
    color.a *= outer_coverage * input.opacity;

    return color;
}
`
