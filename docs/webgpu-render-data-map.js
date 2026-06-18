// Mental map of what RendererWebGPU sends to the GPU.
// This is intentionally "fake JS": close to the real WebGPU flow, but made for reading.

const QUAD_VERTEX_COUNT = 6
const QUAD_VERTEX_FLOATS = 2
const QUAD_VERTEX_SIZE = QUAD_VERTEX_FLOATS * 4
const INSTANCE_FLOATS = 40
const INSTANCE_SIZE = INSTANCE_FLOATS * 4
const VIEWPORT_SIZE = 4 * 4
const QUAD_VERTICES = new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1,
])

// GPU setup
const adapter = await navigator.gpu.requestAdapter({
    featureLevel: 'compatibility',
})
const device = await adapter.requestDevice()
const context = canvas.getContext('webgpu')
const format = navigator.gpu.getPreferredCanvasFormat()

context.configure({
    device,
    format,
    alphaMode: 'premultiplied',
})

// Shared GPU buffers
const quad_buffer = device.createBuffer({
    size: QUAD_VERTICES.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
})
device.queue.writeBuffer(quad_buffer, 0, QUAD_VERTICES)
const viewport_buffer = device.createBuffer({
    size: VIEWPORT_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})

let instance_buffer = null
let instance_buffer_size = 0

function writeInstanceData(instances) {
    if (instance_buffer == null || instance_buffer_size < instances.byteLength) {
        instance_buffer?.destroy()
        instance_buffer = device.createBuffer({
            size: instances.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        })
        instance_buffer_size = instances.byteLength
    }

    device.queue.writeBuffer(instance_buffer, 0, instances)
}

// Shared sampler
const image_sampler = device.createSampler({
    minFilter: 'linear',
    magFilter: 'linear',
})

// Shared pipelines
function createPipeline(fragment_code) {
    return device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: device.createShaderModule({
                code: rectangleVertWGSL,
            }),
            entryPoint: 'main',
            buffers: [
                {
                    arrayStride: QUAD_VERTEX_SIZE,
                    attributes: [
                        {
                            shaderLocation: 0,
                            offset: 0,
                            format: 'float32x2',
                        },
                    ],
                },
                {
                    arrayStride: INSTANCE_SIZE,
                    stepMode: 'instance',
                    attributes: [
                        {
                            shaderLocation: 1,
                            offset: 0,
                            format: 'float32x4',
                        },
                        {
                            shaderLocation: 2,
                            offset: 16,
                            format: 'float32x4',
                        },
                        {
                            shaderLocation: 3,
                            offset: 32,
                            format: 'float32x4',
                        },
                        {
                            shaderLocation: 4,
                            offset: 48,
                            format: 'float32x4',
                        },
                        {
                            shaderLocation: 5,
                            offset: 64,
                            format: 'float32x4',
                        },
                        {
                            shaderLocation: 6,
                            offset: 80,
                            format: 'float32x4',
                        },
                        {
                            shaderLocation: 7,
                            offset: 96,
                            format: 'float32x4',
                        },
                        {
                            shaderLocation: 8,
                            offset: 112,
                            format: 'float32x2',
                        },
                        {
                            shaderLocation: 9,
                            offset: 120,
                            format: 'float32x2',
                        },
                        {
                            shaderLocation: 10,
                            offset: 128,
                            format: 'float32x2',
                        },
                        {
                            shaderLocation: 11,
                            offset: 136,
                            format: 'float32x2',
                        },
                        {
                            shaderLocation: 12,
                            offset: 144,
                            format: 'float32x4',
                        },
                    ],
                },
            ],
        },
        fragment: {
            module: device.createShaderModule({
                code: fragment_code,
            }),
            entryPoint: 'main',
            targets: [
                {
                    format,
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add',
                        },
                        alpha: {
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add',
                        },
                    },
                },
            ],
        },
        primitive: {
            topology: 'triangle-list',
        },
    })
}

const rectangle_pipeline = createPipeline(rectangleFragWGSL)
const image_pipeline = createPipeline(imageFragWGSL)

// Shared rectangle bind group
const rectangle_bind_group = device.createBindGroup({
    layout: rectangle_pipeline.getBindGroupLayout(0),
    entries: [
        {
            binding: 0,
            resource: {
                buffer: viewport_buffer,
            },
        },
    ],
})

// Example CPU node state
const node_state = {
    node_id: 'card_cover',

    layout: {
        x: 24,
        y: 32,
        width: 320,
        height: 180,
    },

    background_color: [0.08, 0.1, 0.12, 1],

    border_top_color: [1, 1, 1, 0.18],
    border_right_color: [1, 1, 1, 0.18],
    border_bottom_color: [0, 0, 0, 0.24],
    border_left_color: [1, 1, 1, 0.18],

    border_top_width: 2,
    border_right_width: 2,
    border_bottom_width: 3,
    border_left_width: 2,

    border_top_style: 'solid',
    border_right_style: 'solid',
    border_bottom_style: 'solid',
    border_left_style: 'solid',

    border_top_left_radius: {
        value: 12,
        unit: UNIT.PIXEL,
    },
    border_top_right_radius: {
        value: 12,
        unit: UNIT.PIXEL,
    },
    border_bottom_left_radius: {
        value: 12,
        unit: UNIT.PIXEL,
    },
    border_bottom_right_radius: {
        value: 12,
        unit: UNIT.PIXEL,
    },

    background_image_src: '/assets/card-cover.png',
    background_image_texture: null,
    background_image_bind_group: null,
}

