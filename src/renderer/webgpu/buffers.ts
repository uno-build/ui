export const FLOAT32_SIZE = 4
export const UINT32_SIZE = 4
export const RGBA8_SIZE = 4
export const VIEWPORT_SIZE = 4 * FLOAT32_SIZE
export const POSITION_VERTEX_COUNT = 6
export const POSITION_VERTEX_FLOATS = 2
export const POSITION_VERTEX_SIZE = POSITION_VERTEX_FLOATS * FLOAT32_SIZE
export const POSITION_VERTICES = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
export const TRANSPARENT_COLOR = [0, 0, 0, 0]

export const COMMAND_KIND_PANEL = 0
export const COMMAND_KIND_GLYPH = 1
export const COMMAND_KIND_TEXT_SHADOW = 2
export const COMMAND_KIND_TEXT_STROKE = 3

export const COMMAND = {
    KIND_DATA: {
        LOCATION: 1,
        OFFSET: 0,
        SIZE: 4 * UINT32_SIZE,
        FORMAT: 'uint32x4',
    },
}
export const COMMAND_SIZE = Math.max(...Object.values(COMMAND).map((attrb) => attrb.OFFSET + attrb.SIZE))

export const PANEL_DATA = {
    LAYOUT: {
        OFFSET: 0,
        SIZE: 4 * FLOAT32_SIZE,
    },
    CLIPPING: {
        OFFSET: 4 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
    },
    BORDER_RADIUS_X: {
        OFFSET: 8 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
    },
    BORDER_RADIUS_Y: {
        OFFSET: 12 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
    },
    BORDER_WIDTHS: {
        OFFSET: 16 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
    },
    BACKGROUND_UV_RECT: {
        OFFSET: 20 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
    },
    BACKGROUND_IMAGE_RECT: {
        OFFSET: 24 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
    },
    IMAGE_DATA: {
        OFFSET: 28 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
    },
    BORDER_COLORS: {
        OFFSET: 32 * FLOAT32_SIZE,
        SIZE: 4 * UINT32_SIZE,
    },
    BACKGROUND_COLOR: {
        OFFSET: 36 * FLOAT32_SIZE,
        SIZE: 4 * UINT32_SIZE,
    },
    BOX_SHADOW: {
        OFFSET: 40 * FLOAT32_SIZE,
        SIZE: 4 * UINT32_SIZE,
    },
}

export const GLYPH_DATA = {
    LAYOUT: {
        OFFSET: 0,
        SIZE: 4 * FLOAT32_SIZE,
    },
    UV_RECT: {
        OFFSET: 4 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
    },
    RUN_DATA: {
        OFFSET: 8 * FLOAT32_SIZE,
        SIZE: 4 * UINT32_SIZE,
    },
}

export const TEXT_RUN = {
    COLOR: {
        OFFSET: 0,
        SIZE: 4 * FLOAT32_SIZE,
    },
    FONT_DATA: {
        OFFSET: 4 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
    },
    CLIPPING: {
        OFFSET: 8 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
    },
    TEXT_SHADOW: {
        OFFSET: 12 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
    },
    TEXT_SHADOW_COLOR: {
        OFFSET: 16 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
    },
    TEXT_STROKE_WIDTH: {
        OFFSET: 20 * FLOAT32_SIZE,
        SIZE: FLOAT32_SIZE,
    },
    FONT_IS_MTSDF: {
        OFFSET: 21 * FLOAT32_SIZE,
        SIZE: FLOAT32_SIZE,
    },
    EFFECT_DISTANCE_RANGE: {
        OFFSET: 22 * FLOAT32_SIZE,
        SIZE: FLOAT32_SIZE,
    },
    TEXT_STROKE_COLOR: {
        OFFSET: 24 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
    },
}

export const TEXT_RUN_SIZE = Math.max(...Object.values(TEXT_RUN).map((attrb) => attrb.OFFSET + attrb.SIZE))
export const PANEL_DATA_SIZE = Math.max(...Object.values(PANEL_DATA).map((attrb) => attrb.OFFSET + attrb.SIZE))
export const GLYPH_DATA_SIZE = Math.max(...Object.values(GLYPH_DATA).map((attrb) => attrb.OFFSET + attrb.SIZE))

export const ATTRIBUTES = PANEL_DATA
export const ATTRIBUTES_SIZE = PANEL_DATA_SIZE
export const TEXT_ATTRIBUTES = GLYPH_DATA
export const TEXT_ATTRIBUTES_SIZE = GLYPH_DATA_SIZE
