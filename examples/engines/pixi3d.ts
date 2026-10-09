import { CubeGeometry, FlatMaterial, Geometry3D, Mesh3D, Vector3, View3D } from '@pixi/3d'
import '@pixi/3d/webgpu'
import { Container, WebGPURenderer } from 'pixi.js'
import { registerAssets } from '../shared/assets'
import { createBackgroundUI } from '../shared/uis/background-ui'
import { createForegroundUI } from '../shared/uis/foreground-ui'

export async function main({ canvas, onCanvasEvent, UI, ResourcesWebGPU, loadAssets, loadYoga }) {
    const device_pixel_ratio = window.devicePixelRatio

    // Pixi creates the device because pixi3d needs the features it requests, like 'indirect-first-instance'.
    // The renderer skips the browser extensions, and with them the lazy import of pixi3d's WebGPU backend,
    // which is imported above.
    const pixi_renderer = new WebGPURenderer()
    await pixi_renderer.init({
        canvas,
        resolution: device_pixel_ratio,
        backgroundAlpha: 0,
        clearBeforeRender: false,
        // An antialiased canvas renders into pixi's own MSAA texture and resolves over the canvas, which hides
        // the background UI and keeps the previous frames, since pixi loads instead of clearing.
        antialias: false,
        skipExtensionImports: true,
    })

    const resources = await ResourcesWebGPU.create({
        canvas,
        adapter: pixi_renderer.gpu.adapter,
        device: pixi_renderer.gpu.device,
    })
    const { ui: background_ui } = await UI.create({ loadYoga, resources, device_pixel_ratio })
    const { ui: foreground_ui } = await UI.create({ loadYoga, resources, device_pixel_ratio })

    // Scene logic
    const stage = new Container()
    const view = new View3D({ autoResize: true, toneMapping: 'none' })
    stage.addChild(view)

    view.camera.fov = 72
    view.camera.near = 1
    view.camera.far = 100
    view.camera.position.set(0, 0, 4)

    const cube_geometry = new CubeGeometry({ width: 2, height: 2, depth: 2 })
    const positions = cube_geometry.attributes.aPosition.buffer.data
    const colors = new Float32Array((positions.length / 3) * 4)

    for (let i = 0; i < positions.length / 3; i++) {
        colors[i * 4] = positions[i * 3] * 0.5 + 0.5
        colors[i * 4 + 1] = positions[i * 3 + 1] * 0.5 + 0.5
        colors[i * 4 + 2] = positions[i * 3 + 2] * 0.5 + 0.5
        colors[i * 4 + 3] = 1
    }

    const material = new FlatMaterial()
    material.vertexColors = true
    const cube = new Mesh3D({
        geometry: new Geometry3D({ positions, colors, indices: cube_geometry.indexBuffer.data }),
        material,
    })
    view.root.addChild(cube)

    const assets = await loadAssets()
    registerAssets({ resources, assets })
    const { grid } = createBackgroundUI({ ui: background_ui, assets, background_color: '#f4e3cf' })
    createForegroundUI({ ui: foreground_ui, assets, title: 'Hello Pixi3D!' })
    syncCanvasSize({ canvas, pixi_renderer, background_ui, foreground_ui })
    background_ui.update()
    foreground_ui.update()

    // Event handling
    onCanvasEvent('resize', () => {
        syncCanvasSize({ canvas, pixi_renderer, background_ui, foreground_ui })
        background_ui.update()
        foreground_ui.update()
    })

    const rotation_axis = new Vector3()
    let bg_position = 0

    function frame() {
        // Background UI
        bg_position += 1
        grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
        background_ui.update()
        background_ui.draw({ load_op: 'clear' })

        // Pixi3D
        const now = Date.now() / 1000
        rotation_axis.set(Math.sin(now), Math.cos(now), 0).normalize()
        cube.quaternion.setFromAxisAngle(rotation_axis, 1)
        pixi_renderer.render({ container: stage, clear: false })

        // Foreground UI
        foreground_ui.update()
        foreground_ui.draw()

        resources.present()

        requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)

    return { uis: [background_ui, foreground_ui] }
}

function syncCanvasSize({ canvas, pixi_renderer, background_ui, foreground_ui }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    pixi_renderer.resize(width, height, device_pixel_ratio)

    for (const ui of [background_ui, foreground_ui]) {
        ui.setViewport(width, height)
        ui.setDevicePixelRatio(device_pixel_ratio)
    }
}
