import * as THREE from 'three/webgpu'
import { FONT_NAME_SUPERCELL, registerAssets } from '../shared/assets'

/** CSS size of each image; it renders at that many device pixels, so it maps 1:1. */
const IMAGE_SIZE = 168
const CARD_COLOR = '#ffffff'
const SHAPES = [
    { name: 'Cube', geometry: new THREE.BoxGeometry(1.4, 1.4, 1.4) },
    { name: 'Knot', geometry: new THREE.TorusKnotGeometry(0.7, 0.25, 128, 16) },
    { name: 'Gem', geometry: new THREE.IcosahedronGeometry(1.1) },
]
const SPIN_SPEED = 0.6
const HOVER_SPIN_SPEED = 4

export async function main({ canvas, onCanvasEvent, UI, ResourcesWebGPU, loadAssets, loadYoga }) {
    const resources = await ResourcesWebGPU.create({ canvas })
    const { ui } = await UI.create({
        loadYoga,
        resources,
        device_pixel_ratio: devicePixelRatio,
    })
    const { context, device } = resources

    // Three shares uno's device, so its textures can be copied into uno's atlas.
    const three_renderer = new THREE.WebGPURenderer({ canvas, context, device, alpha: true })
    await three_renderer.init()
    // Opaque card color behind the shapes: antialiased edges blend into it, and uno gets no
    // premultiplied edges from MSAA.
    three_renderer.setClearColor(CARD_COLOR, 1)
    const image_pixels = Math.round(IMAGE_SIZE * devicePixelRatio)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10)
    camera.position.z = 4
    const material = new THREE.MeshNormalMaterial()

    const shapes = SHAPES.map(({ name, geometry }) => {
        const scene = new THREE.Scene()
        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)
        // An sRGB 8-bit target is rgba8unorm-srgb: the GPU encodes the colors as images have them.
        const target = new THREE.RenderTarget(image_pixels, image_pixels, { samples: 4 })
        target.texture.colorSpace = THREE.SRGBColorSpace
        const src = `three-${name}`
        // Without `image`, uno only reserves its place in the atlas.
        resources.registerImage(src, { width: image_pixels, height: image_pixels })
        return { name, scene, mesh, target, src, speed: SPIN_SPEED }
    })

    const assets = await loadAssets()
    registerAssets({ resources, assets })

    ui.root.style('backgroundColor', '#cfeeda')
    ui.root.style('justifyContent', 'center')
    ui.root.style('alignItems', 'center')
    ui.root.style('flexWrap', 'wrap')
    ui.root.style('gap', '24px')
    for (const shape of shapes) {
        const card = ui.create()
        card.style('alignItems', 'center')
        card.style('padding', '12px')
        card.style('backgroundColor', CARD_COLOR)
        card.style('borderRadius', '20px')
        card.style('border', '4px solid #000000')
        card.on('pointerover', () => (shape.speed = HOVER_SPIN_SPEED))
        card.on('pointerout', () => (shape.speed = SPIN_SPEED))
        ui.root.add(card)

        const image = ui.create()
        image.style('width', `${IMAGE_SIZE}px`)
        image.style('height', `${IMAGE_SIZE}px`)
        image.style('backgroundImage', shape.src)
        image.style('backgroundSize', '100% 100%')
        card.add(image)

        const label = ui.create()
        label.style('fontFamily', FONT_NAME_SUPERCELL)
        label.style('fontSize', '24px')
        label.style('color', '#000000')
        label.text(shape.name)
        card.add(label)
    }

    syncCanvasSize({ canvas, ui })
    onCanvasEvent('resize', () => syncCanvasSize({ canvas, ui }))

    let last_time = performance.now()

    function frame(time) {
        const dt = (time - last_time) / 1000
        last_time = time

        for (const { scene, mesh, target, src, speed } of shapes) {
            mesh.rotation.x += dt * speed * 0.5
            mesh.rotation.y += dt * speed
            three_renderer.setRenderTarget(target)
            three_renderer.render(scene, camera)
            resources.copyTextureToImage(src, { texture: three_renderer.backend.get(target.texture).texture })
        }
        three_renderer.setRenderTarget(null)

        ui.update()
        ui.draw({ load_op: 'clear' })
        resources.present()

        requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)

    return { uis: [ui] }
}

function syncCanvasSize({ canvas, ui }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    canvas.width = Math.max(1, Math.round(width * device_pixel_ratio))
    canvas.height = Math.max(1, Math.round(height * device_pixel_ratio))
    ui.setViewport(width, height)
    ui.setDevicePixelRatio(device_pixel_ratio)
}
