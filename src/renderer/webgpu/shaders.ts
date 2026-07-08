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
    @location(3) opacity_image_mode_data: vec4f,
    @location(4) border_radius_x: vec4f,
    @location(5) border_radius_y: vec4f,
    @location(6) border_top_right_color: vec4f,
    @location(7) border_bottom_left_color: vec4f,
    @location(8) border_widths: vec4f,
    @location(9) background_color: vec4f,
    @location(10) box_shadow_rect: vec4f,
    @location(11) box_shadow_color: vec4f,
    @location(12) background_uv_rect: vec4f,
    @location(13) background_image_rect: vec4f,
}

@group(0) @binding(0) var<uniform> viewport: Viewport;

fn unpackBoxShadowI16(value: u32, shift: u32) -> f32 {
    let raw = (value >> shift) & 65535u;
    return select(f32(raw), f32(raw) - 65536.0, raw >= 32768u);
}

fn boxShadowOffset(box_shadow: vec4u) -> vec2f {
    return vec2f(
        unpackBoxShadowI16(box_shadow.x, 0u),
        unpackBoxShadowI16(box_shadow.x, 16u),
    );
}

fn boxShadowBlurSpread(box_shadow: vec4u) -> vec2f {
    return vec2f(
        max(unpackBoxShadowI16(box_shadow.y, 0u), 0.0),
        unpackBoxShadowI16(box_shadow.y, 16u),
    );
}

fn boxShadowHasColor(box_shadow: vec4u) -> bool {
    return ((box_shadow.z >> 24u) & 255u) > 0u;
}

fn boxShadowPadding(box_shadow: vec4u) -> vec4f {
    if (!boxShadowHasColor(box_shadow)) {
        return vec4f(0.0);
    }

    let offset = boxShadowOffset(box_shadow);
    let blur_spread = boxShadowBlurSpread(box_shadow);
    let extent = blur_spread.x + blur_spread.y;

    return vec4f(
        max(extent - offset.x, 0.0),
        max(extent - offset.y, 0.0),
        max(extent + offset.x, 0.0),
        max(extent + offset.y, 0.0),
    );
}

fn boxShadowRect(box_shadow: vec4u) -> vec4f {
    let offset = boxShadowOffset(box_shadow);
    let blur_spread = boxShadowBlurSpread(box_shadow);

    return vec4f(offset, blur_spread);
}

fn boxShadowColor(box_shadow: vec4u) -> vec4f {
    let color = box_shadow.z;
    return vec4f(
        f32(color & 255u),
        f32((color >> 8u) & 255u),
        f32((color >> 16u) & 255u),
        f32((color >> 24u) & 255u),
    ) / 255.0;
}

fn packColorPair(first: vec4f, second: vec4f) -> vec4f {
    return round(clamp(first, vec4f(0.0), vec4f(1.0)) * 255.0) +
        round(clamp(second, vec4f(0.0), vec4f(1.0)) * 255.0) * 256.0;
}

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
    @location(12) background_image_mode_data: vec2f,
    @location(13) background_uv_rect: vec4f,
    @location(14) background_image_rect: vec4f,
    @location(15) box_shadow: vec4u,
) -> VertexOutput {
    let shadow_padding = boxShadowPadding(box_shadow);
    let expanded_size = layout_node.zw + shadow_padding.xy + shadow_padding.zw;
    let local_position = position * expanded_size - shadow_padding.xy;
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
    output.opacity_image_mode_data = vec4f(
        opacity,
        background_image_mode_data.x,
        background_image_mode_data.y,
        0.0,
    );
    output.border_radius_x = border_radius_x;
    output.border_radius_y = border_radius_y;
    output.border_top_right_color = packColorPair(border_top_color, border_right_color);
    output.border_bottom_left_color = packColorPair(border_bottom_color, border_left_color);
    output.border_widths = border_widths;
    output.background_color = background_color;
    output.box_shadow_rect = boxShadowRect(box_shadow);
    output.box_shadow_color = boxShadowColor(box_shadow);
    output.background_uv_rect = background_uv_rect;
    output.background_image_rect = background_image_rect;
    return output;
}
`

export const nodeFragmentWGSL = /* wgsl */ `
struct FragmentInput {
    @location(0) local_position: vec2f,
    @location(1) rect_size: vec2f,
    @location(2) clipping: vec4f,
    @location(3) opacity_image_mode_data: vec4f,
    @location(4) border_radius_x: vec4f,
    @location(5) border_radius_y: vec4f,
    @location(6) border_top_right_color: vec4f,
    @location(7) border_bottom_left_color: vec4f,
    @location(8) border_widths: vec4f,
    @location(9) background_color: vec4f,
    @location(10) box_shadow_rect: vec4f,
    @location(11) box_shadow_color: vec4f,
    @location(12) background_uv_rect: vec4f,
    @location(13) background_image_rect: vec4f,
}