// Current image resource creation model: one node can own one GPUTexture.
const image = {
    src: '/assets/card-cover.png',
    width: 1024,
    height: 576,
    bitmap: image_bitmap,
}
const background_image_texture = device.createTexture({
    size: [
        image.width,
        image.height,
    ],
    format: 'rgba8unorm',
    usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
})
device.queue.copyExternalImageToTexture(
    { source: image.bitmap },
    { texture: background_image_texture },
    [
        image.width,
        image.height,
    ],
)
const background_image_bind_group = device.createBindGroup({
    layout: image_pipeline.getBindGroupLayout(0),
    entries: [
        {
            binding: 0,
            resource: {
                buffer: viewport_buffer,
            },
        },
        {
            binding: 1,
            resource: image_sampler,
        },
        {
            binding: 2,
            resource: background_image_texture.createView(),
        },
    ],
})
node_state.background_image_texture = background_image_texture
node_state.background_image_bind_group = background_image_bind_group


// CPU data created per render
const instance_0 = [
    // rect: shaderLocation 1
    24,
    32,
    320,
    180,

    // background_color: shaderLocation 2
    0.08,
    0.1,
    0.12,
    1,

    // border_top_color: shaderLocation 3
    1,
    1,
    1,
    0.18,

    // border_right_color: shaderLocation 4
    1,
    1,
    1,
    0.18,

    // border_bottom_color: shaderLocation 5
    0,
    0,
    0,
    0.24,

    // border_left_color: shaderLocation 6
    1,
    1,
    1,
    0.18,

    // border_widths: shaderLocation 7
    2,
    2,
    3,
    2,

    // border_top_left_radius: shaderLocation 8
    12,
    12,

    // border_top_right_radius: shaderLocation 9
    12,
    12,

    // border_bottom_left_radius: shaderLocation 10
    12,
    12,

    // border_bottom_right_radius: shaderLocation 11
    12,
    12,

    // clip_insets: shaderLocation 12
    0,
    0,
    0,
    0,
]

const instances = new Float32Array([
    ...instance_0,
])

const draw_calls = [
    {
        type: 'image',
        pipeline: image_pipeline,
        bind_group: background_image_bind_group,
        first_instance: 0,
        instance_count: 1,
    },
]


// GPU writes per render
device.queue.writeBuffer(
    viewport_buffer,
    0,
    new Float32Array([
        canvas.clientWidth,
        canvas.clientHeight,
        0,
        0,
    ]),
)
writeInstanceData(instances)


// GPU commands per render
const command_encoder = device.createCommandEncoder()
const texture_view = context.getCurrentTexture().createView()
const pass_encoder = command_encoder.beginRenderPass({
    colorAttachments: [
        {
            view: texture_view,
            clearValue: [0, 0, 0, 0],
            loadOp: 'clear',
            storeOp: 'store',
        },
    ],
})
pass_encoder.setVertexBuffer(0, quad_buffer)
for (const draw_call of draw_calls) {
    if (draw_call.type === 'image') {
        pass_encoder.setPipeline(image_pipeline)
        pass_encoder.setBindGroup(0, draw_call.bind_group)
    } else {
        pass_encoder.setPipeline(rectangle_pipeline)
        pass_encoder.setBindGroup(0, rectangle_bind_group)
    }

    pass_encoder.setVertexBuffer(
        1,
        instance_buffer,
        draw_call.first_instance * INSTANCE_SIZE,
    )
    pass_encoder.draw(QUAD_VERTEX_COUNT, draw_call.instance_count)
}
pass_encoder.end()
device.queue.submit([command_encoder.finish()])


// What is shared in the current design
const current_shared_resources = {
    quad_buffer,
    viewport_buffer,
    instance_buffer,
    image_sampler,
    rectangle_pipeline,
    image_pipeline,
    rectangle_bind_group,
}

// What is not shared enough yet
const current_per_node_image_resources = {
    background_image_texture,
    background_image_bind_group,
}

// Better next shape: cache image GPU resources by src.
const texture_cache_by_src = {
    [image.src]: {
        texture: background_image_texture,
        texture_view: background_image_texture.createView(),
        bind_group: background_image_bind_group,
        ref_count: 1,
    },
}

const node_state_after_cache = {
    ...node_state,
    background_image_src: image.src,
    background_image_resource: texture_cache_by_src[image.src],
}

// Bigger next shape: texture atlas.
// Many images share one GPUTexture, and each instance gets a uv rect.
const atlas_design_extra_instance_data = {
    atlas_texture,
    atlas_bind_group,
    per_instance_uv_rect: [
        uv_x,
        uv_y,
        uv_width,
        uv_height,
    ],
}
