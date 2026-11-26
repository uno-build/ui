import { hexToRgb, srgbToLinear } from '@typegpu/color'
import * as cameras from '@typegpu/kit/cameras'
import * as finish from '@typegpu/kit/finish'
import type { Frame } from '@typegpu/kit/frames'
import * as passes from '@typegpu/kit/passes'
import { falloff } from '@typegpu/kit/shading'
import * as targets from '@typegpu/kit/targets'
import tgpu, { d, std, type TgpuRoot } from 'typegpu'
import type { WebGPUCanvas } from '@uno.build/ui/ResourcesWebGPU'
import type { TypeGPUPlane, UIWebGPUTypeGPUMaterial } from '@uno.build/ui/UIWebGPUTypeGPU'
import { registerAssets } from '../shared/assets'
import { createBackgroundUI } from '../shared/uis/background-ui'
import { createForegroundUI } from '../shared/uis/foreground-ui'

const WORLD_HEIGHT = 2
const FOV = Math.PI / 3
const SCENE_FORMAT = 'rgba8unorm-srgb'

type SceneOptions = {
    ResourcesWebGPU: typeof import('@uno.build/ui/ResourcesWebGPU').default
    UI: typeof import('@uno.build/ui/UIWebGPU').default
    UITypeGPU: typeof import('@uno.build/ui/UIWebGPUTypeGPU').default
    loadYoga: typeof import('yoga-layout/load').loadYoga
    loadAssets(): ReturnType<typeof import('../shared/assets').loadAssets>
    onCanvasEvent<K extends keyof WindowEventMap>(type: K, handleEvent: (event: WindowEventMap[K]) => void): () => void
}

