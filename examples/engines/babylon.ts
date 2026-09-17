import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine.js'
import { Scene } from '@babylonjs/core/scene.js'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js'
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer.js'
import { Color3 } from '@babylonjs/core/Maths/math.color.js'
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector.js'
import { PLATFORM_EVENT_NAMES } from '../../src/events/constants'
import { loadAssets, registerAssets } from '../shared/assets'
import { createBackgroundUI } from '../shared/uis/background-ui'
import { createForegroundUI } from '../shared/uis/foreground-ui'

export async function main({ canvas, onCanvasEvent, UI, ResourcesWebGPU, loadImage, loadJson }) {
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
    ;(engine as any).getInputElement = () => null

    const resources = await ResourcesWebGPU.create({
        canvas,
        device: engine._device,
        context,
        format,
    })
    const device_pixel_ratio = window.devicePixelRatio
    const { ui: background_ui } = await UI.create({ resources, device_pixel_ratio })
    const { ui: foreground_ui } = await UI.create({ resources, device_pixel_ratio })

    const scene = new Scene(engine)
    scene.autoClear = false

    const camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2, 4, Vector3.Zero(), scene)
    camera.fov = (72 * Math.PI) / 180
    camera.minZ = 1
    camera.maxZ = 100

    const cube = MeshBuilder.CreateBox('cube', { size: 2 }, scene)
    const positions = cube.getVerticesData(VertexBuffer.PositionKind)!
    const colors = new Float32Array((positions.length / 3) * 4)

    for (let i = 0; i < positions.length / 3; i++) {
        const position_index = i * 3
        const color_index = i * 4
        colors[color_index] = positions[position_index]! * 0.5 + 0.5
        colors[color_index + 1] = positions[position_index + 1]! * 0.5 + 0.5
        colors[color_index + 2] = positions[position_index + 2]! * 0.5 + 0.5
        colors[color_index + 3] = 1
    }

    cube.setVerticesData(VertexBuffer.ColorKind, colors)
    const cube_material = new StandardMaterial('cube-material', scene)
    cube_material.disableLighting = true
    cube_material.emissiveColor = Color3.White()
    cube.material = cube_material

    const assets = await loadAssets({ loadImage, loadJson })
    registerAssets({ resources, assets })
    const { grid } = createBackgroundUI({ ui: background_ui, assets, background_color: '#fde2c0' })
    createForegroundUI({ ui: foreground_ui, assets, title: 'Hello Babylon.js!' })
    syncCanvasSize({ canvas, engine, background_ui, foreground_ui })
    background_ui.update()
    foreground_ui.update()

    // Event handling
    PLATFORM_EVENT_NAMES.forEach((type) => {
        canvas.addEventListener(type, (e) => {
            background_ui.dispatchPlatformEvent(e)
            foreground_ui.dispatchPlatformEvent(e)
        })
    })
    onCanvasEvent('resize', () => {
        syncCanvasSize({ canvas, engine, background_ui, foreground_ui })
        background_ui.update()
        foreground_ui.update()
    })

    const rotation_sin = Math.sin(0.5)
    const rotation_cos = Math.cos(0.5)
    cube.rotationQuaternion = new Quaternion()
    let bg_position = 0

    engine.onBeginFrameObservable.add(() => {
        const texture = context.getCurrentTexture()
        if (engine.getRenderWidth(true) !== texture.width || engine.getRenderHeight(true) !== texture.height) {
            engine.setSize(texture.width, texture.height, true)
        }
    })

    engine.onEndFrameObservable.add(() => {
        foreground_ui.update()
        foreground_ui.draw()

        resources.present()
    })

    engine.runRenderLoop(() => {
        bg_position += 1
        grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
        background_ui.update()
        background_ui.draw({ load_op: 'clear' })

        const now = Date.now() / 1000
        cube.rotationQuaternion!.set(Math.sin(now) * rotation_sin, Math.cos(now) * rotation_sin, 0, rotation_cos)
        scene.render()
    })
}

function syncCanvasSize({ canvas, engine, background_ui, foreground_ui }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    engine.setSize(Math.round(width * device_pixel_ratio), Math.round(height * device_pixel_ratio))

    for (const ui of [background_ui, foreground_ui]) {
        ui.setViewport(width, height)
        ui.setDevicePixelRatio(device_pixel_ratio)
    }
}
