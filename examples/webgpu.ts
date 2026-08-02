import { mat4 } from 'wgpu-matrix'

const CUBE_VERTEX_SIZE = 4 * 10
const CUBE_POSITION_OFFSET = 0
const CUBE_UV_OFFSET = 4 * 8
const CUBE_VERTEX_COUNT = 36
const BACKGROUND_GAP = 16
const BACKGROUND_ITEM_SIZE = 120

const CUBE_VERTEX_ARRAY = new Float32Array([
    1, -1, 1, 1, 1, 0, 1, 1, 0, 1, -1, -1, 1, 1, 0, 0, 1, 1, 1, 1, -1, -1, -1, 1, 0, 0, 0, 1, 1, 0, 1, -1, -1, 1, 1, 0,
    0, 1, 0, 0, 1, -1, 1, 1, 1, 0, 1, 1, 0, 1, -1, -1, -1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, -1, 1,
    1, 1, 0, 1, 1, 1, 1, 1, -1, -1, 1, 1, 0, 0, 1, 1, 0, 1, 1, -1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1,
    -1, -1, 1, 1, 0, 0, 1, 1, 0, -1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -1, 1, 1, 1, 0, 1,
    1, 0, -1, 1, -1, 1, 0, 1, 0, 1, 0, 0, -1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, -1, 1, 1, 1, 0, 1, 1, 0, -1, -1, 1, 1, 0,
    0, 1, 1, 0, 1, -1, 1, 1, 1, 0, 1, 1, 1, 1, 1, -1, 1, -1, 1, 0, 1, 0, 1, 1, 0, -1, -1, -1, 1, 0, 0, 0, 1, 0, 0, -1,
    -1, 1, 1, 0, 0, 1, 1, 0, 1, -1, 1, -1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, -1, 1, 1, 1, 0, 1, 1, 1,
    1, 1, -1, -1, 1, 1, 0, 0, 1, 1, 1, 0, -1, -1, 1, 1, 0, 0, 1, 1, 0, 1, 1, -1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 0, 1, 1, -1, -1, 1, 1, 0, 0, 1, 0, 1, -1, -1, -1, 1, 0, 0, 0, 1, 1, 1, -1, 1, -1, 1, 0, 1, 0, 1, 1, 0, 1,
    1, -1, 1, 1, 1, 0, 1, 0, 0, 1, -1, -1, 1, 1, 0, 0, 1, 0, 1, -1, 1, -1, 1, 0, 1, 0, 1, 1, 0,
])

