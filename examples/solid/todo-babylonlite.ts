import {
    addToScene,
    attachControl,
    createArcRotateCamera,
    createEngine,
    createGridMaterial,
    createGround,
    createSceneContext,
    createStandardMaterial,
    enableMaterialPlugins,
    onBeforeRender,
    registerScene,
    renderFrame,
    resizeEngine,
} from '@babylonjs/lite'
import { registerRootComponent } from '../../src/components/solid'
import { FONT_NAME_NOUGAT as TITLE_FONT_FAMILY, loadAssets, loadFont, registerAssets } from '../shared/assets'
import { SolidTodo } from './todo'
import { PLATFORM_EVENT_NAMES } from '../../src/events/constants'

// The Todo card is 620x640 and PAGE_STYLE pads it by PAGE_PADDING on every side.
const PAGE_PADDING = 32
const UI_WIDTH = 620 + PAGE_PADDING * 2
const UI_HEIGHT = 640 + PAGE_PADDING * 2
const WORLD_HEIGHT = 2
const WORLD_WIDTH = WORLD_HEIGHT * (UI_WIDTH / UI_HEIGHT)
const WORLD_PAGE_PADDING = (PAGE_PADDING / UI_HEIGHT) * WORLD_HEIGHT
const FLOOR_Y = -0.12
// That padding is transparent, so the plane drops by it for the card itself to land on the grid.
const PANEL_Y = FLOOR_Y + WORLD_HEIGHT / 2 - WORLD_PAGE_PADDING
const TEXTURE_SCALAR = window.devicePixelRatio
const ICON_SRC = 'assets/images/solid.png'

export async function main({ canvas, ResourcesWebGPU, UIBabylonLite, loadImage, loadJson }) {
    const device_pixel_ratio = window.devicePixelRatio
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

    const [icon, title_font] = await Promise.all([
        loadImage(ICON_SRC),
        loadFont(TITLE_FONT_FAMILY, { loadImage, loadJson }),
    ])
    resources.registerImage(ICON_SRC, icon)
    resources.registerFont(TITLE_FONT_FAMILY, title_font)

    const texture_width = Math.round(UI_WIDTH * TEXTURE_SCALAR)
    const texture_height = Math.round(UI_HEIGHT * TEXTURE_SCALAR)
    const { ui, plane } = await UIBabylonLite.create({
        register_platform_events: false,
        engine,
        scene,
        resources,
        device_pixel_ratio,
        texture_width,
        texture_height,
        world_width: WORLD_WIDTH,
        world_height: WORLD_HEIGHT,
        createMaterial() {
            const material = createStandardMaterial()
            material.disableLighting = true
            material.emissiveColor = [1, 1, 1]
            material.backFaceCulling = false
            return material
        },
    })

    // Babylon Lite's plane faces -Z, so this mirrors the Three.js camera offset onto its front side.
    const camera = createArcRotateCamera(-Math.PI / 2, Math.atan2(4.5, 1.31), Math.hypot(4.5, 1.31), {
        x: 0,
        y: PANEL_Y,
        z: 0,
    })
    camera.fov = Math.PI / 3
    camera.nearPlane = 0.1
    camera.farPlane = 100
    scene.camera = camera
    ui.setCamera(camera)

    const active_pointers = new Map()
    const panel_pointers = new Set()
    const pending_pointer_picks = new Set()

    PLATFORM_EVENT_NAMES.forEach((type) => {
        canvas.addEventListener(type, (e) => {
            if (type === 'pointerdown') {
                active_pointers.set(e.pointerId, e)
                pending_pointer_picks.add(e)
            }

            const dispatch_result = ui.dispatchPlatformEvent(e)

            if (type === 'pointerdown') {
                dispatch_result.then(
                    () => pending_pointer_picks.delete(e),
                    (error) => {
                        pending_pointer_picks.delete(e)
                        console.error(error)
                    },
                )
            } else if (type === 'pointerup' || type === 'pointercancel') {
                const pointer_down_event = active_pointers.get(e.pointerId)
                panel_pointers.delete(pointer_down_event)
                pending_pointer_picks.delete(pointer_down_event)
                active_pointers.delete(e.pointerId)
            }
        })
    })

    ui.root.on('pointerdown', (e) => {
        const source_event = e.source_event

        if (active_pointers.get(source_event.pointerId) === source_event) {
            panel_pointers.add(source_event)
        }
    })

    const camera_control_options = {
        isExternalPickPending: () => active_pointers.size === 1 && pending_pointer_picks.size > 0,
        isExternalDragActive: () => active_pointers.size === 1 && panel_pointers.size > 0,
    }
    let detachCameraControl = attachControl(camera, canvas, scene, camera_control_options)

    function resetCameraControl() {
        detachCameraControl()
        detachCameraControl = attachControl(camera, canvas, scene, camera_control_options)
    }

    canvas.addEventListener('pointercancel', resetCameraControl)
    canvas.addEventListener('touchcancel', resetCameraControl)

    const camera_wheel_precision = camera.wheelPrecision
    ui.root.on('pointerover', (e) => {
        camera.wheelPrecision =
            e.source_event.pointerType === 'mouse' ? Number.POSITIVE_INFINITY : camera_wheel_precision
    })
    ui.root.on('pointerout', () => {
        camera.wheelPrecision = camera_wheel_precision
    })

    plane.position.set(0, PANEL_Y, 0)
    addToScene(scene, plane)

    const floor = createGround(engine, { width: 20, height: 20 })
    floor.position.y = FLOOR_Y
    floor.material = createGridMaterial({
        mainColor: [0.067, 0.094, 0.153],
        lineColor: [0.278, 0.333, 0.412],
        gridRatio: 1,
        majorUnitFrequency: 1,
    })
    addToScene(scene, floor)

    registerRootComponent(SolidTodo, { ui }).render({ backgroundColor: 'unset', boxShadow: 'unset' })

    ui.setViewport(UI_WIDTH, UI_HEIGHT)
    ui.update()

    onBeforeRender(scene, () => {
        ui.draw({ submit: false, command_encoder: engine._currentEncoder })
    })

    enableMaterialPlugins(scene)
    await registerScene(scene)

    let last_time = 0

    function renderNextFrame(now) {
        const delta = last_time === 0 ? 0 : now - last_time
        last_time = now

        resizeEngine(engine)
        renderFrame(engine, delta)

        resources.present()

        requestAnimationFrame(renderNextFrame)
    }

    requestAnimationFrame(renderNextFrame)
}