@group(0) @binding(1) var background_image_sampler: sampler;
@group(0) @binding(2) var background_image_texture: texture_2d_array<f32>;

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

fn roundedRectSignedDistance(
    local_position: vec2f,
    rect_size: vec2f,
    border_radius_x: vec4f,
    border_radius_y: vec4f,
) -> f32 {
    let clamped_position = clamp(local_position, vec2f(0.0), rect_size);
    let corner_radius = cornerRadius(
        clamped_position,
        rect_size,
        border_radius_x,
        border_radius_y,
    );
    let radius = min(
        min(corner_radius.x, corner_radius.y),
        min(rect_size.x, rect_size.y) * 0.5,
    );
    let half_size = rect_size * 0.5;
    let delta = abs(local_position - half_size) - max(half_size - vec2f(radius), vec2f(0.0));

    return length(max(delta, vec2f(0.0))) + min(max(delta.x, delta.y), 0.0) - radius;
}

fn compositeOver(top: vec4f, bottom: vec4f) -> vec4f {
    let alpha = top.a + bottom.a * (1.0 - top.a);
    let color =
        (top.rgb * top.a + bottom.rgb * bottom.a * (1.0 - top.a)) /
        max(alpha, 0.0001);

    return vec4f(color, alpha);
}

fn boxShadowCoverage(input: FragmentInput, outer_coverage: f32) -> vec4f {
    let shadow_color = input.box_shadow_color;
    let shadow_offset = input.box_shadow_rect.xy;
    let blur = max(input.box_shadow_rect.z, 0.0);
    let spread = input.box_shadow_rect.w;
    let shadow_size = input.rect_size + vec2f(spread * 2.0);
    let safe_shadow_size = max(shadow_size, vec2f(0.0001));

    let shadow_position = input.local_position - shadow_offset + vec2f(spread);
    let shadow_radius_x = max(input.border_radius_x + vec4f(spread), vec4f(0.0));
    let shadow_radius_y = max(input.border_radius_y + vec4f(spread), vec4f(0.0));
    let distance = roundedRectSignedDistance(
        shadow_position,
        safe_shadow_size,
        shadow_radius_x,
        shadow_radius_y,
    );
    let softness = max(blur, 0.5);
    let coverage = 1.0 - smoothstep(-softness, softness, distance);
    let alpha = coverage * (1.0 - outer_coverage);

    return vec4f(shadow_color.rgb, shadow_color.a * alpha);
}

fn unpackFirstColor(packed_color: vec4f) -> vec4f {
    let value = round(packed_color);
    return (value - floor(value / 256.0) * 256.0) / 255.0;
}

fn unpackSecondColor(packed_color: vec4f) -> vec4f {
    return floor(round(packed_color) / 256.0) / 255.0;
}

fn borderColorForPosition(input: FragmentInput) -> vec4f {
    let left_distance = input.local_position.x;
    let right_distance = input.rect_size.x - input.local_position.x;
    let top_distance = input.local_position.y;
    let bottom_distance = input.rect_size.y - input.local_position.y;
    let border_top_color = unpackFirstColor(input.border_top_right_color);
    let border_right_color = unpackSecondColor(input.border_top_right_color);
    let border_bottom_color = unpackFirstColor(input.border_bottom_left_color);
    let border_left_color = unpackSecondColor(input.border_bottom_left_color);
    let horizontal_color = select(
        border_left_color,
        border_right_color,
        right_distance < left_distance,
    );
    let vertical_color = select(
        border_top_color,
        border_bottom_color,
        bottom_distance < top_distance,
    );
    let horizontal_distance = min(left_distance, right_distance);
    let vertical_distance = min(top_distance, bottom_distance);

    return select(vertical_color, horizontal_color, horizontal_distance < vertical_distance);
}

