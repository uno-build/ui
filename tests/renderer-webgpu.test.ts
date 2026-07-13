import { expect, test } from '@playwright/test'
import RendererWebGPU from '../src/renderer/RendererWebGPU.ts'
import { BACKGROUND_REPEAT, BACKGROUND_SIZE, KEYWORD, OVERFLOW, UNIT } from '../src/style/consts.ts'
import {
    COMMAND,
    COMMAND_KIND_GLYPH,
    COMMAND_KIND_PANEL,
    COMMAND_SIZE,
    FLOAT32_SIZE,
    GLYPH_DATA,
    GLYPH_DATA_SIZE,
    PANEL_DATA,
    PANEL_DATA_SIZE,
    TEXT_RUN,
    TEXT_RUN_SIZE,
    UINT32_SIZE,
} from '../src/renderer/webgpu/buffers.ts'
import { FontManager } from '../src/renderer/webgpu/FontManager.ts'
import { ATLAS_PADDING, ATLAS_SIZE, ImageManager } from '../src/renderer/webgpu/ImageManager.ts'
;(globalThis as any).GPUTextureUsage = {
    TEXTURE_BINDING: 1,
    COPY_SRC: 2,
    COPY_DST: 4,
    RENDER_ATTACHMENT: 8,
}

const FONT_ATLAS_SIZE = 1024

test('RendererWebGPU accumulates opacity into panel instance data', () => {
    const root = createNode({ opacity: 0.5 })
    const parent = createNode({ parent: root, opacity: 0.5 })
    const child = createNode({ parent, opacity: 0.8 })
    const renderer = createRenderer()
    const nodes_buffer_data = createNodesBufferData(renderer, [child])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const opacity_float_offset = PANEL_DATA.IMAGE_DATA.OFFSET / FLOAT32_SIZE

    expect(nodes_buffer_data.bytes_offset).toBe(PANEL_DATA_SIZE)
    expect(floats[opacity_float_offset]).toBeCloseTo(0.2)
})

test('RendererWebGPU skips fully transparent panel instance data', () => {
    const root = createNode({ opacity: 0 })
    const child = createNode({ parent: root })
    const renderer = createRenderer()
    const nodes_buffer_data = createNodesBufferData(renderer, [child])

    expect(nodes_buffer_data.bytes_offset).toBe(0)
})

test('RendererWebGPU writes layout and clipping bounds into panel instance data', () => {
    const root = createNode()
    const parent = createNode({
        parent: root,
        layout: { x: 2, y: 3, width: 5, height: 4 },
        overflow: OVERFLOW.hidden,
    })
    const child = createNode({
        parent,
        layout: { x: 0, y: 0, width: 10, height: 10 },
    })
    const renderer = createRenderer()
    const nodes_buffer_data = createNodesBufferData(renderer, [child])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const layout_float_offset = PANEL_DATA.LAYOUT.OFFSET / FLOAT32_SIZE
    const clipping_float_offset = PANEL_DATA.CLIPPING.OFFSET / FLOAT32_SIZE

    expect(nodes_buffer_data.bytes_offset).toBe(PANEL_DATA_SIZE)
    expect(Array.from(floats.slice(layout_float_offset, layout_float_offset + 4))).toEqual([0, 0, 10, 10])
    expect(Array.from(floats.slice(clipping_float_offset, clipping_float_offset + 4))).toEqual([3, 7, 7, 2])
})

test('RendererWebGPU writes border drawing data into panel instance data', () => {
    const node = createNode({
        layout: { x: 0, y: 0, width: 20, height: 10 },
        styles: {
            borderTopLeftRadius: { parsed: { kind: UNIT.PERCENT, value: 50 } },
            borderTopRightRadius: { parsed: { kind: UNIT.PX, value: 2 } },
            borderBottomRightRadius: { parsed: { kind: UNIT.PX, value: 3 } },
            borderBottomLeftRadius: { parsed: { kind: UNIT.PX, value: 4 } },
            borderTopStyle: { value: 'solid' },
            borderRightStyle: { value: 'solid' },
            borderBottomStyle: { value: 'solid' },
            borderLeftStyle: { value: 'solid' },
            borderTopWidth: { parsed: { value: 5 } },
            borderRightWidth: { parsed: { value: 6 } },
            borderBottomWidth: { parsed: { value: 7 } },
            borderLeftWidth: { parsed: { value: 8 } },
            borderTopColor: { parsed: { rgba: [1, 2, 3, 4] } },
            borderRightColor: { parsed: { rgba: [5, 6, 7, 8] } },
            borderBottomColor: { parsed: { rgba: [9, 10, 11, 12] } },
            borderLeftColor: { parsed: { rgba: [13, 14, 15, 16] } },
        },
    })
    const renderer = createRenderer()
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const bytes = nodes_buffer_data.bytes
    const border_radius_x_float_offset = PANEL_DATA.BORDER_RADIUS_X.OFFSET / FLOAT32_SIZE
    const border_radius_y_float_offset = PANEL_DATA.BORDER_RADIUS_Y.OFFSET / FLOAT32_SIZE
    const border_widths_float_offset = PANEL_DATA.BORDER_WIDTHS.OFFSET / FLOAT32_SIZE

    expect(nodes_buffer_data.bytes_offset).toBe(PANEL_DATA_SIZE)
    expect(Array.from(floats.slice(border_radius_x_float_offset, border_radius_x_float_offset + 4))).toEqual([
        10, 2, 3, 4,
    ])
    expect(Array.from(floats.slice(border_radius_y_float_offset, border_radius_y_float_offset + 4))).toEqual([
        5, 2, 3, 4,
    ])
    expect(Array.from(floats.slice(border_widths_float_offset, border_widths_float_offset + 4))).toEqual([5, 6, 7, 8])
    expect(Array.from(bytes.slice(PANEL_DATA.BORDER_COLORS.OFFSET, PANEL_DATA.BORDER_COLORS.OFFSET + 4))).toEqual([
        1, 2, 3, 4,
    ])
    expect(
        Array.from(
            bytes.slice(
                PANEL_DATA.BORDER_COLORS.OFFSET + UINT32_SIZE,
                PANEL_DATA.BORDER_COLORS.OFFSET + 2 * UINT32_SIZE,
            ),
        ),
    ).toEqual([5, 6, 7, 8])
    expect(
        Array.from(
            bytes.slice(
                PANEL_DATA.BORDER_COLORS.OFFSET + 2 * UINT32_SIZE,
                PANEL_DATA.BORDER_COLORS.OFFSET + 3 * UINT32_SIZE,
            ),
        ),
    ).toEqual([9, 10, 11, 12])
    expect(
        Array.from(
            bytes.slice(
                PANEL_DATA.BORDER_COLORS.OFFSET + 3 * UINT32_SIZE,
                PANEL_DATA.BORDER_COLORS.OFFSET + 4 * UINT32_SIZE,
            ),
        ),
    ).toEqual([13, 14, 15, 16])
})

