import { hexToRgb, srgbToLinear } from '@typegpu/color'
import * as cameras from '@typegpu/kit/cameras'
import * as finish from '@typegpu/kit/finish'
import * as frames from '@typegpu/kit/frames'
import { owner } from '@typegpu/kit/owner'
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

type DemoOptions = {
    canvas: WebGPUCanvas & Pick<HTMLCanvasElement, 'width' | 'height' | 'clientWidth' | 'clientHeight' | 'setPointerCapture'>
    ResourcesWebGPU: typeof import('@uno.build/ui/ResourcesWebGPU').default
    UI: typeof import('@uno.build/ui/UIWebGPU').default
    UITypeGPU: typeof import('@uno.build/ui/UIWebGPUTypeGPU').default
    loadYoga: typeof import('yoga-layout/load').loadYoga
    loadAssets(): ReturnType<typeof import('../shared/assets').loadAssets>
    onCanvasEvent<K extends keyof WindowEventMap>(type: K, handleEvent: (event: WindowEventMap[K]) => void): () => void
}

export async function main({ canvas, onCanvasEvent, ResourcesWebGPU, UI, UITypeGPU, loadYoga, loadAssets }: DemoOptions) {
    const assets = await loadAssets()
    const own = owner()
    try {
        const resources = await ResourcesWebGPU.create({ canvas })
        const { context, device, format } = resources
        own(() => device.destroy())
        own(() => context.unconfigure())
        own(() => resources.dispose())
        const root = own(tgpu.initFromDevice({ device }))
        registerAssets({ resources, assets })

        const layout_width = Math.max(canvas.clientWidth, canvas.clientHeight)
        const layout_height = Math.min(canvas.clientWidth, canvas.clientHeight)
        const world_width = WORLD_HEIGHT * layout_width / layout_height
        const pixel_ratio = globalThis.devicePixelRatio
        const panel_options = {
            root,
            resources,
            loadYoga,
            texture_width: Math.round(layout_width * pixel_ratio),
            texture_height: Math.round(layout_height * pixel_ratio),
            world_width,
            world_height: WORLD_HEIGHT,
        }
        const { ui: overlay_ui } = await UI.create({ resources, loadYoga })
        own(overlay_ui)
        createForegroundUI({ ui: overlay_ui, assets, title: 'TypeGPU' })

        function resize() {
            const pixel_ratio = globalThis.devicePixelRatio
            canvas.width = Math.max(1, Math.round(canvas.clientWidth * pixel_ratio))
            canvas.height = Math.max(1, Math.round(canvas.clientHeight * pixel_ratio))
            overlay_ui.setViewport(canvas.clientWidth, canvas.clientHeight)
            overlay_ui.setDevicePixelRatio(pixel_ratio)
        }
        resize()

        const camera = cameras.orbit(root, {
            size: canvas,
            target: [0, 0.8, 0],
            pitch: Math.atan2(2.7, 9),
            distance: Math.hypot(9, 2.7),
            fov: FOV,
            near: 0.1,
            far: 100,
        })
        own(camera.uniform)
        own(camera.previous)
        own(onCanvasEvent('resize', resize))

        const panel_pointers = new Set<number>()
        const offset = world_width / 2 + 0.25
        async function createPanel(title: string, x: number, angle: number) {
            const { ui, plane, material } = await UITypeGPU.create(panel_options)
            own(ui)
            own(plane)
            ui.setViewport(layout_width, layout_height)
            ui.setDevicePixelRatio(pixel_ratio)
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
        own(onCanvasEvent('pointerdown', (event) => {
            if (event.button !== 0 && event.button !== 2) return
            canvas.setPointerCapture(event.pointerId)
            orbit_pointer = event.pointerId
            last_x = event.clientX
            last_y = event.clientY
        }))
        own(onCanvasEvent('pointermove', (event) => {
            if (event.pointerId !== orbit_pointer || panel_pointers.has(event.pointerId)) return
            cameras.turn(camera.goal, event.clientX - last_x, event.clientY - last_y)
            last_x = event.clientX
            last_y = event.clientY
        }))
        function endOrbit(event: PointerEvent) {
            if (event.pointerId === orbit_pointer) orbit_pointer = null
            panel_pointers.delete(event.pointerId)
        }
        own(onCanvasEvent('pointerup', endOrbit))
        own(onCanvasEvent('pointercancel', endOrbit))
        own(onCanvasEvent('contextmenu', (event) => event.preventDefault()))
        own(onCanvasEvent('wheel', (event) => {
            event.preventDefault()
            const delta = event.deltaMode === 0 ? event.deltaY : Math.sign(event.deltaY) * 40
            camera.goal.distance *= Math.exp(delta * 0.001)
        }))

        const screen = own(targets.create(root, canvas, {
            color: { format: SCENE_FORMAT, samples: 4 },
            depth: { format: 'depth24plus', samples: 4 },
            resolved: { format: SCENE_FORMAT, sampled: true },
        }))
        const scene = own(passes.create(root, screen, { color: passes.color, depth: passes.depth }, {
            clear: [...srgbToLinear(hexToRgb(0x111827)), 1],
            resolve: { color: 'resolved' },
        }).pipe(camera.inject()))
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
        const loop = own(frames.create(root, (frame) => {
            screen.fit()
            camera.update(frame.dt)
            const command_encoder = root.unwrap(frame.encoder)
            const texture_view = context.getCurrentTexture().createView()
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
            overlay_ui.update()
            overlay_ui.draw({ command_encoder, texture_view, submit: false })
        }))
        own(frames.animate(loop))
        return { uis: [overlay_ui, ...panels.map(({ ui }) => ui)], destroy: own.destroy }
    } catch (error) {
        own.destroy()
        throw error
    }
}

const HALF_SIZE = 10
const FLOOR_Y = -0.12
const AXIS_COLOR = d.vec4f(srgbToLinear(hexToRgb(0x475569)), 1)
const GRID_COLOR = d.vec4f(srgbToLinear(hexToRgb(0x263244)), 1)

const gridVertex = tgpu.vertexFn({
    in: { index: d.builtin.vertexIndex, row: d.builtin.instanceIndex },
    out: { position: d.builtin.position, color: d.vec4f },
})(`{
    let offset = f32(in.row) - f32(half_size);
    let end = select(-f32(half_size), f32(half_size), (in.index & 1u) != 0u);
    let xz = select(vec2f(offset, end), vec2f(end, offset), in.index < 2u);
    let position = camera.viewProjection * vec4f(xz.x, floor_y, xz.y, 1.0);
    return Out(position, select(grid_color, axis_color, in.row == half_size));
}`).$uses({
    camera: cameras.current,
    half_size: tgpu.const(d.u32, HALF_SIZE),
    floor_y: FLOOR_Y,
    grid_color: GRID_COLOR,
    axis_color: AXIS_COLOR,
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

const GROUND = tgpu.const(d.vec3f, srgbToLinear(hexToRgb(0x334155)))
const POINT_COLOR = tgpu.const(d.vec3f, srgbToLinear(hexToRgb(0x60a5fa)))
const pointFalloff = tgpu.fn([d.f32, d.f32], d.f32)(falloff)

const directLight = tgpu.fn([d.vec4f, d.vec3f, d.vec3f, d.vec3f, d.vec3f], d.vec3f)(`
    (base: vec4f, normal: vec3f, view: vec3f, light: vec3f, radiance: vec3f) -> vec3f {
        const shininess = 64.0;
        let irradiance = max(dot(normal, light), 0.0) * radiance;
        let dot_nh = max(dot(normal, normalize(light + view)), 0.0);
        let specular = 0.25 * (0.5 * shininess + 1.0) * pow(dot_nh, shininess);
        return irradiance * (base.rgb + vec3f(specular * base.a)) / 3.14159265;
    }
`)

function createPanelDrawing(plane: TypeGPUPlane, material: UIWebGPUTypeGPUMaterial, point_x: number) {
    const { Vertex, Pixel } = plane.drawing
    const sample = tgpu.fn([Vertex], Pixel)(material.pixelOf)
    const pixelOf = tgpu.fn([Vertex], Pixel)(`
        (vertex: Vertex) -> Pixel {
            let base = sample(vertex).color;
            let world = vertex.world_position;
            let view = normalize(camera.position - world);
            let face = normalize(cross(dpdx(world), dpdy(world)));
            let normal = select(-face, face, dot(face, view) >= 0.0);
            let sky = mix(ground, vec3f(1.0), 0.5 + 0.5 * normal.y);
            let ambient = base.rgb * sky * (2.0 / 3.14159265);
            let sun = directLight(base, normal, view, normalize(vec3f(3, 5, 4)), vec3f(3));
            let to_point = point_position - world;
            let radiance = point_color * (30.0 * pointFalloff(length(to_point), 4.2));
            let point = directLight(base, normal, view, normalize(to_point), radiance);
            return Pixel(vec4f(ambient + sun + point, base.a));
        }
    `).$uses({
        Vertex, Pixel, sample, camera: cameras.current, ground: GROUND, point_color: POINT_COLOR,
        point_position: tgpu.const(d.vec3f, d.vec3f(point_x, 1.5, 2)), directLight, pointFalloff,
    })
    return { ...plane.drawing, pixelOf }
}
