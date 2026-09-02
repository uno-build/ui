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
    ResourcesWebGPU,
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

    const resources = await ResourcesWebGPU.create({ canvas })
    const { context, device } = resources
    const assets = await loadAssets({ loadImage, loadJson })
    registerAssets({ resources, assets })

    const { ui: overlay_ui } = await UIWebGPU.create({ resources, loadYoga, device_pixel_ratio })

    const texture_width = Math.round(device_width * TEXTURE_SCALAR)
    const texture_height = Math.round(device_height * TEXTURE_SCALAR)
    const {
        ui: first_ui,
        plane: first_plane,
        texture: first_texture,
        material: first_material,
        geometry: first_geometry,
    } = await UIThree.create({
        resources,
        loadYoga,
        device_pixel_ratio,
        texture_width: texture_width,
        texture_height: texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
        createMaterial: () => new THREE.MeshPhongNodeMaterial(),
    })
    const {
        ui: second_ui,
        plane: second_plane,
        texture: second_texture,
        material: second_material,
        geometry: second_geometry,
    } = await UIThree.create({
        resources,
        loadYoga,
        device_pixel_ratio,
        texture_width: texture_width,
        texture_height: texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
        createMaterial: () => new THREE.MeshPhongNodeMaterial(),
    })
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

    //
    ;['pointerdown', 'pointerup', 'pointermove', 'pointercancel'].forEach((type) => {
        canvas.addEventListener(type, (e) => {
            overlay_ui.dispatchPlatformEvent(e)
            first_ui.dispatchPlatformEvent(e, { camera })
            second_ui.dispatchPlatformEvent(e, { camera })
        })
    })

    first_ui.root.on('pointerdown', (e) => {
        controls.enabled = false
    })
    first_ui.root.on('pointerup', (e) => {
        controls.enabled = true
    })
    second_ui.root.on('pointerdown', (e) => {
        controls.enabled = false
    })
    second_ui.root.on('pointerup', (e) => {
        controls.enabled = true
    })

    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.target.set(0, 0.8, 0)

    first_plane.position.set(-world_width / 2 - 0.25, 1, 0)
    first_plane.rotation.y = 0.35
    first_plane.material.side = THREE.DoubleSide
    first_plane.material.shininess = 64
    first_plane.material.specular = new THREE.Color(0xffffff)
    scene.add(first_plane)

    second_plane.position.set(world_width / 2 + 0.25, 1, 0)
    second_plane.rotation.y = -0.35
    second_plane.material.side = THREE.DoubleSide
    second_plane.material.opacity = 1
    second_plane.material.shininess = 64
    second_plane.material.specular = new THREE.Color(0xffffff)
    scene.add(second_plane)

    const floor = new THREE.GridHelper(20, 20, 0x475569, 0x263244)
    floor.position.y = -0.12
    scene.add(floor)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2))
    const light = new THREE.DirectionalLight(0xffffff, 3)
    light.position.set(3, 5, 4)
    scene.add(light)

    const second_light = new THREE.PointLight(0x60a5fa, 30, 4.2)
    second_light.position.set(second_plane.position.x - 0.5, second_plane.position.y + 0.5, 2)
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

    let bg_position = 0

    function renderFrame() {
        bg_position += 1

        first_grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
        first_ui.update()
        first_ui.draw()

        second_grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
        second_ui.update()
        second_ui.draw()

        controls.update()
        three_renderer.render(scene, camera)

        overlay_ui.update()
        overlay_ui.draw()

        resources.present()

        requestAnimationFrame(renderFrame)
    }

    // setTimeout(() => {
    //     scene.remove(second_plane)
    //     second_texture.dispose()
    //     second_material.dispose()
    //     second_geometry.dispose()
    //     second_ui.destroy()

    //     scene.remove(first_plane)
    //     first_texture.dispose()
    //     first_material.dispose()
    //     first_geometry.dispose()
    //     first_ui.destroy()

    //     overlay_ui.destroy()
    //     resources.dispose()
    // }, 10000)

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