test('RendererWebGPU writes background image data into panel instance data', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 3,
                uv_rect: [0.1, 0.2, 0.3, 0.4],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const mode_data_float_offset = (PANEL_DATA.IMAGE_DATA.OFFSET + FLOAT32_SIZE) / FLOAT32_SIZE
    const uv_rect_float_offset = PANEL_DATA.BACKGROUND_UV_RECT.OFFSET / FLOAT32_SIZE
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(mode_data_float_offset, mode_data_float_offset + 2))).toEqual([1, 3])
    expect(Array.from(floats.slice(uv_rect_float_offset, uv_rect_float_offset + 4))).toEqual([
        expect.closeTo(0.1),
        expect.closeTo(0.2),
        expect.closeTo(0.3),
        expect.closeTo(0.4),
    ])
    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([0, 0, 40, 20])
})

test('RendererWebGPU writes background repeat mode into panel instance data', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 3,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const nodes = [
        createNode({
            styles: {
                backgroundImage: {
                    value: image.src,
                    parsed: {},
                },
                backgroundRepeat: {
                    value: 'repeat',
                    parsed: { enum: BACKGROUND_REPEAT.repeat },
                },
            },
        }),
        createNode({
            styles: {
                backgroundImage: {
                    value: image.src,
                    parsed: {},
                },
                backgroundRepeat: {
                    value: 'repeat-x',
                    parsed: { enum: BACKGROUND_REPEAT['repeat-x'] },
                },
            },
        }),
        createNode({
            styles: {
                backgroundImage: {
                    value: image.src,
                    parsed: {},
                },
                backgroundRepeat: {
                    value: 'repeat-y',
                    parsed: { enum: BACKGROUND_REPEAT['repeat-y'] },
                },
            },
        }),
    ]
    const nodes_buffer_data = createNodesBufferData(renderer, nodes)
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const mode_data_float_offset = (PANEL_DATA.IMAGE_DATA.OFFSET + FLOAT32_SIZE) / FLOAT32_SIZE

    expect([
        floats[mode_data_float_offset],
        floats[PANEL_DATA_SIZE / FLOAT32_SIZE + mode_data_float_offset],
        floats[(PANEL_DATA_SIZE * 2) / FLOAT32_SIZE + mode_data_float_offset],
    ]).toEqual([2, 3, 4])
})

test('RendererWebGPU writes background image size and position into panel instance data', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: '100px',
                parsed: { value: 100, kind: UNIT.PX },
            },
            backgroundPositionX: {
                value: '4px',
                parsed: { value: 4, kind: UNIT.PX },
            },
            backgroundPositionY: {
                value: '6px',
                parsed: { value: 6, kind: UNIT.PX },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([4, 6, 100, 50])
})

test('RendererWebGPU resolves percentage background image position against available space', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        layout: { x: 0, y: 0, width: 100, height: 80 },
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundPositionX: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
            backgroundPositionY: {
                value: '100%',
                parsed: { value: 100, kind: UNIT.PERCENT },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([30, 60, 40, 20])
})

test('RendererWebGPU resolves percentage background image position after background size', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        layout: { x: 0, y: 0, width: 200, height: 120 },
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
            backgroundSizeHeight: {
                value: '25%',
                parsed: { value: 25, kind: UNIT.PERCENT },
            },
            backgroundPositionX: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
            backgroundPositionY: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([50, 45, 100, 30])
})

test('RendererWebGPU resolves percentage background image size against node layout', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        layout: { x: 0, y: 0, width: 200, height: 120 },
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
            backgroundSizeHeight: {
                value: '25%',
                parsed: { value: 25, kind: UNIT.PERCENT },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([0, 0, 100, 30])
})