export async function createScene(
    root: TgpuRoot,
    surface: targets.Surface & { readonly context: GPUCanvasContext },
    { onCanvasEvent, ResourcesWebGPU, UI, UITypeGPU, loadYoga, loadAssets }: SceneOptions,
) {
    const assets = await loadAssets()
    const { context, format } = surface
    const canvas = context.canvas as WebGPUCanvas & Pick<HTMLCanvasElement, 'setPointerCapture'>
    const resources = await ResourcesWebGPU.create({ canvas, device: root.device, context, format })
    registerAssets({ resources, assets })

    const layout_width = Math.max(surface.width, surface.height) / surface.pixelRatio
    const layout_height = Math.min(surface.width, surface.height) / surface.pixelRatio
    const world_width = WORLD_HEIGHT * layout_width / layout_height
    const panel_options = {
        root,
        resources,
        loadYoga,
        texture_width: Math.round(layout_width * surface.pixelRatio),
        texture_height: Math.round(layout_height * surface.pixelRatio),
        world_width,
        world_height: WORLD_HEIGHT,
    }
    const { ui: overlay_ui } = await UI.create({ resources, loadYoga })
    createForegroundUI({ ui: overlay_ui, assets, title: 'TypeGPU' })

    const camera = cameras.orbit(root, {
        size: surface,
        target: [0, 0.8, 0],
        pitch: Math.atan2(2.7, 9),
        distance: Math.hypot(9, 2.7),
        fov: FOV,
        near: 0.1,
        far: 100,
    })

    const panel_pointers = new Set<number>()
    const offset = world_width / 2 + 0.25
    async function createPanel(title: string, x: number, angle: number) {
        const { ui, plane, material } = await UITypeGPU.create(panel_options)
        ui.setViewport(layout_width, layout_height)
        ui.setDevicePixelRatio(surface.pixelRatio)
        ui.setCamera(camera)
        ui.root!.on('pointerdown', ({ source_event }) => panel_pointers.add(source_event.pointerId))
        plane.setTransform(std.mul(std.translation4(d.vec3f(x, 1, 0)), std.rotationY4(angle)))
        const { grid } = createBackgroundUI({ ui, assets, title })
        return { ui, plane, drawing: createPanelDrawing(plane, material, offset - 0.5), grid }
    }
    const panels = [await createPanel('First UI', -offset, 0.35), await createPanel('Second UI', offset, -0.35)]

    let orbit_pointer: number | null = null
    let last_x = 0
    let last_y = 0
    function endOrbit(event: PointerEvent) {
        if (event.pointerId === orbit_pointer) orbit_pointer = null
        panel_pointers.delete(event.pointerId)
    }
    const offCanvasEvents = [
        onCanvasEvent('pointerdown', (event) => {
            if (event.button !== 0 && event.button !== 2) return
            canvas.setPointerCapture(event.pointerId)
            orbit_pointer = event.pointerId
            last_x = event.clientX
            last_y = event.clientY
        }),
        onCanvasEvent('pointermove', (event) => {
            if (event.pointerId !== orbit_pointer || panel_pointers.has(event.pointerId)) return
            cameras.turn(camera.goal, event.clientX - last_x, event.clientY - last_y)
            last_x = event.clientX
            last_y = event.clientY
        }),
        onCanvasEvent('pointerup', endOrbit),
        onCanvasEvent('pointercancel', endOrbit),
        onCanvasEvent('contextmenu', (event) => event.preventDefault()),
        onCanvasEvent('wheel', (event) => {
            event.preventDefault()
            const delta = event.deltaMode === 0 ? event.deltaY : Math.sign(event.deltaY) * 40
            camera.goal.distance *= Math.exp(delta * 0.001)
        }),
    ]

    const screen = targets.create(root, surface, {
        color: { format: SCENE_FORMAT, samples: 4 },
        depth: { format: 'depth24plus', samples: 4 },
        resolved: { format: SCENE_FORMAT, sampled: true },
    })
    const scene = passes.create(root, screen, { color: passes.color, depth: passes.depth }, {
        clear: [...srgbToLinear(hexToRgb(0x111827)), 1],
        resolve: { color: 'resolved' },
    }).pipe(camera.inject())
    const floor = scene.add(createFloorGrid(root))
    const drawn_panels = panels.map(({ plane, drawing }) => ({ plane, drawn: scene.add(drawing) }))
    const output = finish.create(root, {
        source: () => screen.textures.resolved,
        format,
        tone: null,
        settings: { vignette: 0, dither: 0 },
    })
    await Promise.all([scene.initAsync(), output.initAsync()])

    let coin_offset = 0
    const eye = [0, 0, 0]
    const distanceToEye = ({ plane }: { plane: TypeGPUPlane }) =>
        Math.hypot(plane.transform[12] - eye[0], plane.transform[13] - eye[1], plane.transform[14] - eye[2])
    return {
        uis: [overlay_ui, ...panels.map(({ ui }) => ui)],
        frame(frame: Frame) {
            screen.fit()
            camera.update(frame.dt)
            const command_encoder = root.unwrap(frame.encoder)
            const texture_view = surface.view(frame)
            coin_offset += 1
            const position = `${coin_offset}px ${coin_offset}px`
            for (const { ui, grid } of panels) {
                grid.style('backgroundPosition', position)
                ui.update()
                ui.draw({ command_encoder, submit: false })
            }
            // The panels blend without writing depth, so the farthest one is drawn first.
            cameras.eyeOf(camera.pose, eye)
            drawn_panels.sort((a, b) => distanceToEye(b) - distanceToEye(a))
            scene.record(frame, [floor, ...drawn_panels.map(({ drawn }) => drawn)])
            output.record(frame, texture_view)
            overlay_ui.setViewport(surface.width / surface.pixelRatio, surface.height / surface.pixelRatio)
            overlay_ui.setDevicePixelRatio(surface.pixelRatio)
            overlay_ui.update()
            overlay_ui.draw({ command_encoder, texture_view, submit: false })
        },
        destroy() {
            for (const offCanvasEvent of offCanvasEvents) offCanvasEvent()
            for (const { ui, plane } of panels) {
                ui.destroy()
                plane.destroy()
            }
            overlay_ui.destroy()
            screen.destroy()
            resources.dispose()
        },
    }
}

