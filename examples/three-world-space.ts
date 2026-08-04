import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { loadAssets, registerAssets } from './uis/assets'
import { createBackgroundUI } from './uis/background-ui'
import { createForegroundUI } from './uis/foreground-ui'

const WORLD_HEIGHT = 2
const TEXTURE_SCALAR = window.devicePixelRatio

export async function main({
    canvas,
    onCanvasEvent,
    WebGPUSharedContext,
    UIWebGPU,
    UIThree,
    loadImage,
    loadJson,
    loadYoga,
}) {
    const device_pixel_ratio = window.devicePixelRatio
    const device_width = Math.max(canvas.clientWidth, canvas.clientHeight)
    const device_height = Math.min(canvas.clientWidth, canvas.clientHeight)
    const world_width = WORLD_HEIGHT * (device_width / device_height)

    const webgpu = await WebGPUSharedContext.create({ canvas })
    const { context, device } = webgpu
    const assets = await loadAssets({ loadImage, loadJson })
    registerAssets({ webgpu, assets })

    const overlay_ui = await UIWebGPU.create({ webgpu, loadYoga, device_pixel_ratio })

    const texture_width = Math.round(device_width * TEXTURE_SCALAR)
    const texture_height = Math.round(device_height * TEXTURE_SCALAR)
    console.log('texture_width', texture_width, 'texture_height', texture_height)
    const first_ui = await UIThree.create({
        webgpu,
        loadYoga,
        device_pixel_ratio,
        texture_width: texture_width,
        texture_height: texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
    })
    const first_plane = first_ui.plane

    const second_ui = await UIThree.create({
        webgpu,
        loadYoga,
        device_pixel_ratio,
        texture_width: texture_width,
        texture_height: texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
    })
    const second_plane = second_ui.plane

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
    second_plane.material.opacity = 1
    scene.add(second_plane)

    const floor = new THREE.GridHelper(20, 20, 0x475569, 0x263244)
    floor.position.y = -0.12
    scene.add(floor)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2))
    const light = new THREE.DirectionalLight(0xffffff, 3)
    light.position.set(3, 5, 4)
    scene.add(light)

    const second_light = new THREE.PointLight(0x60a5fa, 25, 5)
    second_light.position.set(second_plane.position.x + 0.5, second_plane.position.y + 0.5, 2)
    scene.add(second_light)

    const { grid: first_grid } = createBackgroundUI({ ui: first_ui, assets, title: 'First UI' })
    const { grid: second_grid } = createBackgroundUI({ ui: second_ui, assets, title: 'Second UI' })
    createForegroundUI({ ui: overlay_ui, assets, title: 'Three.js' })

    for (const ui of [first_ui, second_ui]) {
        ui.setViewport(device_width, device_height)
        ui.update()
    }

    syncCanvasSize({ canvas, three_renderer, camera, overlay_ui })
    onCanvasEvent('resize', () => syncCanvasSize({ canvas, three_renderer, camera, overlay_ui }))

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

        overlay_ui.update()
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
    overlay_ui.update()
}
