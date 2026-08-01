import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const WORLD_HEIGHT = 2
const BACKGROUND_GAP = 16
const BACKGROUND_ITEM_SIZE = 120

export async function main({ canvas, onCanvasEvent, UI, RendererThreeWorldSpace, loadImage, loadJson, loadYoga }) {
    const device_pixel_ratio = window.devicePixelRatio
    const device_width = Math.max(canvas.clientWidth, canvas.clientHeight)
    const device_height = Math.min(canvas.clientWidth, canvas.clientHeight)
    const world_width = WORLD_HEIGHT * (device_width / device_height)

    const first_renderer = new RendererThreeWorldSpace({
        canvas,
        loadYoga,
        texture_width: Math.round(device_width * device_pixel_ratio),
        texture_height: Math.round(device_height * device_pixel_ratio),
        world_width,
        world_height: WORLD_HEIGHT,
    })
    const first_ui = new UI({ renderer: first_renderer, device_pixel_ratio })
    const { context, adapter, device, plane: first_plane } = await first_ui.init()

    const second_renderer = new RendererThreeWorldSpace({
        canvas,
        loadYoga,
        adapter,
        device,
        texture_width: Math.round(device_width * device_pixel_ratio),
        texture_height: Math.round(device_height * device_pixel_ratio),
        world_width,
        world_height: WORLD_HEIGHT,
    })
    const second_ui = new UI({ renderer: second_renderer, device_pixel_ratio })
    const { plane: second_plane } = await second_ui.init()

    const three_renderer = new THREE.WebGPURenderer({
        canvas,
        context,
        device,
        alpha: true,
        antialias: true,
    })
    await three_renderer.init()

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x111827)

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
    camera.position.set(0, 3.5, 9)

    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.target.set(0, 0.8, 0)

    first_plane.position.set(-world_width / 2 - 0.25, 1, 0)
    first_plane.rotation.y = 0.35
    first_plane.material.side = THREE.DoubleSide
    scene.add(first_plane)

    second_plane.position.set(world_width / 2 + 0.25, 1, 0)
    second_plane.rotation.y = -0.35
    second_plane.material.side = THREE.DoubleSide
    scene.add(second_plane)

    const floor = new THREE.GridHelper(20, 20, 0x475569, 0x263244)
    floor.position.y = -0.12
    scene.add(floor)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2))
    const light = new THREE.DirectionalLight(0xffffff, 3)
    light.position.set(3, 5, 4)
    scene.add(light)

    const assets = await loadAssets({ loadImage, loadJson })
    const { grid: first_grid } = createLayout({ ui: first_ui, assets, title: 'First UI' })
    const { grid: second_grid } = createLayout({ ui: second_ui, assets, title: 'Second UI' })

    for (const ui of [first_ui, second_ui]) {
        ui.setViewport(device_width, device_height)
        ui.update()
    }

    syncCanvasSize({ canvas, three_renderer, camera })
    onCanvasEvent('resize', () => syncCanvasSize({ canvas, three_renderer, camera }))

    const has_present = typeof context.present === 'function'
    let bg_position = 0

    function renderFrame() {
        bg_position += 1
        first_grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
        second_grid.style('backgroundPosition', `${-bg_position}px ${bg_position}px`)

        first_ui.update()
        first_ui.draw()
        second_ui.update()
        second_ui.draw()

        controls.update()
        three_renderer.render(scene, camera)

        if (has_present) {
            context.present()
        }

        requestAnimationFrame(renderFrame)
    }

    requestAnimationFrame(renderFrame)
}

function syncCanvasSize({ canvas, three_renderer, camera }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    three_renderer.setPixelRatio(device_pixel_ratio)
    three_renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
}

async function loadAssets({ loadImage, loadJson }) {
    const coin = await loadImage('assets/images/coin.png')
    const repeat_x = await loadImage('assets/images/repeat-x.png')
    const repeat_y = await loadImage('assets/images/repeat-y.png')
    const font_image = await loadImage('assets/fonts/Supercell-Magic.mtsdf.png')
    const font_json = await loadJson('assets/fonts/Supercell-Magic.mtsdf.json')

    return { coin, repeat_x, repeat_y, font_image, font_json }
}

function createLayout({ ui, assets, title: title_text }) {
    const { coin, repeat_x, repeat_y, font_image, font_json } = assets

    ui.imageUpload(coin.src, coin)
    ui.imageUpload(repeat_x.src, repeat_x)
    ui.imageUpload(repeat_y.src, repeat_y)
    ui.fontRegister('Supercell-Magic', font_image, font_json)

    const grid = ui.create()
    grid.style('width', '100%')
    grid.style('height', '100%')
    grid.style('flexDirection', 'row')
    grid.style('flexWrap', 'wrap')
    grid.style('alignContent', 'flex-start')
    grid.style('gap', `${BACKGROUND_GAP}px`)
    grid.style('padding', `${BACKGROUND_GAP}px`)
    grid.style('backgroundImage', coin.src)
    grid.style('backgroundRepeat', 'repeat')
    grid.style('backgroundSize', '30px')
    ui.root.add(grid)

    const first = ui.create()
    first.style('width', `${BACKGROUND_ITEM_SIZE}px`)
    first.style('height', `${BACKGROUND_ITEM_SIZE}px`)
    first.style('borderRadius', '12px')
    first.style('backgroundImage', repeat_x.src)
    first.style('backgroundSize', '1px 100%')
    first.style('backgroundRepeat', 'repeat-x')
    first.style('border', '4px solid #000')
    grid.add(first)

    const second = ui.create()
    second.style('width', `${BACKGROUND_ITEM_SIZE}px`)
    second.style('height', `${BACKGROUND_ITEM_SIZE}px`)
    second.style('borderRadius', '12px')
    second.style('backgroundImage', repeat_y.src)
    second.style('backgroundSize', '100% 1px')
    second.style('backgroundRepeat', 'repeat-y')
    second.style('border', '4px solid #000')
    grid.add(second)

    const combined = ui.create()
    combined.style('width', `${BACKGROUND_ITEM_SIZE}px`)
    combined.style('height', `${BACKGROUND_ITEM_SIZE}px`)
    combined.style('borderRadius', '12px')
    combined.style('backgroundImage', repeat_x.src)
    combined.style('backgroundSize', '1px 100%')
    combined.style('backgroundRepeat', 'repeat-x')
    combined.style('border', '4px solid #000')
    grid.add(combined)

    const inside = ui.create()
    inside.style('width', '100%')
    inside.style('height', '100%')
    inside.style('borderRadius', '8px')
    inside.style('backgroundImage', repeat_y.src)
    inside.style('backgroundSize', '100% 1px')
    inside.style('backgroundRepeat', 'repeat-y')
    combined.add(inside)

    const title = ui.create()
    title.style('fontFamily', 'Supercell-Magic')
    title.style('fontSize', '50px')
    title.style('color', '#ffffff')
    title.style('textStroke', '6px #000000')
    title.style('textShadow', '0px 4px 0px #000000')
    title.text(title_text)
    grid.add(title)

    return { grid }
}
