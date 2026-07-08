import { expect, test } from '@playwright/test'
import RendererWebGPU from '../src/renderer/RendererWebGPU.ts'
import { BACKGROUND_REPEAT, BACKGROUND_SIZE, KEYWORD, OVERFLOW, UNIT } from '../src/style/consts.ts'
import {
    ATTRIBUTES_SIZE,
    ATTRIBUTES,
    FLOAT32_SIZE,
    TEXT_ATTRIBUTES,
    TEXT_ATTRIBUTES_SIZE,
    TEXT_RUN,
    TEXT_RUN_SIZE,
} from '../src/renderer/webgpu/buffers.ts'
import { FontManager } from '../src/renderer/webgpu/FontManager.ts'
import { ATLAS_PADDING, ATLAS_SIZE, ImageManager } from '../src/renderer/webgpu/ImageManager.ts'
;(globalThis as any).GPUTextureUsage = {
    TEXTURE_BINDING: 1,
    COPY_SRC: 2,
    COPY_DST: 4,
    RENDER_ATTACHMENT: 8,
}

const TEST_PANEL_PIPELINE = { id: 'panel-pipeline' }
const TEST_TEXT_PIPELINE = { id: 'text-pipeline' }

test('RendererWebGPU accumulates opacity into panel instance data', () => {
    const root = createNode({ opacity: 0.5 })
    const parent = createNode({ parent: root, opacity: 0.5 })
    const child = createNode({ parent, opacity: 0.8 })
    const renderer = createRenderer()
    const nodes_buffer_data = createNodesBufferData(renderer, [child])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const opacity_float_offset = ATTRIBUTES.OPACITY.OFFSET / FLOAT32_SIZE

    expect(nodes_buffer_data.bytes_offset).toBe(ATTRIBUTES_SIZE)
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
    const layout_float_offset = ATTRIBUTES.LAYOUT.OFFSET / FLOAT32_SIZE
    const clipping_float_offset = ATTRIBUTES.CLIPPING.OFFSET / FLOAT32_SIZE

    expect(nodes_buffer_data.bytes_offset).toBe(ATTRIBUTES_SIZE)
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
    const border_radius_x_float_offset = ATTRIBUTES.BORDERRADIUS_X.OFFSET / FLOAT32_SIZE
    const border_radius_y_float_offset = ATTRIBUTES.BORDERRADIUS_Y.OFFSET / FLOAT32_SIZE
    const border_widths_float_offset = ATTRIBUTES.BORDERWIDTHS.OFFSET / FLOAT32_SIZE

    expect(nodes_buffer_data.bytes_offset).toBe(ATTRIBUTES_SIZE)
    expect(Array.from(floats.slice(border_radius_x_float_offset, border_radius_x_float_offset + 4))).toEqual([
        10, 2, 3, 4,
    ])
    expect(Array.from(floats.slice(border_radius_y_float_offset, border_radius_y_float_offset + 4))).toEqual([
        5, 2, 3, 4,
    ])
    expect(Array.from(floats.slice(border_widths_float_offset, border_widths_float_offset + 4))).toEqual([5, 6, 7, 8])
    expect(Array.from(bytes.slice(ATTRIBUTES.BORDERCOLOR_TOP.OFFSET, ATTRIBUTES.BORDERCOLOR_TOP.OFFSET + 4))).toEqual([
        1, 2, 3, 4,
    ])
    expect(
        Array.from(bytes.slice(ATTRIBUTES.BORDERCOLOR_RIGHT.OFFSET, ATTRIBUTES.BORDERCOLOR_RIGHT.OFFSET + 4)),
    ).toEqual([5, 6, 7, 8])
    expect(
        Array.from(bytes.slice(ATTRIBUTES.BORDERCOLOR_BOTTOM.OFFSET, ATTRIBUTES.BORDERCOLOR_BOTTOM.OFFSET + 4)),
    ).toEqual([9, 10, 11, 12])
    expect(Array.from(bytes.slice(ATTRIBUTES.BORDERCOLOR_LEFT.OFFSET, ATTRIBUTES.BORDERCOLOR_LEFT.OFFSET + 4))).toEqual(
        [13, 14, 15, 16],
    )
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
    const mode_data_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_MODE_DATA.OFFSET / FLOAT32_SIZE
    const uv_rect_float_offset = ATTRIBUTES.BACKGROUND_UV_RECT.OFFSET / FLOAT32_SIZE
    const image_rect_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

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
    const mode_data_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_MODE_DATA.OFFSET / FLOAT32_SIZE

    expect([
        floats[mode_data_float_offset],
        floats[ATTRIBUTES_SIZE / FLOAT32_SIZE + mode_data_float_offset],
        floats[(ATTRIBUTES_SIZE * 2) / FLOAT32_SIZE + mode_data_float_offset],
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
    const image_rect_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

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
    const image_rect_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

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
    const image_rect_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

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
    const image_rect_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

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
    const image_rect_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

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
    const image_rect_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

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
    const image_rect_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

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
    const image_rect_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

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
    const image_rect_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

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
    const mode_data_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_MODE_DATA.OFFSET / FLOAT32_SIZE

    expect(nodes_buffer_data.bytes_offset).toBe(ATTRIBUTES_SIZE)
    expect(Array.from(floats.slice(mode_data_float_offset, mode_data_float_offset + 2))).toEqual([0, 0])
})

test('RendererWebGPU batches consecutive solid panels together', () => {
    const bind_group = createBindGroup('atlas')
    const renderer = createRenderer(createImageManager({ bind_group }))
    const batches = (renderer as any).buildBatches([createRenderItem(bind_group, 0), createRenderItem(bind_group, 1)])

    expect(batches).toEqual([
        {
            pipeline: (renderer as any).pipeline,
            bind_group,
            buffer_kind: 'panel',
            first_instance: 0,
            instance_count: 2,
        },
    ])
})

test('RendererWebGPU batches consecutive atlas images together', () => {
    const bind_group = createBindGroup('atlas')
    const renderer = createRenderer()
    const batches = (renderer as any).buildBatches([createRenderItem(bind_group, 0), createRenderItem(bind_group, 1)])

    expect(batches).toHaveLength(1)
    expect(batches[0].first_instance).toBe(0)
    expect(batches[0].instance_count).toBe(2)
    expect(batches[0].bind_group).toBe(bind_group)
    expect(batches[0].buffer_kind).toBe('panel')
})

test('RendererWebGPU batches panels and images across atlas layers together', () => {
    const bind_group = createBindGroup('atlas')
    const first_image = createImage('first.png', 40, 20)
    const second_image = createImage('second.png', 40, 20)
    const renderer = createRenderer(
        createImageManager({
            bind_group,
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
    const render_items = (renderer as any).collectRenderItems([
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
    const batches = (renderer as any).buildBatches(render_items)

    expect(batches).toHaveLength(1)
    expect(batches[0].first_instance).toBe(0)
    expect(batches[0].instance_count).toBe(3)
    expect(batches[0].bind_group).toBe(bind_group)
    expect(batches[0].buffer_kind).toBe('panel')
})

test('RendererWebGPU batches atlas panels and images together', () => {
    const bind_group = createBindGroup('atlas')
    const renderer = createRenderer()
    const batches = (renderer as any).buildBatches([
        createRenderItem(bind_group, 0),
        createRenderItem(bind_group, 1),
        createRenderItem(bind_group, 2),
    ])

    expect(batches).toHaveLength(1)
    expect(batches[0].first_instance).toBe(0)
    expect(batches[0].instance_count).toBe(3)
    expect(batches[0].bind_group).toBe(bind_group)
    expect(batches[0].buffer_kind).toBe('panel')
})

test('RendererWebGPU creates text render items from node text content', () => {
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
    const render_items = (renderer as any).collectRenderItems([node])

    expect(render_items).toHaveLength(2)
    expect(render_items.map((item) => item.buffer_kind)).toEqual(['text', 'text'])
    expect(render_items.map((item) => item.buffer_index)).toEqual([0, 1])
    expect(render_items[0].instance_data.layout).toEqual([10, 20, 16, 32])
    expect(render_items[0].instance_data.uv_rect).toEqual([0.1, 0.2, 0.3, 0.4])
    expect(render_items[0].instance_data.run_index).toBe(0)
    expect(render_items[1].instance_data.layout).toEqual([expect.closeTo(40.4), expect.closeTo(26.4), 16, 32])
    expect((renderer as any).text_runs).toEqual([
        {
            color: [0, 0, 0, 255],
            font_data: [2, 1, 0, 0],
            clipping: [0, 0, 0, 0],
        },
    ])
})

test('RendererWebGPU writes glyph instance data into a text buffer', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'A',
        layout: { x: 10, y: 20, width: 200, height: 60 },
        styles: {},
    })
    const render_items = (renderer as any).collectRenderItems([node])
    const text_buffer_data = (renderer as any).createTextBufferData(render_items)
    const floats = new Float32Array(text_buffer_data.bytes.buffer)

    expect(text_buffer_data.bytes_offset).toBe(TEXT_ATTRIBUTES_SIZE)
    expect(Array.from(floats.slice(TEXT_ATTRIBUTES.LAYOUT.OFFSET / FLOAT32_SIZE, 4))).toEqual([10, 20, 16, 32])
    expect(
        Array.from(
            floats.slice(
                TEXT_ATTRIBUTES.UV_RECT.OFFSET / FLOAT32_SIZE,
                TEXT_ATTRIBUTES.UV_RECT.OFFSET / FLOAT32_SIZE + 4,
            ),
        ),
    ).toEqual([expect.closeTo(0.1), expect.closeTo(0.2), expect.closeTo(0.3), expect.closeTo(0.4)])
    expect(floats[TEXT_ATTRIBUTES.RUN_INDEX.OFFSET / FLOAT32_SIZE]).toBe(0)
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
    ;(renderer as any).collectRenderItems([node])
    const text_run_buffer_data = (renderer as any).createTextRunBufferData()
    const floats = new Float32Array(text_run_buffer_data.bytes.buffer)

    expect(text_run_buffer_data.bytes_offset).toBe(TEXT_RUN_SIZE)
    expect(Array.from(floats.slice(TEXT_RUN.COLOR.OFFSET / FLOAT32_SIZE, 4))).toEqual([0, 0, 0, 1])
    expect(
        Array.from(
            floats.slice(TEXT_RUN.FONT_DATA.OFFSET / FLOAT32_SIZE, TEXT_RUN.FONT_DATA.OFFSET / FLOAT32_SIZE + 4),
        ),
    ).toEqual([2, 1, 0, 0])
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
    const render_items = (renderer as any).collectRenderItems([node])

    expect(render_items.map((item) => item.buffer_kind)).toEqual(['panel', 'text'])
    expect(render_items.map((item) => item.buffer_index)).toEqual([0, 0])
})

test('RendererWebGPU batches consecutive glyphs together', () => {
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
    const render_items = (renderer as any).collectRenderItems([node])
    const batches = (renderer as any).buildBatches(render_items)

    expect(batches).toHaveLength(1)
    expect(batches[0]).toMatchObject({
        pipeline: TEST_TEXT_PIPELINE,
        bind_group: font_manager.bind_group,
        buffer_kind: 'text',
        first_instance: 0,
        instance_count: 2,
    })
})

test('RendererWebGPU keeps interleaved panel and text batches separate', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const first = createNode({
        text_content: 'A',
    })
    const second = createNode()
    const render_items = (renderer as any).collectRenderItems([first, second])
    const batches = (renderer as any).buildBatches(render_items)

    expect(render_items.map((item) => item.buffer_kind)).toEqual(['panel', 'text', 'panel'])
    expect(batches.map((batch) => batch.buffer_kind)).toEqual(['panel', 'text', 'panel'])
    expect(batches.map((batch) => batch.first_instance)).toEqual([0, 0, 1])
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
    const bind_group_count = device.bind_groups.length
    const texture_copy_count = device.texture_copies.length

    image_manager.imageDispose('image-2')
    const replacement = image_manager.imageUpload('replacement', createImage('replacement.png', 30, 30))

    expect(replacement.layer).toBe(disposed.layer)
    expect(replacement.uv_rect[0]).toBe(disposed.uv_rect[0])
    expect(replacement.uv_rect[1]).toBe(disposed.uv_rect[1])
    expect(getAtlasTextures(device)).toHaveLength(atlas_texture_count)
    expect(device.bind_groups).toHaveLength(bind_group_count)
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
    expect(device.bind_groups).toHaveLength(2)
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
    expect(device.bind_groups).toHaveLength(3)
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
    const bind_group_count = device.bind_groups.length
    const third = font_manager.fontRegister('font-2', createImage('font-2.png', 64, 64), createFontJson())

    expect(third.layer).toBe(2)
    const atlas_textures = getAtlasTextures(device)
    expect(atlas_textures).toHaveLength(2)
    expect(atlas_textures[0].destroyed).toBe(true)
    expect(atlas_textures[1].descriptor.size.depthOrArrayLayers).toBe(3)
    expect(device.texture_copies[0].size).toEqual([ATLAS_SIZE, ATLAS_SIZE, 2])
    expect(device.copies[2].destination.origin).toEqual([0, 0, 2])
    expect(device.bind_groups).toHaveLength(bind_group_count + 1)
    expect(font_manager.bind_group).toBe(device.bind_groups[device.bind_groups.length - 1])
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
    const render_items = (renderer as any).collectRenderItems(nodes)

    return (renderer as any).createNodesBufferData(render_items)
}

function createRenderer(image_manager = createImageManager(), font_manager = createFontManager()) {
    const renderer = new RendererWebGPU({ canvas: {} })
    ;(renderer as any).pipeline = TEST_PANEL_PIPELINE
    ;(renderer as any).text_pipeline = TEST_TEXT_PIPELINE
    ;(renderer as any).image_manager = image_manager
    ;(renderer as any).font_manager = font_manager

    return renderer
}

function createImageManager({ bind_group = createBindGroup('atlas'), resources = {} } = {}) {
    return {
        bind_group,
        getImage(src) {
            return resources[src]
        },
    }
}

function createRealImageManager(device, atlas_size = ATLAS_SIZE) {
    return new ImageManager({
        device,
        bind_group_layout: { id: 'layout' },
        viewport_buffer: { id: 'viewport' },
        sampler: { id: 'sampler' },
        atlas_size,
    })
}

function createRealFontManager(device, atlas_size = ATLAS_SIZE) {
    return new FontManager({
        device,
        bind_group_layout: { id: 'font-layout' },
        viewport_buffer: { id: 'viewport' },
        sampler: { id: 'sampler' },
        text_run_buffer: { id: 'text-runs' },
        atlas_size,
    })
}

function createFontManager({ bind_group = createBindGroup('font-atlas'), default_font = undefined } = {}) {
    return {
        bind_group,
        getDefaultFont() {
            return default_font
        },
        setTextRunBuffer() {},
    }
}

function createRenderItem(bind_group, buffer_index = 0) {
    return {
        pipeline: TEST_PANEL_PIPELINE,
        bind_group,
        buffer_kind: 'panel',
        buffer_index,
        instance_data: {},
    }
}

function createManagedFont() {
    return {
        name: 'Poppins',
        layer: 2,
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

function createBindGroup(id) {
    return { id }
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
