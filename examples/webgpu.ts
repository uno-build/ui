import { mat4 } from 'wgpu-matrix'
import { loadAssets, registerAssets } from './uis/assets'
import { createBackgroundUI } from './uis/background-ui'
import { createForegroundUI } from './uis/foreground-ui'

const CUBE_VERTEX_SIZE = 4 * 10
const CUBE_POSITION_OFFSET = 0
const CUBE_UV_OFFSET = 4 * 8
const CUBE_VERTEX_COUNT = 36

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

export async function main({ canvas, onCanvasEvent, UIWebGPU, ResourcesWebGPU, loadImage, loadJson, loadYoga }) {
    const resources = await ResourcesWebGPU.create({ canvas })
    const device_pixel_ratio = window.devicePixelRatio
    const { ui: background_ui } = await UIWebGPU.create({ resources, loadYoga, device_pixel_ratio })
    const { ui: foreground_ui } = await UIWebGPU.create({ resources, loadYoga, device_pixel_ratio })
    const { device, context, format } = resources

    syncCanvasSize({ canvas, background_ui, foreground_ui })

    // Event handling
    ;['pointerdown', 'pointerup', 'pointermove', 'pointercancel'].forEach((type) => {
        canvas.addEventListener(type, (e) => {
            background_ui.dispatchEvent(e)
            foreground_ui.dispatchEvent(e)
        })
    })
    onCanvasEvent('resize', () => {
        syncCanvasSize({ canvas, background_ui, foreground_ui })
        background_ui.update()
        foreground_ui.update()
    })

    const assets = await loadAssets({ loadImage, loadJson })
    registerAssets({ resources, assets })
    const { grid } = createBackgroundUI({ ui: background_ui, assets, background_color: '#e2cff4' })
    createForegroundUI({ ui: foreground_ui, assets, title: 'Hello WebGPU!' })
    background_ui.update()
    foreground_ui.update()

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

        grid_x += 1
        grid.style('backgroundPosition', `${grid_x}px ${grid_x}px`)
        background_ui.update()
        background_ui.draw({ submit: false, command_encoder, texture_view, load_op: 'clear' })

        const cube_pass_encoder = command_encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: texture_view,
                    loadOp: 'load',
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

        foreground_ui.update()
        foreground_ui.draw({ command_encoder, texture_view })

        resources.present()

        requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
}

function syncCanvasSize({ canvas, background_ui, foreground_ui }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    canvas.width = Math.max(1, Math.round(width * device_pixel_ratio))
    canvas.height = Math.max(1, Math.round(height * device_pixel_ratio))

    for (const ui of [background_ui, foreground_ui]) {
        ui.setViewport(width, height)
        ui.setDevicePixelRatio(device_pixel_ratio)
    }
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