export async function main({
    canvas,
    onCanvasEvent,
    UI,
    RendererWebGPU,
    WebGPUSharedContext,
    loadImage,
    loadJson,
    loadYoga,
}) {
    const webgpu = new WebGPUSharedContext({ canvas })
    await webgpu.init()
    const renderer = new RendererWebGPU({ webgpu, loadYoga })
    const ui = new UI({ renderer, device_pixel_ratio: window.devicePixelRatio })
    const { device, context, format } = await ui.init()

    syncCanvasSize({ canvas, ui })
    onCanvasEvent('resize', () => {
        syncCanvasSize({ canvas, ui })
        ui.update()
    })

    const { grid } = await createBackgroundRepeatLayout({ ui, webgpu, loadImage, loadJson })
    ui.update()

    const vertex_buffer = device.createBuffer({
        size: CUBE_VERTEX_ARRAY.byteLength,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true,
    })
    new Float32Array(vertex_buffer.getMappedRange()).set(CUBE_VERTEX_ARRAY)
    vertex_buffer.unmap()

    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: device.createShaderModule({ code: BASIC_VERTEX_WGSL }),
            buffers: [
                {
                    arrayStride: CUBE_VERTEX_SIZE,
                    attributes: [
                        {
                            shaderLocation: 0,
                            offset: CUBE_POSITION_OFFSET,
                            format: 'float32x4',
                        },
                        {
                            shaderLocation: 1,
                            offset: CUBE_UV_OFFSET,
                            format: 'float32x2',
                        },
                    ],
                },
            ],
        },
        fragment: {
            module: device.createShaderModule({ code: POSITION_COLOR_FRAGMENT_WGSL }),
            targets: [{ format }],
        },
        primitive: {
            topology: 'triangle-list',
            cullMode: 'back',
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
    })

    let render_width = canvas.width
    let render_height = canvas.height
    let depth_texture = createDepthTexture(device, render_width, render_height)
    let projection_matrix = createProjectionMatrix(render_width, render_height)
    const model_view_projection_matrix = mat4.create()

    const uniform_buffer = device.createBuffer({
        size: 4 * 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })
    const uniform_bind_group = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: { buffer: uniform_buffer },
            },
        ],
    })

    const has_present = typeof context.present === 'function'
    let grid_x = 0

    function frame() {
        const canvas_texture = context.getCurrentTexture()
        const texture_view = canvas_texture.createView()
        const texture_size = getTextureSize(canvas_texture, canvas)

        if (render_width !== texture_size.width || render_height !== texture_size.height) {
            render_width = texture_size.width
            render_height = texture_size.height
            depth_texture.destroy()
            depth_texture = createDepthTexture(device, render_width, render_height)
            projection_matrix = createProjectionMatrix(render_width, render_height)
        }

        const view_matrix = mat4.identity()
        mat4.translate(view_matrix, [0, 0, -4], view_matrix)

        const now = Date.now() / 1000
        mat4.rotate(view_matrix, [Math.sin(now), Math.cos(now), 0], 1, view_matrix)
        mat4.multiply(projection_matrix, view_matrix, model_view_projection_matrix)

        device.queue.writeBuffer(
            uniform_buffer,
            0,
            model_view_projection_matrix.buffer,
            model_view_projection_matrix.byteOffset,
            model_view_projection_matrix.byteLength,
        )

        const command_encoder = device.createCommandEncoder()
        const cube_pass_encoder = command_encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: texture_view,
                    clearValue: [1.0, 1.5, 1.5, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: depth_texture.createView(),
                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        })

        cube_pass_encoder.setPipeline(pipeline)
        cube_pass_encoder.setBindGroup(0, uniform_bind_group)
        cube_pass_encoder.setVertexBuffer(0, vertex_buffer)
        cube_pass_encoder.draw(CUBE_VERTEX_COUNT)
        cube_pass_encoder.end()

        grid_x += 1
        grid.style('backgroundPosition', `${grid_x}px ${grid_x}px`)
        ui.update()
        ui.draw({ command_encoder, texture_view })

        if (has_present) {
            context.present()
        }

        requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
}

function syncCanvasSize({ canvas, ui }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    canvas.width = Math.max(1, Math.round(width * device_pixel_ratio))
    canvas.height = Math.max(1, Math.round(height * device_pixel_ratio))
    ui.setViewport(width, height)
    ui.setDevicePixelRatio(device_pixel_ratio)
}

