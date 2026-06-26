export const FLOAT32_SIZE = 4
export const RGBA8_SIZE = 4
export const VIEWPORT_SIZE = 4 * FLOAT32_SIZE
export const POSITION_VERTEX_COUNT = 6
export const POSITION_VERTEX_FLOATS = 2
export const POSITION_VERTEX_SIZE = POSITION_VERTEX_FLOATS * FLOAT32_SIZE
export const POSITION_VERTICES = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
export const TRANSPARENT_COLOR = [0, 0, 0, 0]
export const ATTRIBUTES = {
    LAYOUT: {
        LOCATION: 1,
        OFFSET: 0,
        SIZE: 4 * FLOAT32_SIZE,
        FORMAT: 'float32x4',
    },
    CLIPPING: {
        LOCATION: 2,
        OFFSET: 4 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
        FORMAT: 'float32x4',
    },
    BORDERRADIUS_X: {
        LOCATION: 3,
        OFFSET: 8 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
        FORMAT: 'float32x4',
    },
    BORDERRADIUS_Y: {
        LOCATION: 4,
        OFFSET: 12 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
        FORMAT: 'float32x4',
    },
    BORDERCOLOR_TOP: {
        LOCATION: 5,
        OFFSET: 16 * FLOAT32_SIZE,
        SIZE: RGBA8_SIZE,
        FORMAT: 'unorm8x4',
    },
    BORDERCOLOR_RIGHT: {
        LOCATION: 6,
        OFFSET: 16 * FLOAT32_SIZE + RGBA8_SIZE,
        SIZE: RGBA8_SIZE,
        FORMAT: 'unorm8x4',
    },
    BORDERCOLOR_BOTTOM: {
        LOCATION: 7,
        OFFSET: 16 * FLOAT32_SIZE + 2 * RGBA8_SIZE,
        SIZE: RGBA8_SIZE,
        FORMAT: 'unorm8x4',
    },
    BORDERCOLOR_LEFT: {
        LOCATION: 8,
        OFFSET: 16 * FLOAT32_SIZE + 3 * RGBA8_SIZE,
        SIZE: RGBA8_SIZE,
        FORMAT: 'unorm8x4',
    },
    BORDERWIDTHS: {
        LOCATION: 9,
        OFFSET: 16 * FLOAT32_SIZE + 4 * RGBA8_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
        FORMAT: 'float32x4',
    },
    BACKGROUNDCOLOR: {
        LOCATION: 10,
        OFFSET: 20 * FLOAT32_SIZE + 4 * RGBA8_SIZE,
        SIZE: RGBA8_SIZE,
        FORMAT: 'unorm8x4',
    },
    OPACITY: {
        LOCATION: 11,
        OFFSET: 20 * FLOAT32_SIZE + 5 * RGBA8_SIZE,
        SIZE: FLOAT32_SIZE,
        FORMAT: 'float32',
    },
}
export const ATTRIBUTE_SIZE = Math.max(
    ...Object.values(ATTRIBUTES).map((attrb) => attrb.OFFSET + attrb.SIZE),
)