test('RendererWebGPU resolves percentage background image size against bordered background area', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        layout: { x: 0, y: 0, width: 200, height: 120 },
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
            backgroundSizeHeight: {
                value: '25%',
                parsed: { value: 25, kind: UNIT.PERCENT },
            },
            borderTopStyle: { value: 'solid' },
            borderRightStyle: { value: 'solid' },
            borderBottomStyle: { value: 'solid' },
            borderLeftStyle: { value: 'solid' },
            borderTopWidth: { parsed: { value: 5 } },
            borderRightWidth: { parsed: { value: 10 } },
            borderBottomWidth: { parsed: { value: 15 } },
            borderLeftWidth: { parsed: { value: 20 } },
            borderTopColor: { parsed: { rgba: [0, 0, 0, 255] } },
            borderRightColor: { parsed: { rgba: [0, 0, 0, 255] } },
            borderBottomColor: { parsed: { rgba: [0, 0, 0, 255] } },
            borderLeftColor: { parsed: { rgba: [0, 0, 0, 255] } },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([0, 0, 85, 25])
})

test('RendererWebGPU resolves cover background image size against node layout', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        layout: { x: 0, y: 0, width: 100, height: 80 },
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: 'cover',
                parsed: { enum: BACKGROUND_SIZE.cover },
            },
            backgroundSizeHeight: {
                value: 'cover',
                parsed: { enum: BACKGROUND_SIZE.cover },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([0, 0, 160, 80])
})

test('RendererWebGPU resolves 50 percent cover background image position', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        layout: { x: 0, y: 0, width: 100, height: 80 },
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: 'cover',
                parsed: { enum: BACKGROUND_SIZE.cover },
            },
            backgroundSizeHeight: {
                value: 'cover',
                parsed: { enum: BACKGROUND_SIZE.cover },
            },
            backgroundPositionX: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
            backgroundPositionY: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([-30, 0, 160, 80])
})

test('RendererWebGPU resolves contain background image size against node layout', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        layout: { x: 0, y: 0, width: 100, height: 80 },
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: 'contain',
                parsed: { enum: BACKGROUND_SIZE.contain },
            },
            backgroundSizeHeight: {
                value: 'contain',
                parsed: { enum: BACKGROUND_SIZE.contain },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([0, 0, 100, 50])
})

test('RendererWebGPU treats unset background image size as natural image size', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: 'unset',
                parsed: { kind: KEYWORD.UNSET },
            },
            backgroundSizeHeight: {
                value: 'unset',
                parsed: { kind: KEYWORD.UNSET },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([0, 0, 40, 20])
})

test('RendererWebGPU treats unset background images as solid panels', () => {
    const renderer = createRenderer()
    const node = createNode({
        styles: {
            backgroundImage: {
                value: 'unset',
                parsed: { kind: KEYWORD.UNSET },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const mode_data_float_offset = (PANEL_DATA.IMAGE_DATA.OFFSET + FLOAT32_SIZE) / FLOAT32_SIZE

    expect(nodes_buffer_data.bytes_offset).toBe(PANEL_DATA_SIZE)
    expect(Array.from(floats.slice(mode_data_float_offset, mode_data_float_offset + 2))).toEqual([0, 0])
})

test('RendererWebGPU creates panel commands for consecutive panels', () => {
    const renderer = createRenderer()
    const render_data = collectRenderData(renderer, [createNode(), createNode()])

    expect(render_data.commands).toEqual([
        {
            kind: COMMAND_KIND_PANEL,
            panel_index: 0,
            glyph_index: 0,
        },
        {
            kind: COMMAND_KIND_PANEL,
            panel_index: 1,
            glyph_index: 0,
        },
    ])
    expect(render_data.panels).toHaveLength(2)
    expect(render_data.glyphs).toHaveLength(0)
})

test('RendererWebGPU writes panel commands into command buffer data', () => {
    const renderer = createRenderer()
    const render_data = collectRenderData(renderer, [createNode(), createNode()])
    const command_buffer_data = (renderer as any).createCommandBufferData(render_data.commands)
    const u32 = new Uint32Array(command_buffer_data.bytes.buffer)
    const command_u32_offset = COMMAND.KIND_DATA.OFFSET / UINT32_SIZE

    expect(command_buffer_data.bytes_offset).toBe(2 * COMMAND_SIZE)
    expect(Array.from(u32.slice(command_u32_offset, command_u32_offset + 4))).toEqual([COMMAND_KIND_PANEL, 0, 0, 0])
    expect(Array.from(u32.slice(COMMAND_SIZE / UINT32_SIZE, COMMAND_SIZE / UINT32_SIZE + 4))).toEqual([
        COMMAND_KIND_PANEL,
        1,
        0,
        0,
    ])
})

test('RendererWebGPU keeps panels and images across atlas layers in one panel stream', () => {
    const first_image = createImage('first.png', 40, 20)
    const second_image = createImage('second.png', 40, 20)
    const renderer = createRenderer(
        createImageManager({
            resources: {
                [first_image.src]: {
                    src: first_image.src,
                    layer: 0,
                    uv_rect: [0, 0, 0.1, 0.1],
                    image_size: [first_image.width, first_image.height],
                },
                [second_image.src]: {
                    src: second_image.src,
                    layer: 1,
                    uv_rect: [0.2, 0.2, 0.1, 0.1],
                    image_size: [second_image.width, second_image.height],
                },
            },
        }),
    )
    const render_data = collectRenderData(renderer, [
        createNode(),
        createNode({
            styles: {
                backgroundImage: {
                    value: first_image.src,
                    parsed: {},
                },
            },
        }),
        createNode({
            styles: {
                backgroundImage: {
                    value: second_image.src,
                    parsed: {},
                },
            },
        }),
    ])

    expect(render_data.commands.map((command) => command.kind)).toEqual([
        COMMAND_KIND_PANEL,
        COMMAND_KIND_PANEL,
        COMMAND_KIND_PANEL,
    ])
    expect(render_data.commands.map((command) => command.panel_index)).toEqual([0, 1, 2])
    expect(render_data.panels.map((panel) => panel.background_atlas_layer)).toEqual([0, 0, 1])
})

test('RendererWebGPU creates glyph render data from node text content', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'A B',
        layout: { x: 10, y: 20, width: 200, height: 60 },
        styles: {
            backgroundColor: {
                parsed: {
                    rgba: [0, 0, 0, 0],
                },
            },
        },
    })
    const render_data = collectRenderData(renderer, [node])

    expect(render_data.panels).toHaveLength(0)
    expect(render_data.glyphs).toHaveLength(2)
    expect(render_data.commands.map((command) => command.kind)).toEqual([COMMAND_KIND_GLYPH, COMMAND_KIND_GLYPH])
    expect(render_data.commands.map((command) => command.glyph_index)).toEqual([0, 1])
    expect(render_data.glyphs[0].layout).toEqual([10, 20, 8, 16])
    expect(render_data.glyphs[0].uv_rect).toEqual([0.1, 0.2, 0.3, 0.4])
    expect(render_data.glyphs[0].run_index).toBe(0)
    expect(render_data.glyphs[1].layout).toEqual([expect.closeTo(25.2), expect.closeTo(23.2), 8, 16])
    expect((renderer as any).text_runs).toEqual([
        {
            color: [0, 0, 0, 255],
            font_data: [2, 1, 6, FONT_ATLAS_SIZE],
            clipping: [0, 0, 0, 0],
        },
    ])
})

test('RendererWebGPU scales glyph render data with fontSize', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'AB',
        layout: { x: 10, y: 20, width: 200, height: 60 },
        styles: {
            fontSize: {
                value: '20px',
                parsed: { value: 20, kind: UNIT.PX },
            },
            backgroundColor: {
                parsed: {
                    rgba: [0, 0, 0, 0],
                },
            },
        },
    })
    const render_data = collectRenderData(renderer, [node])

    expect(render_data.glyphs[0].layout).toEqual([10, 20, 10, 20])
    expect(render_data.glyphs[1].layout).toEqual([24, 24, 10, 20])
})

