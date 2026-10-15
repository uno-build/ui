import {
    AmbientLight,
    DirectionalLight,
    FlatMaterial,
    Geometry3D,
    Mesh3D,
    PhongMaterial,
    PointLight,
    View3D,
} from '@pixi/3d'
import { OrbitCamera } from '@pixi/3d/extras'
import { Container, WebGPURenderer } from 'pixi.js'
import { registerAssets } from '../shared/assets'
import { createBackgroundUI } from '../shared/uis/background-ui'
import { createForegroundUI } from '../shared/uis/foreground-ui'

const WORLD_HEIGHT = 2
const TEXTURE_SCALAR = window.devicePixelRatio

export async function main({ canvas, onCanvasEvent, ResourcesWebGPU, UI, UIPixi3D, loadAssets, loadYoga }) {
    const device_pixel_ratio = window.devicePixelRatio
    const device_width = Math.max(canvas.clientWidth, canvas.clientHeight)
    const device_height = Math.min(canvas.clientWidth, canvas.clientHeight)
    const world_width = WORLD_HEIGHT * (device_width / device_height)

    // Pixi creates the device because pixi3d needs the features it requests, like 'indirect-first-instance'.
    const pixi_renderer = new WebGPURenderer()
    await pixi_renderer.init({
        canvas,
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        resolution: device_pixel_ratio,
        background: 0x111827,
        antialias: true,
    })

    const resources = await ResourcesWebGPU.create({
        canvas,
        adapter: pixi_renderer.gpu.adapter,
        device: pixi_renderer.gpu.device,
    })
    const assets = await loadAssets()
    registerAssets({ resources, assets })

    const { ui: overlay_ui } = await UI.create({ loadYoga, resources, device_pixel_ratio })

    const texture_width = Math.round(device_width * TEXTURE_SCALAR)
    const texture_height = Math.round(device_height * TEXTURE_SCALAR)
    const { ui: first_ui, plane: first_plane } = await UIPixi3D.create({
        loadYoga,
        pixi_renderer,
        resources,
        device_pixel_ratio,
        texture_width,
        texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
        createMaterial: () => new PhongMaterial({ doubleSided: true, shininess: 64, specularColor: 0xffffff }),
    })
    const { ui: second_ui, plane: second_plane } = await UIPixi3D.create({
        loadYoga,
        pixi_renderer,
        resources,
        device_pixel_ratio,
        texture_width,
        texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
        createMaterial: () => new PhongMaterial({ doubleSided: true, shininess: 64, specularColor: 0xffffff }),
    })

    const stage = new Container()
    const view = new View3D({ autoResize: true, toneMapping: 'none', eventMode: 'static' })
    stage.addChild(view)

    view.camera.fov = 60
    view.camera.near = 0.1
    view.camera.far = 100
    view.camera.position.set(0, 3.5, 9)

    const controls = new OrbitCamera({ view, target: { x: 0, y: 0.8, z: 0 }, enableDamping: true })

    first_ui.setCamera(view)
    second_ui.setCamera(view)

    first_ui.root.on('pointerdown', () => {
        controls.enabled = false
    })
    first_ui.root.on('pointerup', () => {
        controls.enabled = true
    })
    second_ui.root.on('pointerdown', () => {
        controls.enabled = false
    })
    second_ui.root.on('pointerup', () => {
        controls.enabled = true
    })

    first_plane.position.set(-world_width / 2 - 0.25, 1, 0)
    first_plane.rotation.y = 0.35
    view.root.addChild(first_plane)

    second_plane.position.set(world_width / 2 + 0.25, 1, 0)
    second_plane.rotation.y = -0.35
    view.root.addChild(second_plane)

    const grid_positions = []
    for (let position = -10; position <= 10; position++) {
        grid_positions.push(position, -0.12, -10, position, -0.12, 10)
        grid_positions.push(-10, -0.12, position, 10, -0.12, position)
    }
    const grid_material = new FlatMaterial({ baseColor: 0x475569 })
    // A flat material skips the view's output encode, which leaves its linear base color too dark.
    grid_material.toneMapped = true
    const grid = new Mesh3D({
        geometry: new Geometry3D({ positions: new Float32Array(grid_positions), topology: 'line-list' }),
        material: grid_material,
    })
    view.root.addChild(grid)

    view.root.addChild(new AmbientLight({ color: 0x334155, intensity: 2 }))

    const light = new DirectionalLight({ intensity: 3 })
    light.position.set(3, 5, 4)
    light.lookAt({ x: 0, y: 0, z: 0 })
    view.root.addChild(light)

    const second_light = new PointLight({ color: 0x60a5fa, intensity: 30, range: 4.2 })
    second_light.position.set(second_plane.position.x - 0.5, second_plane.position.y + 0.5, 2)
    view.root.addChild(second_light)

    const { grid: first_grid } = createBackgroundUI({ ui: first_ui, assets, title: 'First UI' })
    const { grid: second_grid } = createBackgroundUI({ ui: second_ui, assets, title: 'Second UI' })
    createForegroundUI({ ui: overlay_ui, assets, title: 'Pixi3D' })

    for (const ui of [first_ui, second_ui]) {
        ui.setViewport(device_width, device_height)
        ui.update()
    }

    syncCanvasSize({ canvas, pixi_renderer, overlay_ui })
    onCanvasEvent('resize', () => syncCanvasSize({ canvas, pixi_renderer, overlay_ui }))

    let bg_position = 0

    function renderFrame() {
        bg_position += 1

        first_grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
        first_ui.update()
        first_ui.draw()

        second_grid.style('backgroundPosition', `${-bg_position}px ${bg_position}px`)
        second_ui.update()
        second_ui.draw()

        pixi_renderer.render({ container: stage })

        overlay_ui.update()
        overlay_ui.draw()

        resources.present()

        requestAnimationFrame(renderFrame)
    }

    requestAnimationFrame(renderFrame)

    return { uis: [overlay_ui, first_ui, second_ui] }
}

function syncCanvasSize({ canvas, pixi_renderer, overlay_ui }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    pixi_renderer.resize(width, height, device_pixel_ratio)
    overlay_ui.setViewport(width, height)
    overlay_ui.setDevicePixelRatio(device_pixel_ratio)
    overlay_ui.update()
}
