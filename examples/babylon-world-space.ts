import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js'
import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine.js'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight.js'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight.js'
import { PointLight } from '@babylonjs/core/Lights/pointLight.js'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color.js'
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js'
import { Scene } from '@babylonjs/core/scene.js'
import { loadAssets, registerAssets } from './uis/assets'
import { createBackgroundUI } from './uis/background-ui'
import { createForegroundUI } from './uis/foreground-ui'

const WORLD_HEIGHT = 2
const TEXTURE_SCALAR = window.devicePixelRatio

export async function main({
    canvas,
    onCanvasEvent,
    WebGPUResources,
    UIWebGPU,
    UIBabylon,
    loadImage,
    loadJson,
    loadYoga,
}) {
    const context = canvas.getContext('webgpu')
    const format = navigator.gpu.getPreferredCanvasFormat()
    const engine = new WebGPUEngine(canvas, {
        antialias: false,
        audioEngine: false,
        premultipliedAlpha: true,
        doNotHandleTouchAction: true,
        swapChainFormat: format,
    })
    await engine.initAsync()

    if (typeof document === 'undefined') {
        ;(engine as any).getInputElement = () => null
    }

    const scene = new Scene(engine)
    scene.clearColor = new Color4(0.067, 0.094, 0.153, 1)

    const device_pixel_ratio = window.devicePixelRatio
    const device_width = Math.max(canvas.clientWidth, canvas.clientHeight)
    const device_height = Math.min(canvas.clientWidth, canvas.clientHeight)
    const world_width = WORLD_HEIGHT * (device_width / device_height)

    const webgpu = await WebGPUResources.create({
        canvas,
        device: engine._device,
        context,
        format,
    })
    const assets = await loadAssets({ loadImage, loadJson })
    registerAssets({ webgpu, assets })

    const overlay_ui = await UIWebGPU.create({ webgpu, loadYoga, device_pixel_ratio })

    const texture_width = Math.round(device_width * TEXTURE_SCALAR)
    const texture_height = Math.round(device_height * TEXTURE_SCALAR)
    const first_ui = await UIBabylon.create({
        scene,
        webgpu,
        loadYoga,
        device_pixel_ratio,
        texture_width,
        texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
    })
    const first_plane = first_ui.plane

    const second_ui = await UIBabylon.create({
        scene,
        webgpu,
        loadYoga,
        device_pixel_ratio,
        texture_width,
        texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
    })
    const second_plane = second_ui.plane

    const camera = new ArcRotateCamera('camera', -Math.PI / 2, 1.25, 9.5, new Vector3(0, 0.8, 0), scene)

    if (typeof document !== 'undefined') {
        camera.attachControl(canvas, true)
    }

    first_plane.position.set(-world_width / 2 - 0.25, 1, 0)
    first_plane.rotation.y = -0.35
    first_plane.material.backFaceCulling = false

    second_plane.position.set(world_width / 2 + 0.25, 1, 0)
    second_plane.rotation.y = 0.35
    second_plane.material.backFaceCulling = false

    // const floor = MeshBuilder.CreateGround('floor', { width: 20, height: 20 }, scene)
    // floor.position.y = -0.13
    // const floor_material = new StandardMaterial('floor-material', scene)
    // floor_material.diffuseColor = new Color3(0.067, 0.094, 0.153)
    // floor_material.specularColor = Color3.Black()
    // floor.material = floor_material

    const grid_lines = []
    for (let position = -10; position <= 10; position++) {
        grid_lines.push(
            [new Vector3(position, -0.12, -10), new Vector3(position, -0.12, 10)],
            [new Vector3(-10, -0.12, position), new Vector3(10, -0.12, position)],
        )
    }
    const grid = MeshBuilder.CreateLineSystem('grid', { lines: grid_lines }, scene)
    grid.color = new Color3(0.278, 0.333, 0.412)

    const hemisphere_light = new HemisphericLight('hemisphere-light', new Vector3(0, 1, 0), scene)
    hemisphere_light.intensity = 2

    const directional_light = new DirectionalLight('directional-light', new Vector3(-3, -5, -4), scene)
    directional_light.intensity = 3

    const second_light = new PointLight(
        'second-light',
        new Vector3(second_plane.position.x + 0.5, second_plane.position.y + 0.5, -2),
        scene,
    )
    second_light.diffuse = new Color3(0.376, 0.647, 0.98)
    second_light.specular = new Color3(0.376, 0.647, 0.98)
    second_light.intensity = 250
    second_light.range = 5

    const { grid: first_grid } = createBackgroundUI({ ui: first_ui, assets, title: 'First UI' })
    const { grid: second_grid } = createBackgroundUI({ ui: second_ui, assets, title: 'Second UI' })
    createForegroundUI({ ui: overlay_ui, assets, title: 'Babylon.js' })

    for (const ui of [first_ui, second_ui]) {
        ui.setViewport(device_width, device_height)
        ui.update()
    }

    syncCanvasSize({ canvas, engine, overlay_ui })
    onCanvasEvent('resize', () => syncCanvasSize({ canvas, engine, overlay_ui }))

    let bg_position = 0
    scene.onBeforeRenderObservable.add(() => {
        bg_position += 1
        first_grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
        second_grid.style('backgroundPosition', `${-bg_position}px ${bg_position}px`)

        first_ui.update()
        first_ui.draw()
        second_ui.update()
        second_ui.draw()
    })

    const has_present = typeof context.present === 'function'

    engine.onBeginFrameObservable.add(() => {
        const texture = context.getCurrentTexture()
        if (engine.getRenderWidth(true) !== texture.width || engine.getRenderHeight(true) !== texture.height) {
            engine.setSize(texture.width, texture.height, true)
        }
    })

    engine.onEndFrameObservable.add(() => {
        overlay_ui.update()
        overlay_ui.draw()

        if (has_present) {
            context.present()
        }
    })

    engine.runRenderLoop(() => scene.render())
}

function syncCanvasSize({ canvas, engine, overlay_ui }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    engine.setSize(Math.round(width * device_pixel_ratio), Math.round(height * device_pixel_ratio))
    overlay_ui.setViewport(width, height)
    overlay_ui.setDevicePixelRatio(device_pixel_ratio)
    overlay_ui.update()
}
