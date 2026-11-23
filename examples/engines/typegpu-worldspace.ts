import tgpu from 'typegpu'
import * as d from 'typegpu/data'
import * as std from 'typegpu/std'
import { srgbToLinear } from '@typegpu/color'
import * as cameras from '@typegpu/kit/cameras'
import * as finish from '@typegpu/kit/finish'
import * as frames from '@typegpu/kit/frames'
import * as lighting from '@typegpu/kit/lighting'
import * as lines from '@typegpu/kit/lines'
import * as materials from '@typegpu/kit/materials'
import * as passes from '@typegpu/kit/passes'
import * as shading from '@typegpu/kit/shading'
import * as targets from '@typegpu/kit/targets'
import { mat4 } from 'wgpu-matrix'
import { registerAssets } from '../shared/assets'
import { createBackgroundUI } from '../shared/uis/background-ui'
import { createForegroundUI } from '../shared/uis/foreground-ui'

const WORLD_HEIGHT = 2
const TEXTURE_SCALAR = window.devicePixelRatio
const SCENE_FORMAT = 'rgba16float'
const DEPTH_FORMAT = 'depth24plus'

export async function main({ canvas, onCanvasEvent, ResourcesWebGPU, UI, UITypeGPU, loadAssets, loadYoga }) {
    const device_pixel_ratio = window.devicePixelRatio
    const device_width = Math.max(canvas.clientWidth, canvas.clientHeight)
    const device_height = Math.min(canvas.clientWidth, canvas.clientHeight)
    const world_width = WORLD_HEIGHT * (device_width / device_height)

    // TypeGPU creates the device because TypeGPU Kit requires core WebGPU, and uno UI would ask for a compatibility one.
    const root = await tgpu.init()
    const resources = await ResourcesWebGPU.create({ canvas, device: root.device })
    const { context, format } = resources
    const assets = await loadAssets()
    registerAssets({ resources, assets })

    // uno UI owns the canvas, so TypeGPU Kit draws on it through a borrowed screen instead of a surface of its own.
    const screen = {
        format,
        get width() {
            return canvas.width
        },
        get height() {
            return canvas.height
        },
        view: () => context.getCurrentTexture().createView(),
    }

    const view = cameras.orbit(root, {
        size: screen,
        target: [0, 0.8, 0],
        distance: 9.4,
        pitch: 0.29,
        fov: Math.PI / 3,
    })
    const scene_targets = targets.create(root, screen, {
        color: { format: SCENE_FORMAT, sampled: true },
        depth: { format: DEPTH_FORMAT },
    })
    // The scene is drawn in linear colors, so its background is #111827 converted from sRGB.
    const scene = passes
        .create(root, scene_targets, { color: passes.color, depth: passes.depth }, { clear: [0.0056, 0.0091, 0.0203, 1] })
        .pipe(view.inject())
    // Without a tone curve or a vignette the final pass does not shift the UI's colors.
    const final = finish.create(root, {
        format,
        source: () => scene_targets.textures.color,
        tone: null,
        settings: { vignette: 0 },
    })

    const light = lighting.create(root, {
        settings: {
            sunDirection: std.normalize(d.vec3f(3, 5, 4)),
            sunIntensity: 2,
        },
        points: {
            count: 1,
            light: () => {
                'use gpu'
                return lighting.Light({
                    position: d.vec3f(world_width / 2 - 0.25, 1.5, 2),
                    range: 5,
                    color: d.vec3f(0.117, 0.376, 0.956),
                    intensity: 6,
                })
            },
        },
    })

    const floor = lines.create(root, { capacity: 42, length: 2 })
    for (let position = -10; position <= 10; position++) {
        const line = (position + 10) * 2
        const style = { width: 0.02, color: [0.063, 0.09, 0.141, 1] }
        floor.write(line, [position, -0.12, -10, position, -0.12, 10], style)
        floor.write(line + 1, [-10, -0.12, position, 10, -0.12, position], style)
    }
    const floor_drawn = scene.add(floor.drawing)

    // Shades the UI as a glossy surface under the scene's lights. The fills give the function the camera and the lights.
    const shadePlane = tgpu
        .fn((color, world, normal) => {
            'use gpu'
            // The UI texture holds premultiplied sRGB colors, and the scene is shaded in linear ones.
            const surface = materials.glossy(srgbToLinear(std.div(color.xyz, std.max(color.w, 0.0001))), 0.35)
            return shading.shadeClear(surface, shading.pointAt(world, normal), color.w)
        })
        .pipe(view.inject())
        .pipe(light.inject())

    function createMaterial({ texture }) {
        const { layout } = texture
        return tgpu.fragmentFn({
            in: { uv: d.vec2f, world: d.vec3f, normal: d.vec3f },
            out: d.vec4f,
        })((input) => {
            'use gpu'
            const color = std.textureSample(layout.$.texture, layout.$.sampler, input.uv)
            return shadePlane(color, input.world, input.normal)
        })
    }

    const { ui: overlay_ui } = await UI.create({ loadYoga, resources, device_pixel_ratio })

    const texture_width = Math.round(device_width * TEXTURE_SCALAR)
    const texture_height = Math.round(device_height * TEXTURE_SCALAR)
    const { ui: first_ui, plane: first_plane } = await UITypeGPU.create({
        loadYoga,
        root,
        resources,
        device_pixel_ratio,
        texture_width,
        texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
        format: SCENE_FORMAT,
        depth_stencil: { format: DEPTH_FORMAT, depthCompare: 'less', depthWriteEnabled: false },
        createMaterial,
    })
    const { ui: second_ui, plane: second_plane } = await UITypeGPU.create({
        loadYoga,
        root,
        resources,
        device_pixel_ratio,
        texture_width,
        texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
        format: SCENE_FORMAT,
        depth_stencil: { format: DEPTH_FORMAT, depthCompare: 'less', depthWriteEnabled: false },
        createMaterial,
    })

    first_ui.setCamera(view)
    second_ui.setCamera(view)

    mat4.translation([-world_width / 2 - 0.25, 1, 0], first_plane.transform)
    mat4.rotateY(first_plane.transform, 0.35, first_plane.transform)

    mat4.translation([world_width / 2 + 0.25, 1, 0], second_plane.transform)
    mat4.rotateY(second_plane.transform, -0.35, second_plane.transform)

    // Orbit controls from the canvas events, as '@typegpu/kit/web' needs the DOM.
    let orbit_enabled = true
    let orbiting = false
    let pointer_x = 0
    let pointer_y = 0

    for (const ui of [first_ui, second_ui]) {
        ui.root.on('pointerdown', () => {
            orbit_enabled = false
        })
        ui.root.on('pointerup', () => {
            orbit_enabled = true
        })
    }
    onCanvasEvent('pointerdown', (event) => {
        orbiting = orbit_enabled
        pointer_x = event.clientX
        pointer_y = event.clientY
    })
    onCanvasEvent('pointermove', (event) => {
        if (orbiting) {
            cameras.turn(view.goal, event.clientX - pointer_x, event.clientY - pointer_y)
        }
        pointer_x = event.clientX
        pointer_y = event.clientY
    })
    onCanvasEvent('pointerup', () => {
        orbiting = false
    })
    onCanvasEvent('wheel', (event) => {
        view.goal.distance *= Math.exp(event.deltaY * 0.001)
    })

    const { grid: first_grid } = createBackgroundUI({ ui: first_ui, assets, title: 'First UI' })
    const { grid: second_grid } = createBackgroundUI({ ui: second_ui, assets, title: 'Second UI' })
    createForegroundUI({ ui: overlay_ui, assets, title: 'TypeGPU Kit' })

    for (const ui of [first_ui, second_ui]) {
        ui.setViewport(device_width, device_height)
        ui.update()
    }

    syncCanvasSize({ canvas, overlay_ui })
    onCanvasEvent('resize', () => syncCanvasSize({ canvas, overlay_ui }))

    let bg_position = 0
    const eye = [0, 0, 0]
    const distanceToEye = ({ transform }) =>
        Math.hypot(transform[12] - eye[0], transform[13] - eye[1], transform[14] - eye[2])

    const loop = frames.create(root, (frame) => {
        const command_encoder = root.unwrap(frame.encoder)
        bg_position += 1

        first_grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
        first_ui.update()
        first_ui.draw({ submit: false, command_encoder })

        second_grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
        second_ui.update()
        second_ui.draw({ submit: false, command_encoder })

        view.update(frame.dt)
        scene_targets.fit()
        const pass = scene.begin(frame)
        floor_drawn.draw(pass)
        // The planes blend without writing depth, so the farthest one is drawn first.
        cameras.eyeOf(view.pose, eye)
        for (const plane of [first_plane, second_plane].sort((a, b) => distanceToEye(b) - distanceToEye(a))) {
            plane.draw(pass)
        }
        pass.end()
        final.record(frame, screen.view())

        overlay_ui.update()
        overlay_ui.draw({ submit: false, command_encoder })
    })

    requestAnimationFrame(function renderFrame(time) {
        loop.run(time / 1000)
        requestAnimationFrame(renderFrame)
    })

    return { uis: [overlay_ui, first_ui, second_ui] }
}

function syncCanvasSize({ canvas, overlay_ui }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    canvas.width = Math.max(1, Math.round(width * device_pixel_ratio))
    canvas.height = Math.max(1, Math.round(height * device_pixel_ratio))
    overlay_ui.setViewport(width, height)
    overlay_ui.setDevicePixelRatio(device_pixel_ratio)
    overlay_ui.update()
}
