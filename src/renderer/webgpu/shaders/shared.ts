export const SHARED_WGSL = /* wgsl */ `
const COMMAND_KIND_PANEL = 0u;
const COMMAND_KIND_TEXT_SHADOW = 2u;
const COMMAND_KIND_TEXT_STROKE = 3u;
override TEXT_SHADOW_MAX_SAMPLES_PER_AXIS = 9u;
override TEXT_STROKE_MAX_SAMPLES_PER_GLYPH = 81u;

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
    text_stroke_width: f32,
    font_is_mtsdf: f32,
    effect_distance_range: f32,
    text_stroke_color: vec4f,
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
`
