import * as THREE from 'three/webgpu'

export async function main({ canvas, onCanvasEvent, createWebGPU, createOverlayUI, loadImage, loadJson, loadYoga }) {
    const webgpu = await createWebGPU({ canvas, loadYoga })
    const { ui } = await createOverlayUI({ webgpu })
    const { device, context } = webgpu

    const three_renderer = new ThreeUIRenderer({
        canvas,
        context,
        device,
        ui,
        alpha: true,
        antialias: true,
    })
    await three_renderer.init()
    three_renderer.setClearColor(0x3a3a4d, 1)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(72, 1, 1, 100)
    camera.position.z = 4

    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const positions = geometry.getAttribute('position')
    const colors = []

    for (let i = 0; i < positions.count; i++) {
        colors.push(positions.getX(i) * 0.5 + 0.5, positions.getY(i) * 0.5 + 0.5, positions.getZ(i) * 0.5 + 0.5)
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    const cube = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true }))
    scene.add(cube)

    const { grid } = await createLayout({ ui, loadImage, loadJson })
    syncCanvasSize({ canvas, ui, three_renderer, camera })
    ui.update()

    onCanvasEvent('resize', () => {
        syncCanvasSize({ canvas, ui, three_renderer, camera })
        ui.update()
    })

    const rotation_axis = new THREE.Vector3()
    let grid_x = 0

    function frame() {
        const now = Date.now() / 1000

        rotation_axis.set(Math.sin(now), Math.cos(now), 0).normalize()
        cube.setRotationFromAxisAngle(rotation_axis, 1)

        grid_x += 1
        grid.style('backgroundPosition', `${grid_x}px ${grid_x}px`)
        ui.update()
        three_renderer.render(scene, camera)

        requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
}

class ThreeUIRenderer extends THREE.WebGPURenderer {
    constructor({ context, ui, ...options }) {
        let current_texture
        const three_context = Object.create(context)
        three_context.configure = (configuration) => context.configure(configuration)
        three_context.getCurrentTexture = () => current_texture

        super({ ...options, context: three_context })

        this.ui = ui
        this.context = context
        this.acquire_current_texture = () => {
            current_texture = context.getCurrentTexture()
        }
    }

    render(scene, camera) {
        this.acquire_current_texture()
        super.render(scene, camera)
        this.ui.draw()

        if (typeof this.context.present === 'function') {
            this.context.present()
        }
    }
}

function syncCanvasSize({ canvas, ui, three_renderer, camera }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    three_renderer.setPixelRatio(device_pixel_ratio)
    three_renderer.setSize(width, height, false)
    three_renderer.getContext()
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    ui.setViewport(width, height)
    ui.setDevicePixelRatio(device_pixel_ratio)
}

const BACKGROUND_GAP = 16
const BACKGROUND_ITEM_SIZE = 120

async function createLayout({ ui, loadImage, loadJson }) {
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
    title.text('Hello Three.js!')
    grid.add(title)

    return { grid }
}
