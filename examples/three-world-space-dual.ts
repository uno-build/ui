import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const WORLD_HEIGHT = 2
const BACKGROUND_GAP = 16
const BACKGROUND_ITEM_SIZE = 120

export async function main({
    canvas,
    onCanvasEvent,
    createWebGPU,
    createOverlayUI,
    createThreeWorldSpaceUI,
    loadImage,
    loadJson,
    loadYoga,
}) {
    const device_pixel_ratio = window.devicePixelRatio
    const device_width = Math.max(canvas.clientWidth, canvas.clientHeight)
    const device_height = Math.min(canvas.clientWidth, canvas.clientHeight)
    const world_width = WORLD_HEIGHT * (device_width / device_height)
    const texture_width = Math.round(device_width * device_pixel_ratio)
    const texture_height = Math.round(device_height * device_pixel_ratio)

    const webgpu = await createWebGPU({ canvas, loadYoga })
    const { ui: left_ui, plane: left_plane } = await createThreeWorldSpaceUI({
        webgpu,
        texture_width,
        texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
    })
    const { ui: right_ui, plane: right_plane } = await createThreeWorldSpaceUI({
        webgpu,
        texture_width,
        texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
    })
    const { ui: overlay_ui } = await createOverlayUI({ webgpu })
    const { context, device } = webgpu
    left_ui.setDevicePixelRatio(device_pixel_ratio)
    right_ui.setDevicePixelRatio(device_pixel_ratio)
    overlay_ui.setDevicePixelRatio(device_pixel_ratio)

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
    camera.position.set(5, 3.5, 6)

    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.target.set(0, 0.8, 0)

    left_plane.position.set(-world_width * 0.55, 1, 0)
    left_plane.material.side = THREE.DoubleSide
    scene.add(left_plane)

    right_plane.position.set(world_width * 0.55, 1, 0)
    right_plane.material.side = THREE.DoubleSide
    scene.add(right_plane)

    const floor = new THREE.GridHelper(20, 20, 0x475569, 0x263244)
    floor.position.y = -0.12
    scene.add(floor)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2))
    const light = new THREE.DirectionalLight(0xffffff, 3)
    light.position.set(3, 5, 4)
    scene.add(light)

    const { grid: left_grid, font_image, font_json } = await createLayout({
        ui: left_ui,
        loadImage,
        loadJson,
        title_text: 'Left UI',
    })
    const { grid: right_grid } = await createLayout({
        ui: right_ui,
        loadImage,
        loadJson,
        title_text: 'Right UI',
    })
    createOverlayLayout({ ui: overlay_ui, font_image, font_json })
    left_ui.setViewport(device_width, device_height)
    right_ui.setViewport(device_width, device_height)
    overlay_ui.setViewport(canvas.clientWidth, canvas.clientHeight)
    left_ui.update()
    right_ui.update()
    overlay_ui.update()

    syncCanvasSize({ canvas, three_renderer, camera, overlay_ui })
    onCanvasEvent('resize', () => {
        syncCanvasSize({ canvas, three_renderer, camera, overlay_ui })
        overlay_ui.update()
    })

    const has_present = typeof context.present === 'function'
    let bg_position = 0

    function renderFrame() {
        bg_position += 1
        left_grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
        right_grid.style('backgroundPosition', `${-bg_position}px ${bg_position}px`)
        left_ui.update()
        right_ui.update()
        left_ui.draw()
        right_ui.draw()

        controls.update()
        three_renderer.render(scene, camera)
        overlay_ui.draw()

        if (has_present) {
            context.present()
        }

        requestAnimationFrame(renderFrame)
    }

    requestAnimationFrame(renderFrame)
}

function syncCanvasSize({ canvas, three_renderer, camera, overlay_ui }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    three_renderer.setPixelRatio(device_pixel_ratio)
    three_renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    overlay_ui.setViewport(width, height)
    overlay_ui.setDevicePixelRatio(device_pixel_ratio)
}

function createOverlayLayout({ ui, font_image, font_json }) {
    ui.fontRegister('Supercell-Magic', font_image, font_json)

    const overlay = ui.create()
    overlay.style('width', '100%')
    overlay.style('height', '100%')
    overlay.style('alignItems', 'center')
    overlay.style('padding', '24px')
    ui.root.add(overlay)

    const title = ui.create()
    title.style('fontFamily', 'Supercell-Magic')
    title.style('fontSize', '40px')
    title.style('color', '#ffffff')
    title.style('textStroke', '5px #000000')
    title.style('textShadow', '0px 4px 0px #000000')
    title.text('Dual World Space UI')
    overlay.add(title)
}

async function createLayout({ ui, loadImage, loadJson, title_text }) {
    const coin = await loadImage('assets/images/coin.png')
    const repeat_x = await loadImage('assets/images/repeat-x.png')
    const repeat_y = await loadImage('assets/images/repeat-y.png')
    const font_image = await loadImage('assets/fonts/Supercell-Magic.mtsdf.png')
    const font_json = await loadJson('assets/fonts/Supercell-Magic.mtsdf.json')

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

    return { grid, font_image, font_json }
}
