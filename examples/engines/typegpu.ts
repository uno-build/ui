import tgpu from 'typegpu'
import * as d from 'typegpu/data'
import * as std from 'typegpu/std'
import { registerAssets } from '../shared/assets'
import { createBackgroundUI } from '../shared/uis/background-ui'
import { createForegroundUI } from '../shared/uis/foreground-ui'

const CUBE_VERTEX_COUNT = 36

export async function main({ canvas, onCanvasEvent, UI, ResourcesWebGPU, loadAssets, loadYoga }) {
    const resources = await ResourcesWebGPU.create({ canvas })
    const device_pixel_ratio = window.devicePixelRatio
    const { ui: background_ui } = await UI.create({ loadYoga, resources, device_pixel_ratio })
    const { ui: foreground_ui } = await UI.create({ loadYoga, resources, device_pixel_ratio })
    const { device, context, format } = resources
    const root = tgpu.initFromDevice({ device })

    syncCanvasSize({ canvas, background_ui, foreground_ui })

    // Event handling
    onCanvasEvent('resize', () => {
        syncCanvasSize({ canvas, background_ui, foreground_ui })
        background_ui.update()
        foreground_ui.update()
    })

    const assets = await loadAssets()
    registerAssets({ resources, assets })
    const { grid } = createBackgroundUI({ ui: background_ui, assets, background_color: '#f4efc2' })
    createForegroundUI({ ui: foreground_ui, assets, title: 'Hello TypeGPU!' })
    background_ui.update()
    foreground_ui.update()

    const frame_uniform = root.createUniform(d.vec2f)

    const cubeVertex = tgpu.vertexFn({
        in: { vertex_index: d.builtin.vertexIndex },
        out: { position: d.builtin.position, color: d.vec3f },
    })((input) => {
        'use gpu'
        const corners = d.arrayOf(d.vec3f, 8)([
            d.vec3f(-1, -1, -1), d.vec3f(1, -1, -1), d.vec3f(1, 1, -1), d.vec3f(-1, 1, -1),
            d.vec3f(-1, -1, 1), d.vec3f(1, -1, 1), d.vec3f(1, 1, 1), d.vec3f(-1, 1, 1),
        ])
        const indices = d.arrayOf(d.u32, CUBE_VERTEX_COUNT)([
            0, 3, 2, 0, 2, 1,
            4, 5, 6, 4, 6, 7,
            0, 4, 7, 0, 7, 3,
            1, 2, 6, 1, 6, 5,
            0, 1, 5, 0, 5, 4,
            3, 7, 6, 3, 6, 2,
        ])
        const corner = corners[indices[input.vertex_index]]
        const angles = d.vec2f(frame_uniform.$.x * 0.5, frame_uniform.$.x)
        const c = std.cos(angles)
        const s = std.sin(angles)
        const rotated_x = d.vec3f(corner.x, c.x * corner.y - s.x * corner.z, s.x * corner.y + c.x * corner.z)
        const rotated_y = d.vec3f(
            c.y * rotated_x.x + s.y * rotated_x.z,
            rotated_x.y,
            -s.y * rotated_x.x + c.y * rotated_x.z,
        )
        const depth = 4 - rotated_y.z

        return {
            position: d.vec4f(rotated_y.x * 1.4 / frame_uniform.$.y, rotated_y.y * 1.4, depth - 1, depth),
            color: std.add(std.mul(corner, 0.5), d.vec3f(0.5)),
        }
    })

    const cubeFragment = tgpu.fragmentFn({
        in: { color: d.vec3f },
        out: d.vec4f,
    })((input) => {
        'use gpu'
        return d.vec4f(input.color, 1)
    })

    const pipeline = root.createRenderPipeline({
        vertex: cubeVertex,
        fragment: cubeFragment,
        targets: { format },
        primitive: {
            topology: 'triangle-list',
            cullMode: 'back',
        },
    })

    let grid_x = 0

    function frame(time) {
        const canvas_texture = context.getCurrentTexture()
        const texture_view = canvas_texture.createView()
        frame_uniform.write(d.vec2f(time / 1000, canvas.width / canvas.height))

        const command_encoder = device.createCommandEncoder()

        grid_x += 1
        grid.style('backgroundPosition', `${grid_x}px ${grid_x}px`)
        background_ui.update()
        background_ui.draw({ submit: false, command_encoder, texture_view, load_op: 'clear' })

        pipeline
            .with(command_encoder)
            .withColorAttachment({ view: texture_view, loadOp: 'load' })
            .draw(CUBE_VERTEX_COUNT)

        foreground_ui.update()
        foreground_ui.draw({ command_encoder, texture_view })

        resources.present()

        requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)

    return { uis: [background_ui, foreground_ui] }
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
