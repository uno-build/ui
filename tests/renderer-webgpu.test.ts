import { expect, test } from '@playwright/test'
import RendererWebGPU from '../src/renderer/RendererWebGPU.ts'
import { OVERFLOW, UNIT } from '../src/style/consts.ts'
import { ATTRIBUTES_SIZE, ATTRIBUTES, FLOAT32_SIZE } from '../src/renderer/webgpu/buffers.ts'
import { ATLAS_PADDING, ATLAS_SIZE, TextureManager } from '../src/renderer/webgpu/textures.ts'

;(globalThis as any).GPUTextureUsage = {
    TEXTURE_BINDING: 1,
    COPY_DST: 2,
    RENDER_ATTACHMENT: 4,
}

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

test('RendererWebGPU writes layout and clipping into panel instance data', () => {
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
    expect(Array.from(floats.slice(clipping_float_offset, clipping_float_offset + 4))).toEqual([3, 3, 3, 2])
})

test('RendererWebGPU writes border drawing data into panel instance data', () => {
    const node = createNode({
        layout: { x: 0, y: 0, width: 20, height: 10 },
        styles: {
            borderTopLeftRadius: { parsed: { unit: UNIT.PERCENT, value: 50 } },
            borderTopRightRadius: { parsed: { unit: UNIT.PX, value: 2 } },
            borderBottomRightRadius: { parsed: { unit: UNIT.PX, value: 3 } },
            borderBottomLeftRadius: { parsed: { unit: UNIT.PX, value: 4 } },
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
    const page = createTexturePage('atlas')
    const texture_manager = createTextureManager({
        resources: {
            [image.src]: {
                kind: 'atlas',
                page,
                uv_rect: [0.1, 0.2, 0.3, 0.4],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(texture_manager)
    const node = createNode({
        styles: {
            backgroundImage: {
                parsed: image,
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const mode_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_MODE.OFFSET / FLOAT32_SIZE
    const uv_rect_float_offset = ATTRIBUTES.BACKGROUND_UV_RECT.OFFSET / FLOAT32_SIZE
    const image_size_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_SIZE.OFFSET / FLOAT32_SIZE

    expect(floats[mode_float_offset]).toBe(1)
    expect(Array.from(floats.slice(uv_rect_float_offset, uv_rect_float_offset + 4))).toEqual([
        expect.closeTo(0.1),
        expect.closeTo(0.2),
        expect.closeTo(0.3),
        expect.closeTo(0.4),
    ])
    expect(Array.from(floats.slice(image_size_float_offset, image_size_float_offset + 2))).toEqual([40, 20])
})

test('RendererWebGPU batches consecutive solid panels together', () => {
    const page = createTexturePage('default')
    const renderer = createRenderer(createTextureManager({ default_page: page }))
    const batches = (renderer as any).buildBatches([
        createRenderItem('panel', page),
        createRenderItem('panel', page),
    ])

    expect(batches).toEqual([
        {
            kind: 'panel',
            pipeline: (renderer as any).pipeline,
            bind_group: page.bind_group,
            first_instance: 0,
            instance_count: 2,
        },
    ])
})

test('RendererWebGPU batches consecutive images on the same atlas page', () => {
    const page = createTexturePage('atlas')
    const renderer = createRenderer()
    const batches = (renderer as any).buildBatches([
        createRenderItem('image_panel', page),
        createRenderItem('image_panel', page),
    ])

    expect(batches).toHaveLength(1)
    expect(batches[0].first_instance).toBe(0)
    expect(batches[0].instance_count).toBe(2)
    expect(batches[0].bind_group).toBe(page.bind_group)
})

test('RendererWebGPU breaks batches for dedicated textures', () => {
    const atlas_page = createTexturePage('atlas')
    const dedicated_page = createTexturePage('dedicated')
    const renderer = createRenderer()
    const batches = (renderer as any).buildBatches([
        createRenderItem('image_panel', atlas_page),
        createRenderItem('image_panel', dedicated_page),
        createRenderItem('image_panel', atlas_page),
    ])

    expect(batches.map((batch) => batch.first_instance)).toEqual([0, 1, 2])
    expect(batches.map((batch) => batch.instance_count)).toEqual([1, 1, 1])
})

test('RendererWebGPU preserves order when panel and image batches alternate', () => {
    const default_page = createTexturePage('default')
    const atlas_page = createTexturePage('atlas')
    const renderer = createRenderer()
    const batches = (renderer as any).buildBatches([
        createRenderItem('panel', default_page),
        createRenderItem('image_panel', atlas_page),
        createRenderItem('panel', default_page),
    ])

    expect(batches.map((batch) => batch.kind)).toEqual(['panel', 'image_panel', 'panel'])
    expect(batches.map((batch) => batch.first_instance)).toEqual([0, 1, 2])
})

test('TextureManager reuses resources by src', () => {
    const device = createFakeDevice()
    const texture_manager = createRealTextureManager(device)
    const first = texture_manager.getImage(createImage('same.png', 32, 32))
    const copy_count = device.copies.length
    const second = texture_manager.getImage(createImage('same.png', 64, 64))

    expect(second).toBe(first)
    expect(device.copies).toHaveLength(copy_count)
})

test('TextureManager packs small images into atlas pages', () => {
    const device = createFakeDevice()
    const texture_manager = createRealTextureManager(device)
    const resource = texture_manager.getImage(createImage('small.png', 32, 16))

    expect(resource.kind).toBe('atlas')
    expect(resource.page.width).toBe(ATLAS_SIZE)
    expect(resource.page.height).toBe(ATLAS_SIZE)
    expect(resource.image_size).toEqual([32, 16])
    expect(resource.uv_rect[0]).toBeGreaterThan(0)
    expect(resource.uv_rect[1]).toBeGreaterThan(0)
    expect(resource.uv_rect[2]).toBeGreaterThan(0)
    expect(resource.uv_rect[3]).toBeGreaterThan(0)
    expect(device.copies[0].destination.origin).toEqual([ATLAS_PADDING, ATLAS_PADDING])
})

test('TextureManager uses dedicated textures for large images', () => {
    const device = createFakeDevice()
    const texture_manager = createRealTextureManager(device)
    const resource = texture_manager.getImage(createImage('large.png', 2048, 128))

    expect(resource.kind).toBe('dedicated')
    expect(resource.page.width).toBe(2048)
    expect(resource.page.height).toBe(128)
    expect(resource.uv_rect).toEqual([0, 0, 1, 1])
    expect(device.copies[0].destination.origin).toBeUndefined()
})

test('TextureManager creates another atlas page when the current one is full', () => {
    const device = createFakeDevice()
    const texture_manager = createRealTextureManager(device)
    const first = texture_manager.getImage(createImage('image-0.png', 512, 512))
    let last = first

    for (let index = 1; index < 10; index++) {
        last = texture_manager.getImage(createImage(`image-${index}.png`, 512, 512))
    }

    expect(first.kind).toBe('atlas')
    expect(last.kind).toBe('atlas')
    expect(last.page).not.toBe(first.page)
})

function createNodesBufferData(renderer, nodes) {
    const render_items = (renderer as any).collectRenderItems(nodes)

    return (renderer as any).createNodesBufferData(render_items)
}

function createRenderer(texture_manager = createTextureManager()) {
    const renderer = new RendererWebGPU({ canvas: {} })
    ;(renderer as any).pipeline = { id: 'pipeline' }
    ;(renderer as any).texture_manager = texture_manager

    return renderer
}

function createTextureManager({ default_page = createTexturePage('default'), resources = {} } = {}) {
    return {
        default_page,
        getImage(image) {
            return resources[image.src]
        },
    }
}

function createRealTextureManager(device) {
    return new TextureManager({
        device,
        bind_group_layout: { id: 'layout' },
        viewport_buffer: { id: 'viewport' },
        sampler: { id: 'sampler' },
    })
}

function createRenderItem(kind, page) {
    return {
        kind,
        page,
        instance_data: {},
    }
}

function createTexturePage(id) {
    return {
        texture: { id },
        bind_group: { id },
        width: 1,
        height: 1,
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

function createFakeDevice() {
    const textures: any[] = []
    const bind_groups: any[] = []
    const copies: any[] = []
    const writes: any[] = []
    const device = {
        textures,
        bind_groups,
        copies,
        writes,
        createTexture(descriptor) {
            const view = { id: `view-${textures.length}` }
            const texture = {
                id: `texture-${textures.length}`,
                descriptor,
                createView() {
                    return view
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
        queue: {
            copyExternalImageToTexture(source, destination, size) {
                copies.push({ source, destination, size })
            },
            writeTexture(destination, data, layout, size) {
                writes.push({ destination, data, layout, size })
            },
        },
    }

    return device
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
}: {
    parent?: any
    opacity?: number
    layout?: { x: number; y: number; width: number; height: number }
    overflow?: number
    styles?: Record<string, any>
} = {}) {
    return {
        parent,
        layout,
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