fn backgroundImageColor(input: FragmentInput, local_position: vec2f) -> vec4f {
    let image_position = input.background_image_rect.xy;
    let image_size = input.background_image_rect.zw;

    if (any(image_size <= vec2f(0.0))) {
        return vec4f(0.0);
    }

    let repeat_mode = input.opacity_image_mode_data.y;
    let repeat_x = repeat_mode == 2.0 || repeat_mode == 3.0;
    let repeat_y = repeat_mode == 2.0 || repeat_mode == 4.0;
    var image_position_local = local_position - image_position;

    if (repeat_x) {
        image_position_local.x = image_position_local.x - floor(image_position_local.x / image_size.x) * image_size.x;
    }
    if (repeat_y) {
        image_position_local.y = image_position_local.y - floor(image_position_local.y / image_size.y) * image_size.y;
    }
    if (
        (!repeat_x && (image_position_local.x < 0.0 || image_position_local.x > image_size.x)) ||
        (!repeat_y && (image_position_local.y < 0.0 || image_position_local.y > image_size.y))
    ) {
        return vec4f(0.0);
    }

    let image_uv = image_position_local / image_size;
    let texture_uv = input.background_uv_rect.xy + image_uv * input.background_uv_rect.zw;

    return textureSampleLevel(
        background_image_texture,
        background_image_sampler,
        texture_uv,
        u32(input.opacity_image_mode_data.z),
        0.0,
    );
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    if (
        any(input.clipping > vec4f(0.0)) &&
        (
            input.local_position.x < input.clipping.w ||
            input.local_position.y < input.clipping.x ||
            input.local_position.x > input.clipping.y ||
            input.local_position.y > input.clipping.z
        )
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

    var box_color = input.background_color;
    if (outer_coverage > 0.0) {
        if (input.opacity_image_mode_data.y > 0.5 && all(inner_size > vec2f(0.0))) {
            box_color = compositeOver(
                backgroundImageColor(input, inner_position),
                input.background_color,
            );
        }
        if (any(input.border_widths > vec4f(0.0))) {
            let border_color = compositeOver(borderColorForPosition(input), box_color);
            box_color = mix(border_color, box_color, inner_coverage);
        }
    }
    box_color.a *= outer_coverage * input.opacity_image_mode_data.x;

    let shadow_size = input.rect_size + vec2f(input.box_shadow_rect.w * 2.0);
    if (input.box_shadow_color.a <= 0.0 || any(shadow_size <= vec2f(0.0))) {
        return box_color;
    }

    var shadow_color = boxShadowCoverage(input, outer_coverage);
    shadow_color.a *= input.opacity_image_mode_data.x;

    return compositeOver(box_color, shadow_color);
}
`

export const textVertexWGSL = /* wgsl */ `
struct Viewport {
    size: vec2f,
    padding: vec2f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) uv: vec2f,
    @location(1) run_index: f32,
    @location(2) pixel: vec2f,
}

@group(0) @binding(0) var<uniform> viewport: Viewport;

@vertex
fn main(
    @location(0) position: vec2f,
    @location(1) glyph_rect: vec4f,
    @location(2) glyph_uv_rect: vec4f,
    @location(3) run_index: f32,
) -> VertexOutput {
    let pixel = glyph_rect.xy + position * glyph_rect.zw;
    let clip = vec2f(
        pixel.x / viewport.size.x * 2.0 - 1.0,
        1.0 - pixel.y / viewport.size.y * 2.0,
    );

    var output: VertexOutput;
    output.position = vec4f(clip, 0.0, 1.0);
    output.uv = glyph_uv_rect.xy + position * glyph_uv_rect.zw;
    output.run_index = run_index;
    output.pixel = pixel;
    return output;
}
`

export const textFragmentWGSL = /* wgsl */ `
struct FragmentInput {
    @location(0) uv: vec2f,
    @location(1) run_index: f32,
    @location(2) pixel: vec2f,
}

struct TextRun {
    color: vec4f,
    font_data: vec4f,
    clipping: vec4f,
}

@group(0) @binding(1) var font_sampler: sampler;
@group(0) @binding(2) var font_texture: texture_2d_array<f32>;
@group(0) @binding(3) var<storage, read> text_runs: array<TextRun>;

fn median(r: f32, g: f32, b: f32) -> f32 {
    return max(min(r, g), min(max(r, g), b));
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    let run = text_runs[u32(input.run_index)];

    if (
        any(run.clipping > vec4f(0.0)) &&
        (
            input.pixel.x < run.clipping.w ||
            input.pixel.y < run.clipping.x ||
            input.pixel.x > run.clipping.y ||
            input.pixel.y > run.clipping.z
        )
    ) {
        discard;
    }

    let sample = textureSampleLevel(
        font_texture,
        font_sampler,
        input.uv,
        u32(run.font_data.x),
        0.0,
    );
    let signed_distance = median(sample.r, sample.g, sample.b);
    let smoothing = fwidth(signed_distance);
    let alpha = smoothstep(0.5 - smoothing, 0.5 + smoothing, signed_distance) *
        run.color.a *
        run.font_data.y;

    return vec4f(run.color.rgb, alpha);
}
`
