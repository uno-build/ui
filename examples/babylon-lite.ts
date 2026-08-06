import {
    addTask,
    addToScene,
    createArcRotateCamera,
    createBoxData,
    createEngine,
    createMeshFromData,
    createRenderTarget,
    createRenderTask,
    createSceneContext,
    createStandardMaterial,
    enableStandardVertexColors,
    onBeforeRender,
    registerScene,
    renderFrame,
    resizeEngine,
} from '@babylonjs/lite'
import { loadAssets, registerAssets } from './uis/assets'
import { createBackgroundUI } from './uis/background-ui'
import { createForegroundUI } from './uis/foreground-ui'

export async function main({ canvas, onCanvasEvent, UIWebGPU, WebGPUResources, loadImage, loadJson, loadYoga }) {
    const engine = await createEngine(canvas, { msaaSamples: 1, alphaMode: 'premultiplied' })
    const scene = createSceneContext(engine, { defaultRenderTask: false })

    const camera = createArcRotateCamera(-Math.PI / 2, Math.PI / 2, 4, { x: 0, y: 0, z: 0 })
    camera.fov = (72 * Math.PI) / 180
    camera.nearPlane = 1
    camera.farPlane = 100
    scene.camera = camera

    const box_data = createBoxData(2)
    const colors = new Float32Array(box_data.vertexCount * 4)

    for (let i = 0; i < box_data.vertexCount; i++) {
        const position_index = i * 3
        const color_index = i * 4
        colors[color_index] = box_data.positions[position_index] * 0.5 + 0.5
        colors[color_index + 1] = box_data.positions[position_index + 1] * 0.5 + 0.5
        colors[color_index + 2] = box_data.positions[position_index + 2] * 0.5 + 0.5
        colors[color_index + 3] = 1
    }

    const cube = createMeshFromData(
        engine,
        'cube',
        box_data.positions,
        box_data.normals,
        box_data.indices,
        box_data.uvs,
        undefined,
        undefined,
        colors,
    )
    const cube_material = createStandardMaterial()
    cube_material.disableLighting = true
    cube_material.emissiveColor = [1, 1, 1]
    cube.material = cube_material
    addToScene(scene, cube)

    const context = canvas.getContext('webgpu')
    const webgpu = await WebGPUResources.create({
        canvas,
        device: engine._device,
        context,
        format: engine.format,
    })
    const device_pixel_ratio = window.devicePixelRatio
    const { ui: background_ui } = await UIWebGPU.create({ webgpu, loadYoga, device_pixel_ratio })
    const { ui: foreground_ui } = await UIWebGPU.create({ webgpu, loadYoga, device_pixel_ratio })

    const assets = await loadAssets({ loadImage, loadJson })
    registerAssets({ webgpu, assets })
    const { grid } = createBackgroundUI({ ui: background_ui, assets, background_color: '#fbd0dd' })
    createForegroundUI({ ui: foreground_ui, assets, title: 'Hello Babylon Lite!' })
    syncCanvasSize({ canvas, background_ui, foreground_ui })
    background_ui.update()
    foreground_ui.update()

    onCanvasEvent('resize', () => {
        syncCanvasSize({ canvas, background_ui, foreground_ui })
        background_ui.update()
        foreground_ui.update()
    })

    const rotation_sin = Math.sin(0.5)
    const rotation_cos = Math.cos(0.5)
    let bg_position = 0

    onBeforeRender(scene, () => {
        const now = Date.now() / 1000
        cube.rotationQuaternion.set(Math.sin(now) * rotation_sin, Math.cos(now) * rotation_sin, 0, rotation_cos)
    })

    addTask(scene, {
        name: 'background-ui',
        engine,
        _passes: [],
        record() {},
        execute() {
            bg_position += 1
            grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
            background_ui.update()
            background_ui.draw({
                submit: false,
                command_encoder: engine._currentEncoder,
                texture_view: engine.scRT._colorView,
                load_op: 'clear',
            })
            return 1
        },
        dispose() {},
    })

    const depth = createRenderTarget({
        lbl: 'scene-depth',
        dFormat: 'depth24plus-stencil8',
        samples: 1,
        size: engine,
    })
    addTask(scene, createRenderTask({ name: 'scene', rt: engine.scRT, depth, clr: false }, engine, scene))

    addTask(scene, {
        name: 'foreground-ui',
        engine,
        _passes: [],
        record() {},
        execute() {
            foreground_ui.update()
            foreground_ui.draw({
                submit: false,
                command_encoder: engine._currentEncoder,
                texture_view: engine.scRT._colorView,
            })
            return 1
        },
        dispose() {},
    })

    enableStandardVertexColors()

    await registerScene(scene)

    let last_time = 0

    function frame(now) {
        const delta = last_time === 0 ? 0 : now - last_time
        last_time = now

        resizeEngine(engine)

        renderFrame(engine, delta)

        webgpu.present()

        requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
}

function syncCanvasSize({ canvas, background_ui, foreground_ui }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    for (const ui of [background_ui, foreground_ui]) {
        ui.setViewport(width, height)
        ui.setDevicePixelRatio(device_pixel_ratio)
    }
}
