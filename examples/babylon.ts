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

const BACKGROUND_GAP = 16
const BACKGROUND_ITEM_SIZE = 120

export async function main({ canvas, onCanvasEvent, UIWebGPU, WebGPUSharedContext, loadImage, loadJson, loadYoga }) {
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
    const webgpu = await WebGPUSharedContext.create({
        canvas,
        device: engine._device,
        context,
        format: engine.format,
    })
    const device_pixel_ratio = window.devicePixelRatio
    const background_ui = await UIWebGPU.create({ webgpu, loadYoga, device_pixel_ratio })
    const foreground_ui = await UIWebGPU.create({ webgpu, loadYoga, device_pixel_ratio })

    const { grid } = await createLayouts({ background_ui, foreground_ui, webgpu, loadImage, loadJson })
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

        if (typeof context.present === 'function') {
            context.present()
        }

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
    title.text('Hello Babylon Lite!')
    foreground.add(title)

    return { grid }
}