test('RendererWebGPU measures text from glyph metrics', () => {
    const font = createManagedFont()
    font.metrics = {
        ascender: 1,
        descender: -0.25,
        lineHeight: 1.5,
    }
    const renderer = createRenderer(createImageManager(), createFontManager({ default_font: font }))
    const node = createNode({
        text_content: 'A B',
        styles: {
            fontSize: {
                value: '20px',
                parsed: { value: 20, kind: UNIT.PX },
            },
        },
    })

    expect(renderer.getTextMeasure(node)).toEqual({ width: 31, height: 30 })
})

test('RendererWebGPU resolves text font from fontFamily', () => {
    const alternate_font = {
        ...createManagedFont(),
        name: 'ChangaOne',
        layer: 5,
        glyphs_by_unicode: new Map([
            [
                65,
                {
                    unicode: 65,
                    advance: 1,
                    plane_bounds: [0, 0, 1, 1],
                    uv_rect: [0.6, 0.7, 0.1, 0.2],
                },
            ],
        ]),
    }
    const font_manager = createFontManager({
        default_font: createManagedFont(),
        fonts: {
            ChangaOne: alternate_font,
        },
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'A',
        layout: { x: 10, y: 20, width: 200, height: 60 },
        styles: {
            fontFamily: {
                value: 'ChangaOne',
                parsed: {},
            },
            backgroundColor: {
                parsed: {
                    rgba: [0, 0, 0, 0],
                },
            },
        },
    })
    const render_data = collectRenderData(renderer, [node])

    expect(render_data.glyphs[0].layout).toEqual([10, 20, 16, 16])
    expect(render_data.glyphs[0].uv_rect).toEqual([0.6, 0.7, 0.1, 0.2])
    expect((renderer as any).text_runs[0].font_data).toEqual([5, 1, 6, FONT_ATLAS_SIZE])
})

test('RendererWebGPU throws when fontFamily is not registered', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'A',
        styles: {
            fontFamily: {
                value: 'Missing',
                parsed: {},
            },
        },
    })

    expect(() => collectRenderData(renderer, [node])).toThrow(/Font "Missing" is not registered/)
})

test('RendererWebGPU writes glyph instance data into a glyph buffer', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'A',
        layout: { x: 10, y: 20, width: 200, height: 60 },
        styles: {},
    })
    const render_data = collectRenderData(renderer, [node])
    const glyph_buffer_data = (renderer as any).createGlyphDataBufferData(render_data.glyphs)
    const floats = new Float32Array(glyph_buffer_data.bytes.buffer)
    const u32 = new Uint32Array(glyph_buffer_data.bytes.buffer)

    expect(glyph_buffer_data.bytes_offset).toBe(GLYPH_DATA_SIZE)
    expect(Array.from(floats.slice(GLYPH_DATA.LAYOUT.OFFSET / FLOAT32_SIZE, 4))).toEqual([10, 20, 8, 16])
    expect(
        Array.from(
            floats.slice(
                GLYPH_DATA.UV_RECT.OFFSET / FLOAT32_SIZE,
                GLYPH_DATA.UV_RECT.OFFSET / FLOAT32_SIZE + 4,
            ),
        ),
    ).toEqual([expect.closeTo(0.1), expect.closeTo(0.2), expect.closeTo(0.3), expect.closeTo(0.4)])
    expect(u32[GLYPH_DATA.RUN_DATA.OFFSET / UINT32_SIZE]).toBe(0)
})