const HALF_SIZE = 10
const FLOOR_Y = -0.12
const AXIS_COLOR = d.vec4f(srgbToLinear(hexToRgb(0x475569)), 1)
const GRID_COLOR = d.vec4f(srgbToLinear(hexToRgb(0x263244)), 1)

const gridVertex = tgpu.vertexFn({
    in: { index: d.builtin.vertexIndex, row: d.builtin.instanceIndex },
    out: { position: d.builtin.position, color: d.vec4f },
})((input) => {
    'use gpu'
    const offset = d.f32(input.row) - HALF_SIZE
    const end = std.select(d.f32(-HALF_SIZE), d.f32(HALF_SIZE), (input.index & 1) !== 0)
    const xz = std.select(d.vec2f(offset, end), d.vec2f(end, offset), input.index < 2)
    return {
        position: cameras.toClip(d.vec3f(xz.x, FLOOR_Y, xz.y)),
        color: std.select(GRID_COLOR, AXIS_COLOR, input.row === HALF_SIZE),
    }
})

const gridFragment = tgpu.fragmentFn({ in: { color: d.vec4f }, out: d.vec4f })((input) => {
    'use gpu'
    return input.color
})

function createFloorGrid(root: TgpuRoot): passes.Compound {
    return {
        build(into) {
            const pipeline = root.pipe(into.inject()).createRenderPipeline({
                vertex: gridVertex,
                fragment: gridFragment,
                primitive: { topology: 'line-list' },
                targets: { format: SCENE_FORMAT },
                depthStencil: { format: into.depthFormat!, depthCompare: into.depthCompare, depthWriteEnabled: true },
                multisample: { count: into.samples },
            })
            return {
                initAsync: () => pipeline.initAsync(),
                draw(pass) {
                    pass.setPipeline(pipeline)
                    pass.draw(4, HALF_SIZE * 2 + 1)
                },
            }
        },
    }
}

const INV_PI = 1 / Math.PI
const SHININESS = 64
const GROUND = srgbToLinear(hexToRgb(0x334155))
const POINT_COLOR = srgbToLinear(hexToRgb(0x60a5fa))
const SUN_DIRECTION = std.normalize(d.vec3f(3, 5, 4))

function directLight(base: d.v4f, normal: d.v3f, view: d.v3f, light: d.v3f, radiance: d.v3f) {
    'use gpu'
    const irradiance = std.mul(std.max(std.dot(normal, light), 0), radiance)
    const dot_nh = std.max(std.dot(normal, std.normalize(std.add(light, view))), 0)
    const specular = 0.25 * (0.5 * SHININESS + 1) * std.pow(dot_nh, SHININESS)
    return std.mul(std.mul(irradiance, std.add(base.rgb, d.vec3f(specular * base.a))), INV_PI)
}

function createPanelDrawing(plane: TypeGPUPlane, material: UIWebGPUTypeGPUMaterial, point_x: number): TypeGPUPlane['drawing'] {
    const { Pixel } = plane.drawing
    const point_position = d.vec3f(point_x, 1.5, 2)
    return {
        ...plane.drawing,
        pixelOf: (vertex) => {
            'use gpu'
            const base = material.pixelOf(vertex).color
            const world = vertex.world_position
            const view = std.normalize(std.sub(cameras.current.$.position, world))
            const face = std.normalize(std.cross(std.dpdx(world), std.dpdy(world)))
            const normal = std.select(std.neg(face), face, std.dot(face, view) >= 0)
            const sky = std.mix(GROUND, d.vec3f(1), 0.5 + 0.5 * normal.y)
            const ambient = std.mul(std.mul(base.rgb, sky), 2 * INV_PI)
            const sun = directLight(base, normal, view, SUN_DIRECTION, d.vec3f(3))
            const to_point = std.sub(point_position, world)
            const radiance = std.mul(POINT_COLOR, 30 * falloff(std.length(to_point), 4.2))
            const point = directLight(base, normal, view, std.normalize(to_point), radiance)
            return Pixel({ color: d.vec4f(std.add(std.add(ambient, sun), point), base.a) })
        },
    }
}
