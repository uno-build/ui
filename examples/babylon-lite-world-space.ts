import {
    addTask,
    addToScene,
    attachControl,
    createArcRotateCamera,
    createDirectionalLight,
    createEngine,
    createGridMaterial,
    createGround,
    createHemisphericLight,
    createPointLight,
    createSceneContext,
    enableMaterialPlugins,
    onBeforeRender,
    registerScene,
    renderFrame,
    resizeEngine,
} from '@babylonjs/lite'
import { PLATFORM_EVENT_NAMES } from '../src/events/constants'
import { loadAssets, registerAssets } from './uis/assets'
import { createBackgroundUI } from './uis/background-ui'
import { createForegroundUI } from './uis/foreground-ui'

const WORLD_HEIGHT = 2
const TEXTURE_SCALAR = window.devicePixelRatio

export async function main({
    canvas,
    onCanvasEvent,
    ResourcesWebGPU,
    UIWebGPU,
    UIBabylonLite,
    loadImage,
    loadJson,
    loadYoga,
}) {
    const device_pixel_ratio = window.devicePixelRatio
    const device_width = Math.max(canvas.clientWidth, canvas.clientHeight)
    const device_height = Math.min(canvas.clientWidth, canvas.clientHeight)
    const world_width = WORLD_HEIGHT * (device_width / device_height)

    const engine = await createEngine(canvas, { msaaSamples: 1, alphaMode: 'premultiplied' })
    const scene = createSceneContext(engine)
    scene.clearColor = { r: 0.067, g: 0.094, b: 0.153, a: 1 }

    const context = canvas.getContext('webgpu')
    const resources = await ResourcesWebGPU.create({
        canvas,
        device: engine._device,
        context,
        format: engine.format,
    })
    const assets = await loadAssets({ loadImage, loadJson })
    registerAssets({ resources, assets })

    const { ui: overlay_ui } = await UIWebGPU.create({ resources, loadYoga, device_pixel_ratio })

    const texture_width = Math.round(device_width * TEXTURE_SCALAR)
    const texture_height = Math.round(device_height * TEXTURE_SCALAR)
    const { ui: first_ui, plane: first_plane } = await UIBabylonLite.create({
        engine,
        scene,
        resources,
        loadYoga,
        device_pixel_ratio,
        texture_width,
        texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
    })
    const { ui: second_ui, plane: second_plane } = await UIBabylonLite.create({
        engine,
        scene,
        resources,
        loadYoga,
        device_pixel_ratio,
        texture_width,
        texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
    })
    const camera = createArcRotateCamera(-Math.PI / 2, 1.25, 9.5, { x: 0, y: 0.8, z: 0 })
    scene.camera = camera

    // Event handling
    PLATFORM_EVENT_NAMES.forEach((type) => {
        canvas.addEventListener(type, (e) => {
            overlay_ui.dispatchPlatformEvent(e)
            first_ui.dispatchPlatformEvent(e, { camera })
            second_ui.dispatchPlatformEvent(e, { camera })
        })
    })
    let detach_camera_control
    first_ui.root.on('pointerdown', () => {
        detach_camera_control()
    })
    first_ui.root.on('pointerup', () => {
        detach_camera_control = attachControl(camera, canvas, scene)
    })
    second_ui.root.on('pointerdown', () => {
        detach_camera_control()
    })
    second_ui.root.on('pointerup', () => {
        detach_camera_control = attachControl(camera, canvas, scene)
    })

    detach_camera_control = attachControl(camera, canvas, scene)

    first_plane.position.set(-world_width / 2 - 0.25, 1, 0)
    first_plane.rotation.y = -0.35
    first_plane.material.backFaceCulling = false
    addToScene(scene, first_plane)

    second_plane.position.set(world_width / 2 + 0.25, 1, 0)
    second_plane.rotation.y = 0.35
    second_plane.material.backFaceCulling = false
    addToScene(scene, second_plane)

    const floor = createGround(engine, { width: 20, height: 20 })
    floor.position.y = -0.12
    floor.material = createGridMaterial({
        mainColor: [0.067, 0.094, 0.153],
        lineColor: [0.278, 0.333, 0.412],
        gridRatio: 1,
        majorUnitFrequency: 1,
    })
    addToScene(scene, floor)

    addToScene(scene, createHemisphericLight([0, 1, 0], 2))
    addToScene(scene, createDirectionalLight([-3, -5, -4], 3))

    const second_light = createPointLight([second_plane.position.x + 0.5, second_plane.position.y + 0.5, -2], 25)
    second_light.diffuse = [0.376, 0.647, 0.98]
    second_light.specular = [0.376, 0.647, 0.98]
    second_light.range = 5
    addToScene(scene, second_light)

    const { grid: first_grid } = createBackgroundUI({ ui: first_ui, assets, title: 'First UI' })
    const { grid: second_grid } = createBackgroundUI({ ui: second_ui, assets, title: 'Second UI' })
    createForegroundUI({ ui: overlay_ui, assets, title: 'Babylon Lite' })

    for (const ui of [first_ui, second_ui]) {
        ui.setViewport(device_width, device_height)
        ui.update()
    }

    syncCanvasSize({ canvas, overlay_ui })
    onCanvasEvent('resize', () => syncCanvasSize({ canvas, overlay_ui }))

    let bg_position = 0
    onBeforeRender(scene, () => {
        bg_position += 1
        first_grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
        second_grid.style('backgroundPosition', `${-bg_position}px ${bg_position}px`)

        first_ui.update()
        first_ui.draw({ submit: false, command_encoder: engine._currentEncoder })
        second_ui.update()
        second_ui.draw({ submit: false, command_encoder: engine._currentEncoder })
    })

    addTask(scene, {
        name: 'ui-overlay',
        engine,
        _passes: [],
        record() {},
        execute() {
            overlay_ui.update()
            overlay_ui.draw({ submit: false, command_encoder: engine._currentEncoder })
            return 1
        },
        dispose() {},
    })

    enableMaterialPlugins(scene)
    await registerScene(scene)

    let last_time = 0

    function frame(now) {
        const delta = last_time === 0 ? 0 : now - last_time
        last_time = now

        resizeEngine(engine)
        renderFrame(engine, delta)

        resources.present()

        requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
}

function syncCanvasSize({ canvas, overlay_ui }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    overlay_ui.setViewport(width, height)
    overlay_ui.setDevicePixelRatio(device_pixel_ratio)
    overlay_ui.update()
}