test('RendererWebGPU writes shared text run data once per text node', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'AB',
        layout: { x: 10, y: 20, width: 200, height: 60 },
        styles: {},
    })
    collectRenderData(renderer, [node])
    const text_run_buffer_data = (renderer as any).createTextRunBufferData()
    const floats = new Float32Array(text_run_buffer_data.bytes.buffer)

    expect(text_run_buffer_data.bytes_offset).toBe(TEXT_RUN_SIZE)
    expect(Array.from(floats.slice(TEXT_RUN.COLOR.OFFSET / FLOAT32_SIZE, 4))).toEqual([0, 0, 0, 1])
    expect(
        Array.from(
            floats.slice(TEXT_RUN.FONT_DATA.OFFSET / FLOAT32_SIZE, TEXT_RUN.FONT_DATA.OFFSET / FLOAT32_SIZE + 4),
        ),
    ).toEqual([2, 1, 6, FONT_ATLAS_SIZE])
    expect(
        Array.from(floats.slice(TEXT_RUN.CLIPPING.OFFSET / FLOAT32_SIZE, TEXT_RUN.CLIPPING.OFFSET / FLOAT32_SIZE + 4)),
    ).toEqual([0, 0, 0, 0])
})

test('RendererWebGPU preserves panel then text order for a text node with background', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'A',
    })
    const render_data = collectRenderData(renderer, [node])

    expect(render_data.commands.map((command) => command.kind)).toEqual([COMMAND_KIND_PANEL, COMMAND_KIND_GLYPH])
    expect(render_data.commands.map((command) => [command.panel_index, command.glyph_index])).toEqual([
        [0, 0],
        [0, 0],
    ])
})

test('RendererWebGPU creates consecutive glyph commands', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'AB',
        styles: {
            backgroundColor: {
                parsed: {
                    rgba: [0, 0, 0, 0],
                },
            },
        },
    })
    const render_data = collectRenderData(renderer, [node])

    expect(render_data.commands.map((command) => command.kind)).toEqual([COMMAND_KIND_GLYPH, COMMAND_KIND_GLYPH])
    expect(render_data.commands.map((command) => command.glyph_index)).toEqual([0, 1])
    expect(render_data.glyphs).toHaveLength(2)
})

test('RendererWebGPU writes glyph commands into command buffer data', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'AB',
        styles: {
            backgroundColor: {
                parsed: {
                    rgba: [0, 0, 0, 0],
                },
            },
        },
    })
    const render_data = collectRenderData(renderer, [node])
    const command_buffer_data = (renderer as any).createCommandBufferData(render_data.commands)
    const u32 = new Uint32Array(command_buffer_data.bytes.buffer)

    expect(command_buffer_data.bytes_offset).toBe(2 * COMMAND_SIZE)
    expect(Array.from(u32.slice(0, 4))).toEqual([COMMAND_KIND_GLYPH, 0, 0, 0])
    expect(Array.from(u32.slice(COMMAND_SIZE / UINT32_SIZE, COMMAND_SIZE / UINT32_SIZE + 4))).toEqual([
        COMMAND_KIND_GLYPH,
        0,
        1,
        0,
    ])
})

test('RendererWebGPU keeps interleaved panel and text command order', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const first = createNode({
        text_content: 'A',
    })
    const second = createNode()
    const render_data = collectRenderData(renderer, [first, second])

    expect(render_data.commands.map((command) => command.kind)).toEqual([
        COMMAND_KIND_PANEL,
        COMMAND_KIND_GLYPH,
        COMMAND_KIND_PANEL,
    ])
    expect(render_data.commands.map((command) => [command.panel_index, command.glyph_index])).toEqual([
        [0, 0],
        [0, 0],
        [1, 0],
    ])
})

test('ImageManager creates separate resources for separate srcs with the same bitmap', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const first_image = createImage('first.png', 32, 32)
    const first = image_manager.imageUpload('first', first_image)
    const copy_count = device.copies.length
    const second = image_manager.imageUpload('second', {
        ...createImage('second.png', 32, 32),
        bitmap: first_image.bitmap,
    })

    expect(second).not.toBe(first)
    expect(device.copies).toHaveLength(copy_count + 1)
})

test('ImageManager releases atlas space without clearing texture data', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const first_image = createImage('first.png', 32, 32)
    const first = image_manager.imageUpload('first', first_image)
    const copy_count = device.copies.length
    const write_count = device.writes.length

    image_manager.imageDispose('first')
    const second = image_manager.imageUpload('second', createImage('second.png', 32, 32))

    expect(image_manager.getImage('first')).toBeUndefined()
    expect(second.layer).toBe(first.layer)
    expect(second.uv_rect[0]).toBe(first.uv_rect[0])
    expect(second.uv_rect[1]).toBe(first.uv_rect[1])
    expect(device.copies).toHaveLength(copy_count + 1)
    expect(device.writes).toHaveLength(write_count)
    expect(device.copies[copy_count].destination.origin).toEqual([0, 0, 0])
})

