import { FLOAT32_SIZE, UINT32_SIZE, COMMAND, PANEL_DATA, GLYPH_DATA, TEXT_RUN } from './buffers'

export function writeCommandData({ floats, u32 }, bytes_offset, command) {
    const command_u32_offset = (bytes_offset + COMMAND.KIND_DATA.OFFSET) / UINT32_SIZE
    u32[command_u32_offset] = command.kind
    u32[command_u32_offset + 1] = command.panel_index
    u32[command_u32_offset + 2] = command.glyph_index
    floats[command_u32_offset + 3] = command.text_stroke_width ?? 0
}

export function writePanelData({ floats, u32 }, bytes_offset, panel) {
    const layout_float_offset = (bytes_offset + PANEL_DATA.LAYOUT.OFFSET) / FLOAT32_SIZE
    floats.set(panel.layout, layout_float_offset)

    const clipping_float_offset = (bytes_offset + PANEL_DATA.CLIPPING.OFFSET) / FLOAT32_SIZE
    floats.set(panel.clipping, clipping_float_offset)

    const border_radius_x_float_offset = (bytes_offset + PANEL_DATA.BORDER_RADIUS_X.OFFSET) / FLOAT32_SIZE
    const border_radius_y_float_offset = (bytes_offset + PANEL_DATA.BORDER_RADIUS_Y.OFFSET) / FLOAT32_SIZE
    floats.set(panel.border_radius_x, border_radius_x_float_offset)
    floats.set(panel.border_radius_y, border_radius_y_float_offset)

    const border_widths_float_offset = (bytes_offset + PANEL_DATA.BORDER_WIDTHS.OFFSET) / FLOAT32_SIZE
    floats.set(panel.border_widths, border_widths_float_offset)

    const background_uv_rect_float_offset = (bytes_offset + PANEL_DATA.BACKGROUND_UV_RECT.OFFSET) / FLOAT32_SIZE
    floats.set(panel.background_uv_rect, background_uv_rect_float_offset)

    const background_image_rect_float_offset = (bytes_offset + PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET) / FLOAT32_SIZE
    floats.set(panel.background_image_rect, background_image_rect_float_offset)

    const image_data_float_offset = (bytes_offset + PANEL_DATA.IMAGE_DATA.OFFSET) / FLOAT32_SIZE
    floats[image_data_float_offset] = panel.opacity
    floats[image_data_float_offset + 1] = panel.background_image_mode
    floats[image_data_float_offset + 2] = panel.background_atlas_layer
    floats[image_data_float_offset + 3] = 0

    const border_colors_u32_offset = (bytes_offset + PANEL_DATA.BORDER_COLORS.OFFSET) / UINT32_SIZE
    u32[border_colors_u32_offset] = packColor(panel.border_color_top)
    u32[border_colors_u32_offset + 1] = packColor(panel.border_color_right)
    u32[border_colors_u32_offset + 2] = packColor(panel.border_color_bottom)
    u32[border_colors_u32_offset + 3] = packColor(panel.border_color_left)

    const background_color_u32_offset = (bytes_offset + PANEL_DATA.BACKGROUND_COLOR.OFFSET) / UINT32_SIZE
    u32[background_color_u32_offset] = packColor(panel.background_color)
    u32[background_color_u32_offset + 1] = 0
    u32[background_color_u32_offset + 2] = 0
    u32[background_color_u32_offset + 3] = 0

    const box_shadow_u32_offset = (bytes_offset + PANEL_DATA.BOX_SHADOW.OFFSET) / UINT32_SIZE
    u32.set(panel.box_shadow, box_shadow_u32_offset)
}

export function writeGlyphData({ floats, u32 }, bytes_offset, glyph) {
    const layout_float_offset = (bytes_offset + GLYPH_DATA.LAYOUT.OFFSET) / FLOAT32_SIZE
    floats.set(glyph.layout, layout_float_offset)

    const uv_rect_float_offset = (bytes_offset + GLYPH_DATA.UV_RECT.OFFSET) / FLOAT32_SIZE
    floats.set(glyph.uv_rect, uv_rect_float_offset)

    const run_data_u32_offset = (bytes_offset + GLYPH_DATA.RUN_DATA.OFFSET) / UINT32_SIZE
    u32[run_data_u32_offset] = glyph.run_index
    floats.set(glyph.text_shadow, run_data_u32_offset + 1)
}

export function writeTextRunData({ floats }, bytes_offset, text_run) {
    const {
        color,
        font_data,
        clipping,
        text_shadow,
        text_shadow_color,
        text_stroke_width,
        effect_distance_range,
        text_stroke_multisampling,
        text_stroke_color,
    } = text_run
    const color_float_offset = (bytes_offset + TEXT_RUN.COLOR.OFFSET) / FLOAT32_SIZE
    floats[color_float_offset] = color[0] / 255
    floats[color_float_offset + 1] = color[1] / 255
    floats[color_float_offset + 2] = color[2] / 255
    floats[color_float_offset + 3] = color[3] / 255

    const font_data_float_offset = (bytes_offset + TEXT_RUN.FONT_DATA.OFFSET) / FLOAT32_SIZE
    floats.set(font_data, font_data_float_offset)

    const clipping_float_offset = (bytes_offset + TEXT_RUN.CLIPPING.OFFSET) / FLOAT32_SIZE
    floats.set(clipping, clipping_float_offset)

    const text_shadow_float_offset = (bytes_offset + TEXT_RUN.TEXT_SHADOW.OFFSET) / FLOAT32_SIZE
    floats.set(text_shadow, text_shadow_float_offset)

    const text_shadow_color_float_offset = (bytes_offset + TEXT_RUN.TEXT_SHADOW_COLOR.OFFSET) / FLOAT32_SIZE
    floats[text_shadow_color_float_offset] = text_shadow_color[0] / 255
    floats[text_shadow_color_float_offset + 1] = text_shadow_color[1] / 255
    floats[text_shadow_color_float_offset + 2] = text_shadow_color[2] / 255
    floats[text_shadow_color_float_offset + 3] = text_shadow_color[3] / 255

    const text_stroke_width_float_offset = (bytes_offset + TEXT_RUN.TEXT_STROKE_WIDTH.OFFSET) / FLOAT32_SIZE
    floats[text_stroke_width_float_offset] = text_stroke_width

    const effect_distance_range_float_offset = (bytes_offset + TEXT_RUN.EFFECT_DISTANCE_RANGE.OFFSET) / FLOAT32_SIZE
    floats[effect_distance_range_float_offset] = effect_distance_range

    const text_stroke_multisampling_float_offset =
        (bytes_offset + TEXT_RUN.TEXT_STROKE_MULTISAMPLING.OFFSET) / FLOAT32_SIZE
    floats[text_stroke_multisampling_float_offset] = text_stroke_multisampling

    const text_stroke_color_float_offset = (bytes_offset + TEXT_RUN.TEXT_STROKE_COLOR.OFFSET) / FLOAT32_SIZE
    floats[text_stroke_color_float_offset] = text_stroke_color[0] / 255
    floats[text_stroke_color_float_offset + 1] = text_stroke_color[1] / 255
    floats[text_stroke_color_float_offset + 2] = text_stroke_color[2] / 255
    floats[text_stroke_color_float_offset + 3] = text_stroke_color[3] / 255
}

function packColor(color) {
    return ((color[0] & 255) | ((color[1] & 255) << 8) | ((color[2] & 255) << 16) | ((color[3] & 255) << 24)) >>> 0
}
