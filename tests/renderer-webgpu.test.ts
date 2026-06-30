import { expect, test } from '@playwright/test'
import RendererWebGPU from '../src/renderer/RendererWebGPU.ts'
import { OVERFLOW, UNIT } from '../src/style/consts.ts'
import { ATTRIBUTES_SIZE, ATTRIBUTES, FLOAT32_SIZE } from '../src/renderer/webgpu/buffers.ts'
import { ATLAS_PADDING, ATLAS_SIZE, ImageManager } from '../src/renderer/webgpu/ImageManager.ts'

;(globalThis as any).GPUTextureUsage = {
    TEXTURE_BINDING: 1,
    COPY_SRC: 2,
    COPY_DST: 4,
    RENDER_ATTACHMENT: 8,
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
                parsed: image,
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const mode_data_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_MODE_DATA.OFFSET / FLOAT32_SIZE
    const uv_rect_float_offset = ATTRIBUTES.BACKGROUND_UV_RECT.OFFSET / FLOAT32_SIZE
    const image_size_float_offset = ATTRIBUTES.BACKGROUND_IMAGE_SIZE.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(mode_data_float_offset, mode_data_float_offset + 2))).toEqual([1, 3])
    expect(Array.from(floats.slice(uv_rect_float_offset, uv_rect_float_offset + 4))).toEqual([
        expect.closeTo(0.1),
        expect.closeTo(0.2),
        expect.closeTo(0.3),
        expect.closeTo(0.4),
    ])
    expect(Array.from(floats.slice(image_size_float_offset, image_size_float_offset + 2))).toEqual([40, 20])
})

test('RendererWebGPU batches consecutive solid panels together', () => {
    const bind_group = createBindGroup('atlas')
    const renderer = createRenderer(createImageManager({ bind_group }))
    const batches = (renderer as any).buildBatches([
        createRenderItem(bind_group),
        createRenderItem(bind_group),
    ])

    expect(batches).toEqual([
        {
            pipeline: (renderer as any).pipeline,
            bind_group,
            first_instance: 0,
            instance_count: 2,
        },
    ])
})

test('RendererWebGPU batches consecutive atlas images together', () => {
    const bind_group = createBindGroup('atlas')
    const renderer = createRenderer()
    const batches = (renderer as any).buildBatches([
        createRenderItem(bind_group),
        createRenderItem(bind_group),
    ])

    expect(batches).toHaveLength(1)
    expect(batches[0].first_instance).toBe(0)
    expect(batches[0].instance_count).toBe(2)
    expect(batches[0].bind_group).toBe(bind_group)
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
                    parsed: first_image,
                },
            },
        }),
        createNode({
            styles: {
                backgroundImage: {
                    parsed: second_image,
                },
            },
        }),
    ])
    const batches = (renderer as any).buildBatches(render_items)

    expect(batches).toHaveLength(1)
    expect(batches[0].first_instance).toBe(0)
    expect(batches[0].instance_count).toBe(3)
    expect(batches[0].bind_group).toBe(bind_group)
})

test('RendererWebGPU batches atlas panels and images together', () => {
    const bind_group = createBindGroup('atlas')
    const renderer = createRenderer()
    const batches = (renderer as any).buildBatches([
        createRenderItem(bind_group),
        createRenderItem(bind_group),
        createRenderItem(bind_group),
    ])

    expect(batches).toHaveLength(1)
    expect(batches[0].first_instance).toBe(0)
    expect(batches[0].instance_count).toBe(3)
    expect(batches[0].bind_group).toBe(bind_group)
})

test('ImageManager reuses resources by bitmap', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const first_image = createImage('first.png', 32, 32)
    const first = image_manager.getImage(first_image)
    const copy_count = device.copies.length
    const second = image_manager.getImage({ ...createImage('second.png', 32, 32), bitmap: first_image.bitmap })

    expect(second).toBe(first)
    expect(device.copies).toHaveLength(copy_count)
})

test('ImageManager packs small images into atlas layers', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const resource = image_manager.getImage(createImage('small.png', 32, 16))

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
    const resource = image_manager.getImage(createImage('large.png', ATLAS_SIZE, 128))

    expect(resource.layer).toBe(0)
    expect(resource.uv_rect).toEqual([0, 0, 1, 128 / ATLAS_SIZE])
    expect(device.copies[0].destination.origin).toEqual([0, 0, 0])
    expect(getAtlasTextures(device)).toHaveLength(1)
})

test('ImageManager packs images into the lowest skyline gap', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    image_manager.getImage(createImage('tall.png', 800, 300))
    image_manager.getImage(createImage('short.png', 1200, 100))
    const resource = image_manager.getImage(createImage('gap.png', 700, 150))

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

    expect(() => image_manager.getImage(createImage('too-large.png', ATLAS_SIZE + 1, 1))).toThrow(
        /exceeds the 2048x2048 UI atlas layer size/,
    )
})

test('ImageManager grows the atlas texture when the current layer is full', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const first = image_manager.getImage(createImage('image-0.png', ATLAS_SIZE, ATLAS_SIZE))
    const second = image_manager.getImage(createImage('image-1.png', 1, 1))

    expect(first.layer).toBe(0)
    expect(second.layer).toBe(1)
    expect(getAtlasTextures(device)).toHaveLength(2)
    expect(device.bind_groups).toHaveLength(2)
})

test('ImageManager grows the atlas texture when physical layer capacity is full', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    image_manager.getImage(createImage('image-0.png', ATLAS_SIZE, ATLAS_SIZE))
    image_manager.getImage(createImage('image-1.png', ATLAS_SIZE, ATLAS_SIZE))
    const third = image_manager.getImage(createImage('image-2.png', 1, 1))

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

    image_manager.getImage(createImage('image-0.png', ATLAS_SIZE, ATLAS_SIZE))
    image_manager.getImage(createImage('image-1.png', ATLAS_SIZE, ATLAS_SIZE))
    expect(() => image_manager.getImage(createImage('image-2.png', 1, 1))).toThrow(
        /this device supports 2/,
    )
})

function createNodesBufferData(renderer, nodes) {
    const render_items = (renderer as any).collectRenderItems(nodes)

    return (renderer as any).createNodesBufferData(render_items)
}

function createRenderer(image_manager = createImageManager()) {
    const renderer = new RendererWebGPU({ canvas: {} })
    ;(renderer as any).pipeline = { id: 'pipeline' }
    ;(renderer as any).image_manager = image_manager

    return renderer
}

function createImageManager({ bind_group = createBindGroup('atlas'), resources = {} } = {}) {
    return {
        bind_group,
        getImage(image) {
            return resources[image.src]
        },
    }
}

function createRealImageManager(device) {
    return new ImageManager({
        device,
        bind_group_layout: { id: 'layout' },
        viewport_buffer: { id: 'viewport' },
        sampler: { id: 'sampler' },
    })
}

function createRenderItem(bind_group) {
    return {
        bind_group,
        instance_data: {},
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