test('ImageManager reuses disposed atlas space before growing the atlas', () => {
    const ATLAS_TEST_SIZE = 64
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device, ATLAS_TEST_SIZE)

    image_manager.imageUpload('image-0', createImage('image-0.png', 30, 30))
    image_manager.imageUpload('image-1', createImage('image-1.png', 30, 30))
    const disposed = image_manager.imageUpload('image-2', createImage('image-2.png', 30, 30))
    image_manager.imageUpload('image-3', createImage('image-3.png', 30, 30))

    const atlas_texture_count = getAtlasTextures(device).length
    const texture_copy_count = device.texture_copies.length

    image_manager.imageDispose('image-2')
    const replacement = image_manager.imageUpload('replacement', createImage('replacement.png', 30, 30))

    expect(replacement.layer).toBe(disposed.layer)
    expect(replacement.uv_rect[0]).toBe(disposed.uv_rect[0])
    expect(replacement.uv_rect[1]).toBe(disposed.uv_rect[1])
    expect(getAtlasTextures(device)).toHaveLength(atlas_texture_count)
    expect(device.texture_copies).toHaveLength(texture_copy_count)
})

test('ImageManager replaces resources uploaded with the same src', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const first = image_manager.imageUpload('avatar', createImage('avatar-small.png', 32, 32))
    const copy_count = device.copies.length
    const second = image_manager.imageUpload('avatar', createImage('avatar-large.png', 64, 16))

    expect(second).not.toBe(first)
    expect(image_manager.getImage('avatar')).toBe(second)
    expect(second.image_size).toEqual([64, 16])
    expect(device.copies).toHaveLength(copy_count + 1)
})

test('ImageManager lists uploaded images', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const first_image = createImage('first.png', 32, 32)
    const second_image = createImage('second.png', 64, 16)

    image_manager.imageUpload('first', first_image)
    image_manager.imageUpload('second', second_image)

    expect(image_manager.imageList()).toEqual([
        { src: 'first', image: first_image, nodes: expect.any(Set) },
        { src: 'second', image: second_image, nodes: expect.any(Set) },
    ])

    image_manager.imageDispose('first')
    expect(image_manager.imageList()).toEqual([{ src: 'second', image: second_image, nodes: expect.any(Set) }])
})

test('ImageManager packs small images into atlas layers', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const resource = image_manager.imageUpload('small', createImage('small.png', 32, 16))

    expect(resource.layer).toBe(0)
    expect(resource.image_size).toEqual([32, 16])
    expect(resource.uv_rect[0]).toBe(0)
    expect(resource.uv_rect[1]).toBe(0)
    expect(resource.uv_rect[2]).toBeGreaterThan(0)
    expect(resource.uv_rect[3]).toBeGreaterThan(0)
    expect(device.textures[0].descriptor.size).toEqual({
        width: ATLAS_SIZE,
        height: ATLAS_SIZE,
        depthOrArrayLayers: 2,
    })
    expect(device.textures[0].descriptor.usage & GPUTextureUsage.COPY_SRC).toBe(GPUTextureUsage.COPY_SRC)
    expect(device.copies[0].destination.origin).toEqual([0, 0, 0])
})

test('ImageManager stores full-width images in the atlas', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const resource = image_manager.imageUpload('large', createImage('large.png', ATLAS_SIZE, 128))

    expect(resource.layer).toBe(0)
    expect(resource.uv_rect).toEqual([0, 0, 1, 128 / ATLAS_SIZE])
    expect(device.copies[0].destination.origin).toEqual([0, 0, 0])
    expect(getAtlasTextures(device)).toHaveLength(1)
})

test('ImageManager packs images into the lowest skyline gap', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    image_manager.imageUpload('tall', createImage('tall.png', 800, 300))
    image_manager.imageUpload('short', createImage('short.png', 1200, 100))
    const resource = image_manager.imageUpload('gap', createImage('gap.png', 700, 150))

    expect(resource.layer).toBe(0)
    expect(resource.uv_rect).toEqual([
        (800 + ATLAS_PADDING) / ATLAS_SIZE,
        (100 + ATLAS_PADDING) / ATLAS_SIZE,
        700 / ATLAS_SIZE,
        150 / ATLAS_SIZE,
    ])
})

test('ImageManager throws for images larger than one atlas layer', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)

    expect(() => image_manager.imageUpload('too-large', createImage('too-large.png', ATLAS_SIZE + 1, 1))).toThrow(
        /exceeds the 2048x2048 UI atlas layer size/,
    )
})

test('ImageManager grows the atlas texture when the current layer is full', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const first = image_manager.imageUpload('image-0', createImage('image-0.png', ATLAS_SIZE, ATLAS_SIZE))
    const second = image_manager.imageUpload('image-1', createImage('image-1.png', 1, 1))

    expect(first.layer).toBe(0)
    expect(second.layer).toBe(1)
    expect(getAtlasTextures(device)).toHaveLength(2)
})

test('ImageManager grows the atlas texture when physical layer capacity is full', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    image_manager.imageUpload('image-0', createImage('image-0.png', ATLAS_SIZE, ATLAS_SIZE))
    image_manager.imageUpload('image-1', createImage('image-1.png', ATLAS_SIZE, ATLAS_SIZE))
    const third = image_manager.imageUpload('image-2', createImage('image-2.png', 1, 1))

    expect(third.layer).toBe(2)
    const atlas_textures = getAtlasTextures(device)
    expect(atlas_textures).toHaveLength(3)
    expect(atlas_textures[0].destroyed).toBe(true)
    expect(atlas_textures[1].destroyed).toBe(true)
    expect(atlas_textures[2].descriptor.size.depthOrArrayLayers).toBe(3)
    expect(device.texture_copies[0].size).toEqual([ATLAS_SIZE, ATLAS_SIZE, 1])
    expect(device.texture_copies[1].size).toEqual([ATLAS_SIZE, ATLAS_SIZE, 2])
})

