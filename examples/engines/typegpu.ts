import * as cameras from '@typegpu/kit/cameras'
import type { Frame } from '@typegpu/kit/frames'
import * as passes from '@typegpu/kit/passes'
import type { Surface } from '@typegpu/kit/targets'
import { d, std, type TgpuRoot } from 'typegpu'
import type { WebGPUCanvas } from '@uno.build/ui/ResourcesWebGPU'
import { registerAssets } from '../shared/assets'
import { createBackgroundUI } from '../shared/uis/background-ui'
import { createForegroundUI } from '../shared/uis/foreground-ui'

const CUBE_VERTEX_COUNT = 36

type SceneOptions = {
    ResourcesWebGPU: typeof import('@uno.build/ui/ResourcesWebGPU').default
    UI: typeof import('@uno.build/ui/UIWebGPU').default
    loadYoga: typeof import('yoga-layout/load').loadYoga
    loadAssets(): ReturnType<typeof import('../shared/assets').loadAssets>
}

export async function createScene(
    root: TgpuRoot,
    surface: Surface & { readonly context: GPUCanvasContext },
    { UI, ResourcesWebGPU, loadAssets, loadYoga }: SceneOptions,
) {
    const assets = await loadAssets()
    const { context, format } = surface
    const resources = await ResourcesWebGPU.create({
        canvas: context.canvas as WebGPUCanvas,
        device: root.device,
        context,
        format,
    })
    registerAssets({ resources, assets })

    const { ui: background_ui } = await UI.create({ loadYoga, resources })
    const { ui: foreground_ui } = await UI.create({ loadYoga, resources })
    const { grid } = createBackgroundUI({ ui: background_ui, assets, background_color: '#f4efc2' })
    createForegroundUI({ ui: foreground_ui, assets, title: 'Hello TypeGPU!' })

    const camera = cameras.orbit(root, {
        size: surface,
        target: [0, 0, 0],
        distance: 4,
        pitch: 0,
        fov: 2 * Math.atan(1 / 1.4),
    })
    const scene = passes.create(root, surface).pipe(camera.inject())

    const time = root.createUniform(d.f32)
    const Vertex = d.struct({ position: d.vec4f, color: d.vec3f })
    const Pixel = d.struct({ color: d.vec4f })

    function cubeVertexAt(vertex_index: number) {
        'use gpu'
        const corners = d.arrayOf(
            d.vec3f,
            8,
        )([
            d.vec3f(-1, -1, -1),
            d.vec3f(1, -1, -1),
            d.vec3f(1, 1, -1),
            d.vec3f(-1, 1, -1),
            d.vec3f(-1, -1, 1),
            d.vec3f(1, -1, 1),
            d.vec3f(1, 1, 1),
            d.vec3f(-1, 1, 1),
        ])
        const indices = d.arrayOf(
            d.u32,
            CUBE_VERTEX_COUNT,
        )([0, 3, 2, 0, 2, 1, 4, 5, 6, 4, 6, 7, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2])
        const corner = corners[indices[vertex_index]]
        const angles = d.vec2f(time.$ * 0.5, time.$)
        const c = std.cos(angles)
        const s = std.sin(angles)
        const rotated_x = d.vec3f(corner.x, c.x * corner.y - s.x * corner.z, s.x * corner.y + c.x * corner.z)
        const rotated_y = d.vec3f(
            c.y * rotated_x.x + s.y * rotated_x.z,
            rotated_x.y,
            -s.y * rotated_x.x + c.y * rotated_x.z,
        )
        return Vertex({ position: cameras.toClip(rotated_y), color: std.add(std.mul(corner, 0.5), d.vec3f(0.5)) })
    }

    const cube = scene.add({
        Vertex,
        at: cubeVertexAt,
        pixelOf: (vertex) => {
            'use gpu'
            return Pixel({ color: d.vec4f(vertex.color, 1) })
        },
        color: passes.shaded,
        primitive: { topology: 'triangle-list', cullMode: 'back' },
        draw: (pass) => pass.draw(CUBE_VERTEX_COUNT),
    })
    await scene.initAsync()

    let grid_x = 0
    return {
        uis: [background_ui, foreground_ui],
        frame(frame: Frame) {
            camera.update(frame.dt)
            time.write(frame.time)
            const command_encoder = root.unwrap(frame.encoder)
            const texture_view = surface.view(frame)
            for (const ui of [background_ui, foreground_ui]) {
                ui.setViewport(surface.width / surface.pixelRatio, surface.height / surface.pixelRatio)
                ui.setDevicePixelRatio(surface.pixelRatio)
            }

            grid_x += 1
            grid.style('backgroundPosition', `${grid_x}px ${grid_x}px`)
            background_ui.update()
            background_ui.draw({ submit: false, command_encoder, texture_view, load_op: 'clear' })

            scene.record(frame, cube, { clear: false })

            foreground_ui.update()
            foreground_ui.draw({ submit: false, command_encoder, texture_view })
        },
        destroy() {
            background_ui.destroy()
            foreground_ui.destroy()
            resources.dispose()
        },
    }
}
