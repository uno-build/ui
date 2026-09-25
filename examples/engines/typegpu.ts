import tgpu from 'typegpu'
import * as d from 'typegpu/data'
import * as std from 'typegpu/std'
import { mat4 } from 'wgpu-matrix'
import { loadAssets, registerAssets } from '../shared/assets'
import { createBackgroundUI } from '../shared/uis/background-ui'
import { createForegroundUI } from '../shared/uis/foreground-ui'

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

const CUBE_VERTEX = d.unstruct({
    position: d.float32x4,
    color: d.float32x4,
    uv: d.float32x2,
})

const CUBE_VERTEX_LAYOUT = tgpu.vertexLayout((count) => d.disarrayOf(CUBE_VERTEX, count))

export async function main({ canvas, onCanvasEvent, UI, ResourcesWebGPU, loadImage, loadJson }) {
    const resources = await ResourcesWebGPU.create({ canvas })
    const device_pixel_ratio = window.devicePixelRatio
    const { ui: background_ui } = await UI.create({ resources, device_pixel_ratio })
    const { ui: foreground_ui } = await UI.create({ resources, device_pixel_ratio })
    const { device, context, format } = resources
    const root = tgpu.initFromDevice({ device })

    syncCanvasSize({ canvas, background_ui, foreground_ui })

    // Event handling
    onCanvasEvent('resize', () => {
        syncCanvasSize({ canvas, background_ui, foreground_ui })
        background_ui.update()
        foreground_ui.update()
    })

    const assets = await loadAssets({ loadImage, loadJson })
    registerAssets({ resources, assets })
    const { grid } = createBackgroundUI({ ui: background_ui, assets, background_color: '#f4efc2' })
    createForegroundUI({ ui: foreground_ui, assets, title: 'Hello TypeGPU!' })
    background_ui.update()
    foreground_ui.update()

    const vertex_buffer = root
        .createBuffer(CUBE_VERTEX_LAYOUT.schemaForCount(CUBE_VERTEX_COUNT), (buffer) =>
            buffer.write(CUBE_VERTEX_ARRAY.buffer),
        )
        .$usage('vertex')

    const model_view_projection_uniform = root.createUniform(d.mat4x4f)

    const cube_vertex_fn = tgpu.vertexFn({
        in: { position: d.vec4f, uv: d.vec2f },
        out: { position: d.builtin.position, uv: d.vec2f, frag_position: d.vec4f },
    })((input) => {
        'use gpu'
        return {
            position: std.mul(model_view_projection_uniform.$, input.position),
            uv: input.uv,
            frag_position: std.mul(0.5, std.add(input.position, d.vec4f(1))),
        }
    })

    const cube_fragment_fn = tgpu.fragmentFn({
        in: { frag_position: d.vec4f },
        out: d.vec4f,
    })((input) => {
        'use gpu'
        return input.frag_position
    })

    const pipeline = root
        .createRenderPipeline({
            attribs: CUBE_VERTEX_LAYOUT.attrib,
            vertex: cube_vertex_fn,
            fragment: cube_fragment_fn,
            targets: { format },
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
        .with(CUBE_VERTEX_LAYOUT, vertex_buffer)

    let render_width = canvas.width
    let render_height = canvas.height
    let depth_texture = createDepthTexture(root, render_width, render_height)
    let projection_matrix = createProjectionMatrix(render_width, render_height)
    const model_view_projection_matrix = mat4.create()

    let grid_x = 0

    function frame() {
        const canvas_texture = context.getCurrentTexture()
        const texture_view = canvas_texture.createView()
        const texture_size = getTextureSize(canvas_texture, canvas)

        if (render_width !== texture_size.width || render_height !== texture_size.height) {
            render_width = texture_size.width
            render_height = texture_size.height
            depth_texture.destroy()
            depth_texture = createDepthTexture(root, render_width, render_height)
            projection_matrix = createProjectionMatrix(render_width, render_height)
        }

        const view_matrix = mat4.identity()
        mat4.translate(view_matrix, [0, 0, -4], view_matrix)

        const now = Date.now() / 1000
        mat4.rotate(view_matrix, [Math.sin(now), Math.cos(now), 0], 1, view_matrix)
        mat4.multiply(projection_matrix, view_matrix, model_view_projection_matrix)

        model_view_projection_uniform.write(model_view_projection_matrix)

        const command_encoder = device.createCommandEncoder()

        grid_x += 1
        grid.style('backgroundPosition', `${grid_x}px ${grid_x}px`)
        background_ui.update()
        background_ui.draw({ submit: false, command_encoder, texture_view, load_op: 'clear' })

        pipeline
            .with(command_encoder)
            .withColorAttachment({ view: texture_view, loadOp: 'load' })
            .withDepthStencilAttachment({ view: depth_texture })
            .draw(CUBE_VERTEX_COUNT)

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

function createDepthTexture(root, width, height) {
    return root.createTexture({ size: [width, height], format: 'depth24plus' }).$usage('render')
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