test('ImageManager throws when atlas growth exceeds the device layer limit', () => {
    const device = createFakeDevice({ max_texture_array_layers: 2 })
    const image_manager = createRealImageManager(device)

    image_manager.imageUpload('image-0', createImage('image-0.png', ATLAS_SIZE, ATLAS_SIZE))
    image_manager.imageUpload('image-1', createImage('image-1.png', ATLAS_SIZE, ATLAS_SIZE))
    expect(() => image_manager.imageUpload('image-2', createImage('image-2.png', 1, 1))).toThrow(
        /this device supports 2/,
    )
})

test('FontManager registers a font in the first texture layer', () => {
    const device = createFakeDevice()
    const font_manager = createRealFontManager(device)
    const image = createImage('Poppins.png', 484, 484)
    const json = createFontJson()
    const font = font_manager.fontRegister('Poppins', image, json)

    expect(font).toMatchObject({
        name: 'Poppins',
        image,
        json,
        layer: 0,
        uv_rect: [0, 0, 484 / ATLAS_SIZE, 484 / ATLAS_SIZE],
        image_size: [484, 484],
        metrics: json.metrics,
    })
    expect(font.glyphs_by_unicode.get(65)).toEqual({
        unicode: 65,
        advance: 0.5,
        plane_bounds: [0, 0, 0.5, 1],
        uv_rect: [10 / ATLAS_SIZE, 10 / ATLAS_SIZE, 20 / ATLAS_SIZE, 20 / ATLAS_SIZE],
    })
    expect(font_manager.getDefaultFont()).toBe(font)
    expect(font_manager.fonts.get('Poppins')).toBe(font)
    expect(device.textures[0].descriptor.size).toEqual({
        width: ATLAS_SIZE,
        height: ATLAS_SIZE,
        depthOrArrayLayers: 2,
    })
    expect(device.textures[0].descriptor.usage & GPUTextureUsage.RENDER_ATTACHMENT).toBe(
        GPUTextureUsage.RENDER_ATTACHMENT,
    )
    expect(device.copies[0].destination.origin).toEqual([0, 0, 0])
})

test('FontManager registers separate fonts in separate texture layers', () => {
    const device = createFakeDevice()
    const font_manager = createRealFontManager(device)
    const first = font_manager.fontRegister('Poppins', createImage('Poppins.png', 484, 484), createFontJson())
    const second = font_manager.fontRegister('ChangaOne', createImage('ChangaOne.png', 512, 512), createFontJson())

    expect(first.layer).toBe(0)
    expect(second.layer).toBe(1)
    expect(font_manager.getDefaultFont()).toBe(first)
    expect(font_manager.getFont('Poppins')).toBe(first)
    expect(font_manager.getFont('ChangaOne')).toBe(second)
    expect(device.copies[0].destination.origin).toEqual([0, 0, 0])
    expect(device.copies[1].destination.origin).toEqual([0, 0, 1])
    expect(getAtlasTextures(device)).toHaveLength(1)
})

test('FontManager replaces a registered font in the same texture layer', () => {
    const device = createFakeDevice()
    const font_manager = createRealFontManager(device)
    const first = font_manager.fontRegister('Poppins', createImage('Poppins-small.png', 256, 256), createFontJson())
    const second_image = createImage('Poppins-large.png', 512, 128)
    const second = font_manager.fontRegister('Poppins', second_image, createFontJson())

    expect(second).not.toBe(first)
    expect(second.layer).toBe(first.layer)
    expect(second.image).toBe(second_image)
    expect(second.image_size).toEqual([512, 128])
    expect(font_manager.getDefaultFont()).toBe(second)
    expect(device.copies[1].destination.origin).toEqual([0, 0, 0])
    expect(getAtlasTextures(device)).toHaveLength(1)
})

test('FontManager grows the font texture when physical layer capacity is full', () => {
    const device = createFakeDevice()
    const font_manager = createRealFontManager(device)
    font_manager.fontRegister('font-0', createImage('font-0.png', 64, 64), createFontJson())
    font_manager.fontRegister('font-1', createImage('font-1.png', 64, 64), createFontJson())
    const third = font_manager.fontRegister('font-2', createImage('font-2.png', 64, 64), createFontJson())

    expect(third.layer).toBe(2)
    const atlas_textures = getAtlasTextures(device)
    expect(atlas_textures).toHaveLength(2)
    expect(atlas_textures[0].destroyed).toBe(true)
    expect(atlas_textures[1].descriptor.size.depthOrArrayLayers).toBe(3)
    expect(device.texture_copies[0].size).toEqual([ATLAS_SIZE, ATLAS_SIZE, 2])
    expect(device.copies[2].destination.origin).toEqual([0, 0, 2])
})

test('FontManager throws for font atlases larger than one texture layer', () => {
    const device = createFakeDevice()
    const font_manager = createRealFontManager(device)

    expect(() =>
        font_manager.fontRegister('too-large', createImage('too-large.png', ATLAS_SIZE + 1, 1), createFontJson()),
    ).toThrow(/exceeds the 2048x2048 UI font atlas layer size/)
})

test('FontManager throws when font texture growth exceeds the device layer limit', () => {
    const device = createFakeDevice({ max_texture_array_layers: 2 })
    const font_manager = createRealFontManager(device)

    font_manager.fontRegister('font-0', createImage('font-0.png', 64, 64), createFontJson())
    font_manager.fontRegister('font-1', createImage('font-1.png', 64, 64), createFontJson())
    expect(() => font_manager.fontRegister('font-2', createImage('font-2.png', 64, 64), createFontJson())).toThrow(
        /this device supports 2/,
    )
})

