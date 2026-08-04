import { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine.js'
import { Scene } from '@babylonjs/core/scene.js'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js'
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer.js'
import { Color3 } from '@babylonjs/core/Maths/math.color.js'
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector.js'

const BACKGROUND_GAP = 16
const BACKGROUND_ITEM_SIZE = 120

export async function main({ canvas, onCanvasEvent, UIWebGPU, WebGPUSharedContext, loadImage, loadJson, loadYoga }) {
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

    const webgpu = await WebGPUSharedContext.create({
        canvas,
        device: engine._device,
        context,
        format,
    })
    const device_pixel_ratio = window.devicePixelRatio
    const background_ui = await UIWebGPU.create({ webgpu, loadYoga, device_pixel_ratio })
    const foreground_ui = await UIWebGPU.create({ webgpu, loadYoga, device_pixel_ratio })

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

    const { grid } = await createLayouts({ background_ui, foreground_ui, webgpu, loadImage, loadJson })
    syncCanvasSize({ canvas, engine, background_ui, foreground_ui })
    background_ui.update()
    foreground_ui.update()

    onCanvasEvent('resize', () => {
        syncCanvasSize({ canvas, engine, background_ui, foreground_ui })
        background_ui.update()
        foreground_ui.update()
    })

    const has_present = typeof context.present === 'function'
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

        if (has_present) {
            context.present()
        }
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

async function createLayouts({ background_ui, foreground_ui, webgpu, loadImage, loadJson }) {
    const coin = await loadImage('assets/images/coin.png')
    const repeat_x = await loadImage('assets/images/repeat-x.png')
    const repeat_y = await loadImage('assets/images/repeat-y.png')
    const font_image = await loadImage('assets/fonts/Supercell-Magic.mtsdf.png')
    const font_json = await loadJson('assets/fonts/Supercell-Magic.mtsdf.json')

    webgpu.registerImage(coin.src, coin)
    webgpu.registerImage(repeat_x.src, repeat_x)
    webgpu.registerImage(repeat_y.src, repeat_y)
    webgpu.registerFont('Supercell-Magic', font_image, font_json)

    const grid = background_ui.create()
    grid.style('width', '100%')
    grid.style('height', '100%')
    grid.style('flexDirection', 'row')
    grid.style('flexWrap', 'wrap')
    grid.style('alignContent', 'flex-start')
    grid.style('gap', `${BACKGROUND_GAP}px`)
    grid.style('padding', `${BACKGROUND_GAP}px`)
    grid.style('backgroundColor', '#654321')
    grid.style('backgroundImage', coin.src)
    grid.style('backgroundRepeat', 'repeat')
    grid.style('backgroundSize', '30px')
    background_ui.root.add(grid)

    const first = background_ui.create()
    first.style('width', `${BACKGROUND_ITEM_SIZE}px`)
    first.style('height', `${BACKGROUND_ITEM_SIZE}px`)
    first.style('borderRadius', '12px')
    first.style('backgroundImage', repeat_x.src)
    first.style('backgroundSize', '1px 100%')
    first.style('backgroundRepeat', 'repeat-x')
    first.style('border', '4px solid #000')
    grid.add(first)

    const second = background_ui.create()
    second.style('width', `${BACKGROUND_ITEM_SIZE}px`)
    second.style('height', `${BACKGROUND_ITEM_SIZE}px`)
    second.style('borderRadius', '12px')
    second.style('backgroundImage', repeat_y.src)
    second.style('backgroundSize', '100% 1px')
    second.style('backgroundRepeat', 'repeat-y')
    second.style('border', '4px solid #000')
    grid.add(second)

    const combined = background_ui.create()
    combined.style('width', `${BACKGROUND_ITEM_SIZE}px`)
    combined.style('height', `${BACKGROUND_ITEM_SIZE}px`)
    combined.style('borderRadius', '12px')
    combined.style('backgroundImage', repeat_x.src)
    combined.style('backgroundSize', '1px 100%')
    combined.style('backgroundRepeat', 'repeat-x')
    combined.style('border', '4px solid #000')
    grid.add(combined)

    const inside = background_ui.create()
    inside.style('width', '100%')
    inside.style('height', '100%')
    inside.style('borderRadius', '8px')
    inside.style('backgroundImage', repeat_y.src)
    inside.style('backgroundSize', '100% 1px')
    inside.style('backgroundRepeat', 'repeat-y')
    combined.add(inside)

    const foreground = foreground_ui.create()
    foreground.style('width', '100%')
    foreground.style('height', '100%')
    foreground.style('justifyContent', 'center')
    foreground.style('alignItems', 'center')
    foreground_ui.root.add(foreground)

    const title = foreground_ui.create()
    title.style('fontFamily', 'Supercell-Magic')
    title.style('fontSize', '50px')
    title.style('color', '#ffffff')
    title.style('textStroke', '6px #000000')
    title.style('textShadow', '0px 4px 0px #000000')
    title.text('Hello Babylon.js!')
    foreground.add(title)

    return { grid }
}
