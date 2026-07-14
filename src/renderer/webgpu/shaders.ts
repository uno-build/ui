export function createUIWGSL(text_shadow_max_samples_per_axis) {
    return uiWGSL.replace('TEXT_SHADOW_SAMPLE_WEIGHTS_SIZE', `${text_shadow_max_samples_per_axis}`)
}

const uiWGSL = /* wgsl */ `
const COMMAND_KIND_PANEL = 0u;
const COMMAND_KIND_TEXT_SHADOW = 2u;
override TEXT_SHADOW_MAX_SAMPLES_PER_AXIS = 9u;

struct Viewport {
    size: vec2f,
    device_pixel_ratio: f32,
    padding: f32,
}

struct PanelData {
    rect: vec4f,
    clipping: vec4f,
    border_radius_x: vec4f,
    border_radius_y: vec4f,
    border_widths: vec4f,
    background_uv_rect: vec4f,
    background_image_rect: vec4f,
    image_data: vec4f,
    border_colors: vec4u,
    background_color: vec4u,
    box_shadow: vec4u,
}

struct GlyphData {
    rect: vec4f,
    uv_rect: vec4f,
    run_data: vec4u,
}

struct TextRun {
    color: vec4f,
    font_data: vec4f,
    clipping: vec4f,
    text_shadow: vec4f,
    text_shadow_color: vec4f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) local_position: vec2f,
    @location(1) pixel: vec2f,
    @location(2) uv: vec2f,
    @location(3) kind: f32,
    @location(4) panel_index: f32,
    @location(5) glyph_index: f32,
}

@group(0) @binding(0) var<uniform> viewport: Viewport;
@group(0) @binding(1) var ui_sampler: sampler;
@group(0) @binding(2) var image_texture: texture_2d_array<f32>;
@group(0) @binding(3) var font_texture: texture_2d_array<f32>;
@group(0) @binding(4) var<storage, read> panel_data: array<PanelData>;
@group(0) @binding(5) var<storage, read> glyph_data: array<GlyphData>;
@group(0) @binding(6) var<storage, read> text_runs: array<TextRun>;

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

fn unpackColor(color: u32) -> vec4f {
    return vec4f(
        f32(color & 255u),
        f32((color >> 8u) & 255u),
        f32((color >> 16u) & 255u),
        f32((color >> 24u) & 255u),
    ) / 255.0;
}

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
    local_position_width: vec2f,
    rect_size: vec2f,
    border_radius_x: vec4f,
    border_radius_y: vec4f,
) -> f32 {
    let distance = roundedRectSignedDistance(
        local_position,
        rect_size,
        border_radius_x,
        border_radius_y,
    );
    let antialias = max(max(local_position_width.x, local_position_width.y) * 0.5, 0.0001);

    return 1.0 - smoothstep(-antialias, antialias, distance);
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

fn boxShadowCoverage(panel: PanelData, local_position: vec2f, outer_coverage: f32) -> vec4f {
    let shadow_color = unpackColor(panel.box_shadow.z);
    let shadow_rect = boxShadowRect(panel.box_shadow);
    let shadow_offset = shadow_rect.xy;
    let blur = max(shadow_rect.z, 0.0);
    let spread = shadow_rect.w;
    let shadow_size = panel.rect.zw + vec2f(spread * 2.0);
    let safe_shadow_size = max(shadow_size, vec2f(0.0001));

    let shadow_position = local_position - shadow_offset + vec2f(spread);
    let shadow_radius_x = max(panel.border_radius_x + vec4f(spread), vec4f(0.0));
    let shadow_radius_y = max(panel.border_radius_y + vec4f(spread), vec4f(0.0));
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

fn borderColorForPosition(panel: PanelData, local_position: vec2f) -> vec4f {
    let rect_size = panel.rect.zw;
    let left_distance = local_position.x;
    let right_distance = rect_size.x - local_position.x;
    let top_distance = local_position.y;
    let bottom_distance = rect_size.y - local_position.y;
    let border_top_color = unpackColor(panel.border_colors.x);
    let border_right_color = unpackColor(panel.border_colors.y);
    let border_bottom_color = unpackColor(panel.border_colors.z);
    let border_left_color = unpackColor(panel.border_colors.w);
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

fn backgroundImageColor(panel: PanelData, local_position: vec2f) -> vec4f {
    let image_position = panel.background_image_rect.xy;
    let image_size = panel.background_image_rect.zw;

    if (any(image_size <= vec2f(0.0))) {
        return vec4f(0.0);
    }

    let repeat_mode = panel.image_data.y;
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
    let texture_uv = panel.background_uv_rect.xy + image_uv * panel.background_uv_rect.zw;

    return textureSampleLevel(
        image_texture,
        ui_sampler,
        texture_uv,
        u32(panel.image_data.z),
        0.0,
    );
}

fn median(r: f32, g: f32, b: f32) -> f32 {
    return max(min(r, g), min(max(r, g), b));
}

@vertex
fn vertexMain(
    @location(0) position: vec2f,
    @location(1) command: vec4u,
) -> VertexOutput {
    var pixel: vec2f;
    var local_position: vec2f;
    var uv = vec2f(0.0);

    if (command.x == COMMAND_KIND_PANEL) {
        let panel = panel_data[command.y];
        let shadow_padding = boxShadowPadding(panel.box_shadow);
        let expanded_size = panel.rect.zw + shadow_padding.xy + shadow_padding.zw;
        local_position = position * expanded_size - shadow_padding.xy;
        pixel = panel.rect.xy + local_position;
    } else {
        let glyph = glyph_data[command.z];

        if (command.x == COMMAND_KIND_TEXT_SHADOW) {
            let text_shadow = bitcast<vec3f>(glyph.run_data.yzw);
            let blur = text_shadow.z;
            let expanded_size = glyph.rect.zw + vec2f(blur * 2.0);
            local_position = position * expanded_size - vec2f(blur);
            pixel = glyph.rect.xy + text_shadow.xy + local_position;
            uv = glyph.uv_rect.xy +
                ((pixel - text_shadow.xy - glyph.rect.xy) / glyph.rect.zw) * glyph.uv_rect.zw;
        } else {
            local_position = position * glyph.rect.zw;
            pixel = glyph.rect.xy + local_position;
            uv = glyph.uv_rect.xy + position * glyph.uv_rect.zw;
        }
    }

    let clip = vec2f(
        pixel.x / viewport.size.x * 2.0 - 1.0,
        1.0 - pixel.y / viewport.size.y * 2.0,
    );

    var output: VertexOutput;
    output.position = vec4f(clip, 0.0, 1.0);
    output.local_position = local_position;
    output.pixel = pixel;
    output.uv = uv;
    output.kind = f32(command.x);
    output.panel_index = f32(command.y);
    output.glyph_index = f32(command.z);
    return output;
}

fn panelColor(input: VertexOutput, local_position_width: vec2f) -> vec4f {
    let panel = panel_data[u32(input.panel_index)];
    let visible = !(
        any(panel.clipping > vec4f(0.0)) &&
        (
            input.local_position.x < panel.clipping.w ||
            input.local_position.y < panel.clipping.x ||
            input.local_position.x > panel.clipping.y ||
            input.local_position.y > panel.clipping.z
        )
    );

    let rect_size = panel.rect.zw;
    let outer_coverage = roundedRectCoverage(
        input.local_position,
        local_position_width,
        rect_size,
        panel.border_radius_x,
        panel.border_radius_y,
    );
    let border_top_width = panel.border_widths.x;
    let border_right_width = panel.border_widths.y;
    let border_bottom_width = panel.border_widths.z;
    let border_left_width = panel.border_widths.w;
    let inner_size = rect_size - vec2f(
        border_left_width + border_right_width,
        border_top_width + border_bottom_width,
    );
    let inner_position = input.local_position - vec2f(border_left_width, border_top_width);
    let inner_border_radius_x = max(
        panel.border_radius_x - vec4f(
            border_left_width,
            border_right_width,
            border_right_width,
            border_left_width,
        ),
        vec4f(0.0),
    );
    let inner_border_radius_y = max(
        panel.border_radius_y - vec4f(
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
            local_position_width,
            inner_size,
            inner_border_radius_x,
            inner_border_radius_y,
        ),
        all(inner_size > vec2f(0.0)),
    );

    var box_color = unpackColor(panel.background_color.x);
    if (outer_coverage > 0.0) {
        if (panel.image_data.y > 0.5 && all(inner_size > vec2f(0.0))) {
            box_color = compositeOver(
                backgroundImageColor(panel, inner_position),
                box_color,
            );
        }
        if (any(panel.border_widths > vec4f(0.0))) {
            let border_color = compositeOver(borderColorForPosition(panel, input.local_position), box_color);
            box_color = mix(border_color, box_color, inner_coverage);
        }
    }
    box_color.a *= outer_coverage * panel.image_data.x;

    let shadow_rect = boxShadowRect(panel.box_shadow);
    let shadow_size = rect_size + vec2f(shadow_rect.w * 2.0);
    if (!boxShadowHasColor(panel.box_shadow) || any(shadow_size <= vec2f(0.0))) {
        box_color.a *= select(0.0, 1.0, visible);
        return box_color;
    }

    var shadow_color = boxShadowCoverage(panel, input.local_position, outer_coverage);
    shadow_color.a *= panel.image_data.x;

    var color = compositeOver(box_color, shadow_color);
    color.a *= select(0.0, 1.0, visible);
    return color;
}

fn glyphColor(input: VertexOutput, uv_width: vec2f) -> vec4f {
    let glyph = glyph_data[u32(input.glyph_index)];
    let run = text_runs[glyph.run_data.x];
    let visible = !(
        any(run.clipping > vec4f(0.0)) &&
        (
            input.pixel.x < run.clipping.w ||
            input.pixel.y < run.clipping.x ||
            input.pixel.x > run.clipping.y ||
            input.pixel.y > run.clipping.z
        )
    );

    let sample = textureSampleLevel(
        font_texture,
        ui_sampler,
        input.uv,
        u32(run.font_data.x),
        0.0,
    );
    let signed_distance = median(sample.r, sample.g, sample.b);
    let unit_range = vec2f(run.font_data.z / run.font_data.w);
    let screen_tex_size = vec2f(1.0) / max(uv_width, vec2f(0.000001));
    let screen_px_range = max(0.5 * dot(unit_range, screen_tex_size), 1.0);
    let distance_alpha = clamp(screen_px_range * (signed_distance - 0.45) + 0.5, 0.0, 1.0);
    let alpha = distance_alpha *
        run.color.a *
        run.font_data.y *
        select(0.0, 1.0, visible);

    return vec4f(run.color.rgb, alpha);
}

fn glyphCoverageAtUv(
    glyph: GlyphData,
    run: TextRun,
    uv: vec2f,
    uv_width: vec2f,
    softness: f32,
) -> f32 {
    let uv_min = glyph.uv_rect.xy;
    let uv_max = glyph.uv_rect.xy + glyph.uv_rect.zw;
    if (any(uv < uv_min) || any(uv > uv_max)) {
        return 0.0;
    }

    let sample = textureSampleLevel(
        font_texture,
        ui_sampler,
        uv,
        u32(run.font_data.x),
        0.0,
    );
    let signed_distance = median(sample.r, sample.g, sample.b);
    let unit_range = vec2f(run.font_data.z / run.font_data.w);
    let screen_tex_size = vec2f(1.0) / max(uv_width, vec2f(0.000001));
    let screen_px_range = max(0.5 * dot(unit_range, screen_tex_size), 1.0);
    let screen_distance = screen_px_range * (signed_distance - 0.45);
    let safe_softness = min(softness, screen_px_range * 0.45);

    return smoothstep(-safe_softness, safe_softness, screen_distance);
}

fn textShadowColor(input: VertexOutput, uv_width: vec2f) -> vec4f {
    let glyph = glyph_data[u32(input.glyph_index)];
    let run = text_runs[glyph.run_data.x];
    let visible = !(
        any(run.clipping > vec4f(0.0)) &&
        (
            input.pixel.x < run.clipping.w ||
            input.pixel.y < run.clipping.x ||
            input.pixel.x > run.clipping.y ||
            input.pixel.y > run.clipping.z
        )
    );
    if (!visible) {
        return vec4f(run.text_shadow_color.rgb, 0.0);
    }

    let blur = run.text_shadow.z;
    var coverage = 0.0;
    if (blur <= 0.0) {
        coverage = glyphCoverageAtUv(glyph, run, input.uv, uv_width, 0.5);
    } else {
        let blur_px = blur * viewport.device_pixel_ratio;
        let required_samples_per_axis = u32(ceil(blur_px)) + 1u;
        let samples_per_axis = min(required_samples_per_axis, TEXT_SHADOW_MAX_SAMPLES_PER_AXIS);
        if (samples_per_axis == 1u) {
            coverage = glyphCoverageAtUv(glyph, run, input.uv, uv_width, 0.5);
        } else {
            let sample_step = 2.0 / f32(samples_per_axis - 1u);
            let sample_softness = max(blur_px / f32(samples_per_axis - 1u), 0.5);
            let gaussian_sigma = 0.353553;
            var sample_weights: array<f32, TEXT_SHADOW_SAMPLE_WEIGHTS_SIZE>;
            var sample_weight_sum = 0.0;

            for (var sample = 0u; sample < samples_per_axis; sample++) {
                let sample_position = -1.0 + f32(sample) * sample_step;
                let gaussian_position = sample_position / gaussian_sigma;
                let sample_weight = exp(-0.5 * gaussian_position * gaussian_position);
                sample_weights[sample] = sample_weight;
                sample_weight_sum += sample_weight;
            }

            for (var y = 0u; y < samples_per_axis; y++) {
                for (var x = 0u; x < samples_per_axis; x++) {
                    let sample_position = vec2f(f32(x), f32(y)) * sample_step - vec2f(1.0);
                    let sample_offset = sample_position * blur_px * uv_width;
                    let sample_weight = sample_weights[x] * sample_weights[y] /
                        (sample_weight_sum * sample_weight_sum);
                    coverage += glyphCoverageAtUv(
                        glyph,
                        run,
                        input.uv + sample_offset,
                        uv_width,
                        sample_softness,
                    ) * sample_weight;
                }
            }
        }
    }

    let alpha = coverage *
        run.text_shadow_color.a *
        run.font_data.y;

    return vec4f(run.text_shadow_color.rgb, alpha);
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    let local_position_width = fwidth(input.local_position);
    let uv_width = fwidth(input.uv);

    if (u32(input.kind) == COMMAND_KIND_PANEL) {
        return panelColor(input, local_position_width);
    }

    if (u32(input.kind) == COMMAND_KIND_TEXT_SHADOW) {
        return textShadowColor(input, uv_width);
    }

    return glyphColor(input, uv_width);
}
`