function createNodesBufferData(renderer, nodes) {
    const render_data = collectRenderData(renderer, nodes)

    return (renderer as any).createPanelDataBufferData(render_data.panels)
}

function collectRenderData(renderer, nodes) {
    return (renderer as any).collectRenderData(nodes)
}

function createRenderer(image_manager = createImageManager(), font_manager = createFontManager()) {
    const renderer = new RendererWebGPU({ canvas: {} })
    ;(renderer as any).image_manager = image_manager
    ;(renderer as any).font_manager = font_manager

    return renderer
}

function createImageManager({ resources = {} } = {}) {
    return {
        getImage(src) {
            return resources[src]
        },
        getTextureView() {
            return { id: 'atlas-view' }
        },
    }
}

function createRealImageManager(device, atlas_size = ATLAS_SIZE) {
    return new ImageManager({
        device,
        atlas_size,
    })
}

function createRealFontManager(device, atlas_size = ATLAS_SIZE) {
    return new FontManager({
        device,
        atlas_size,
    })
}

function createFontManager({ default_font = undefined, fonts = {} } = {}) {
    return {
        getDefaultFont() {
            return default_font
        },
        getFont(name) {
            return fonts[name]
        },
        getTextureView() {
            return { id: 'font-view' }
        },
    }
}

function createManagedFont() {
    return {
        name: 'Poppins',
        layer: 2,
        json: {
            atlas: {
                distanceRange: 6,
            },
        },
        metrics: {
            ascender: 1,
        },
        glyphs_by_unicode: new Map([
            [
                65,
                {
                    unicode: 65,
                    advance: 0.6,
                    plane_bounds: [0, 0, 0.5, 1],
                    uv_rect: [0.1, 0.2, 0.3, 0.4],
                },
            ],
            [
                32,
                {
                    unicode: 32,
                    advance: 0.25,
                },
            ],
            [
                66,
                {
                    unicode: 66,
                    advance: 0.7,
                    plane_bounds: [0.1, -0.2, 0.6, 0.8],
                    uv_rect: [0.5, 0.6, 0.2, 0.3],
                },
            ],
        ]),
    }
}

function createFontJson() {
    return {
        atlas: {
            type: 'mtsdf',
            distanceRange: 6,
            width: 484,
            height: 484,
            yOrigin: 'bottom',
        },
        metrics: {
            ascender: 1,
            descender: -0.25,
            lineHeight: 1.25,
        },
        glyphs: [
            {
                unicode: 65,
                advance: 0.5,
                planeBounds: {
                    left: 0,
                    bottom: 0,
                    right: 0.5,
                    top: 1,
                },
                atlasBounds: {
                    left: 10,
                    bottom: 454,
                    right: 30,
                    top: 474,
                },
            },
            {
                unicode: 32,
                advance: 0.25,
            },
        ],
        kerning: [],
    }
}

function createImage(src, width, height) {
    return {
        src,
        width,
        height,
        bitmap: { src },
    }
}

function createFakeDevice({ max_texture_array_layers = 8 } = {}) {
    const textures: any[] = []
    const bind_groups: any[] = []
    const copies: any[] = []
    const texture_copies: any[] = []
    const command_buffers: any[] = []
    const writes: any[] = []
    const device = {
        limits: {
            maxTextureArrayLayers: max_texture_array_layers,
        },
        textures,
        bind_groups,
        copies,
        texture_copies,
        command_buffers,
        writes,
        createTexture(descriptor) {
            const view = { id: `view-${textures.length}` }
            const texture = {
                id: `texture-${textures.length}`,
                descriptor,
                destroyed: false,
                createView() {
                    return view
                },
                destroy() {
                    texture.destroyed = true
                },
            }
            textures.push(texture)

            return texture
        },
        createBindGroup(descriptor) {
            const bind_group = {
                id: `bind-group-${bind_groups.length}`,
                descriptor,
            }
            bind_groups.push(bind_group)

            return bind_group
        },
        createCommandEncoder() {
            return {
                copyTextureToTexture(source, destination, size) {
                    texture_copies.push({ source, destination, size })
                },
                finish() {
                    return { texture_copies }
                },
            }
        },
        queue: {
            copyExternalImageToTexture(source, destination, size) {
                copies.push({ source, destination, size })
            },
            submit(next_command_buffers) {
                command_buffers.push(...next_command_buffers)
            },
            writeTexture(destination, data, layout, size) {
                writes.push({ destination, data, layout, size })
            },
        },
    }

    return device
}

function getAtlasTextures(device) {
    return device.textures.filter((texture) => texture.descriptor.usage & GPUTextureUsage.TEXTURE_BINDING)
}

function createNode({
    parent = null,
    opacity = 1,
    layout = {
        x: 0,
        y: 0,
        width: 10,
        height: 10,
    },
    overflow,
    styles = {},
    text_content = '',
}: {
    parent?: any
    opacity?: number
    layout?: { x: number; y: number; width: number; height: number }
    overflow?: number
    styles?: Record<string, any>
    text_content?: string
} = {}) {
    return {
        parent,
        layout,
        text_content,
        styles: {
            backgroundColor: {
                parsed: {
                    rgba: [255, 0, 0, 255],
                },
            },
            opacity: {
                parsed: {
                    value: opacity,
                },
            },
            ...(overflow === undefined
                ? {}
                : {
                      overflow: {
                          parsed: {
                              enum: overflow,
                          },
                      },
                  }),
            ...styles,
        },
    }
}
