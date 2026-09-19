import * as THREE from 'three/webgpu'
import { loadAssets, registerAssets } from '../shared/assets'
import { createBackgroundUI } from '../shared/uis/background-ui'
import { createForegroundUI } from '../shared/uis/foreground-ui'

export async function main({ canvas, onCanvasEvent, UI, ResourcesWebGPU, loadImage, loadJson }) {
    const resources = await ResourcesWebGPU.create({ canvas })
    const { ui: background_ui } = await UI.create({
        resources,
        device_pixel_ratio: devicePixelRatio,
    })
    const { ui: foreground_ui } = await UI.create({
        resources,
        device_pixel_ratio: devicePixelRatio,
    })
    const { context, device } = resources

    const three_renderer = new THREE.WebGPURenderer({
        canvas,
        context,
        device,
        alpha: true,
    })
    three_renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    three_renderer.autoClearColor = false
    await three_renderer.init()

    // Scene logic
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

    const assets = await loadAssets({ loadImage, loadJson })
    registerAssets({ resources, assets })
    const { grid } = createBackgroundUI({ ui: background_ui, assets, background_color: '#cfeeda' })
    createForegroundUI({ ui: foreground_ui, assets, title: 'Hello Three.js!' })
    syncCanvasSize({ canvas, background_ui, foreground_ui, three_renderer, camera })
    background_ui.update()
    foreground_ui.update()

    // Event handling
    onCanvasEvent('resize', () => {
        syncCanvasSize({ canvas, background_ui, foreground_ui, three_renderer, camera })
        background_ui.update()
        foreground_ui.update()
    })

    const rotation_axis = new THREE.Vector3()
    let bg_position = 0

    function frame() {
        // Background UI
        bg_position += 1
        grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
        background_ui.update()
        background_ui.draw({ load_op: 'clear' })

        // Three
        const now = Date.now() / 1000
        rotation_axis.set(Math.sin(now), Math.cos(now), 0).normalize()
        cube.setRotationFromAxisAngle(rotation_axis, 1)
        three_renderer.render(scene, camera)

        // Foreground UI
        foreground_ui.update()
        foreground_ui.draw()

        resources.present()

        requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
}

function syncCanvasSize({ canvas, background_ui, foreground_ui, three_renderer, camera }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    three_renderer.setPixelRatio(device_pixel_ratio)
    three_renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    for (const ui of [background_ui, foreground_ui]) {
        ui.setViewport(width, height)
        ui.setDevicePixelRatio(device_pixel_ratio)
    }
}