function createDepthTexture(device, width, height) {
    return device.createTexture({
        size: [width, height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    })
}

function createProjectionMatrix(width, height) {
    return mat4.perspective((2 * Math.PI) / 5, width / height, 1, 100)
}

function getTextureSize(texture, canvas) {
    return {
        width: Math.max(1, texture.width ?? canvas.width),
        height: Math.max(1, texture.height ?? canvas.height),
    }
}

async function createBackgroundRepeatLayout({ ui, webgpu, loadImage, loadJson }) {
    const coin = await loadImage('assets/images/coin.png')
    const repeat_x = await loadImage('assets/images/repeat-x.png')
    const repeat_y = await loadImage('assets/images/repeat-y.png')
    const font_image = await loadImage('assets/fonts/Nougat-ExtraBlack.mtsdf.png')
    const font_json = await loadJson('assets/fonts/Nougat-ExtraBlack.mtsdf.json')

    webgpu.registerImage(coin.src, coin)
    webgpu.registerImage(repeat_x.src, repeat_x)
    webgpu.registerImage(repeat_y.src, repeat_y)
    webgpu.registerFont('Nougat-ExtraBlack', font_image, font_json)

    const grid = ui.create()
    grid.style('width', '100%')
    grid.style('height', '100%')
    grid.style('flexDirection', 'row')
    grid.style('flexWrap', 'wrap')
    grid.style('alignContent', 'flex-start')
    grid.style('gap', `${BACKGROUND_GAP}px`)
    grid.style('padding', `${BACKGROUND_GAP}px`)
    grid.style('backgroundImage', coin.src)
    grid.style('backgroundRepeat', 'repeat')
    grid.style('backgroundSize', '30px')
    ui.root.add(grid)

    const first = ui.create()
    first.style('width', `${BACKGROUND_ITEM_SIZE}px`)
    first.style('height', `${BACKGROUND_ITEM_SIZE}px`)
    first.style('borderRadius', '12px')
    first.style('backgroundImage', repeat_x.src)
    first.style('backgroundSize', '1px 100%')
    first.style('backgroundRepeat', 'repeat-x')
    first.style('border', '4px solid #000')
    grid.add(first)

    const second = ui.create()
    second.style('width', `${BACKGROUND_ITEM_SIZE}px`)
    second.style('height', `${BACKGROUND_ITEM_SIZE}px`)
    second.style('borderRadius', '12px')
    second.style('backgroundImage', repeat_y.src)
    second.style('backgroundSize', '100% 1px')
    second.style('backgroundRepeat', 'repeat-y')
    second.style('border', '4px solid #000')
    grid.add(second)

    const combined = ui.create()
    combined.style('width', `${BACKGROUND_ITEM_SIZE}px`)
    combined.style('height', `${BACKGROUND_ITEM_SIZE}px`)
    combined.style('borderRadius', '12px')
    combined.style('backgroundImage', repeat_x.src)
    combined.style('backgroundSize', '1px 100%')
    combined.style('backgroundRepeat', 'repeat-x')
    combined.style('border', '4px solid #000')
    grid.add(combined)

    const inside = ui.create()
    inside.style('width', '100%')
    inside.style('height', '100%')
    inside.style('borderRadius', '8px')
    inside.style('backgroundImage', repeat_y.src)
    inside.style('backgroundSize', '100% 1px')
    inside.style('backgroundRepeat', 'repeat-y')
    combined.add(inside)

    const title = ui.create()
    title.style('fontFamily', 'Nougat-ExtraBlack')
    title.style('fontSize', '70px')
    title.style('color', '#ffffff')
    title.style('textStroke', '6px #000000')
    title.style('textShadow', '0px 4px 0px #000000')
    title.text('Hello WebGPU!')
    grid.add(title)

    return { grid }
}

const BASIC_VERTEX_WGSL = /* wgsl */ `
    struct Uniforms {
        modelViewProjectionMatrix: mat4x4f,
    }

    @binding(0) @group(0) var<uniform> uniforms: Uniforms;

    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) fragUV: vec2f,
        @location(1) fragPosition: vec4f,
    }

    @vertex
    fn main(
        @location(0) position: vec4f,
        @location(1) uv: vec2f
    ) -> VertexOutput {
        var output: VertexOutput;
        output.position = uniforms.modelViewProjectionMatrix * position;
        output.fragUV = uv;
        output.fragPosition = 0.5 * (position + vec4f(1.0, 1.0, 1.0, 1.0));
        return output;
    }
`

const POSITION_COLOR_FRAGMENT_WGSL = /* wgsl */ `
    @fragment
    fn main(
        @location(0) fragUV: vec2f,
        @location(1) fragPosition: vec4f
    ) -> @location(0) vec4f {
        return fragPosition;
    }
`
