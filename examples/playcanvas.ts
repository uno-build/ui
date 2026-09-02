import {
    AppBase,
    AppOptions,
    BoxGeometry,
    CameraComponentSystem,
    Color,
    ContainerHandler,
    Entity,
    FILLMODE_FILL_WINDOW,
    Mesh,
    MeshInstance,
    RESOLUTION_AUTO,
    RenderComponentSystem,
    StandardMaterial,
    TextureHandler,
    Vec3,
    createGraphicsDevice,
} from 'playcanvas'
import { PLATFORM_EVENT_NAMES } from '../src/events/const'
import { loadAssets, registerAssets } from './uis/assets'
import { createBackgroundUI } from './uis/background-ui'
import { createForegroundUI } from './uis/foreground-ui'

export async function main({ canvas, onCanvasEvent, UIWebGPU, ResourcesWebGPU, loadImage, loadJson, loadYoga }) {
    const gfxOptions = {
        deviceTypes: ['webgpu'],
        antialias: false,
        alpha: true,
    }

    const graphics_device = await createGraphicsDevice(canvas, gfxOptions)
    graphics_device.maxPixelRatio = Math.min(devicePixelRatio, 2)

    const resources = await ResourcesWebGPU.create({
        canvas,
        device: graphics_device.wgpu,
        context: graphics_device.gpuContext,
        format: graphics_device.canvasConfig.format,
    })
    const device_pixel_ratio = graphics_device.maxPixelRatio
    const { ui: background_ui } = await UIWebGPU.create({ resources, loadYoga, device_pixel_ratio })
    const { ui: foreground_ui } = await UIWebGPU.create({ resources, loadYoga, device_pixel_ratio })

    const createOptions = new AppOptions()
    createOptions.graphicsDevice = graphics_device

    createOptions.componentSystems = [RenderComponentSystem, CameraComponentSystem]
    createOptions.resourceHandlers = [TextureHandler, ContainerHandler]

    const app = new AppBase(canvas)
    app.init(createOptions)

    // Set the canvas to fill the window and automatically change resolution to be the same as the canvas size
    app.setCanvasFillMode(FILLMODE_FILL_WINDOW)
    app.setCanvasResolution(RESOLUTION_AUTO)

    // Create box entity
    const box_geometry = new BoxGeometry({ halfExtents: new Vec3(1, 1, 1) })
    const colors = new Float32Array((box_geometry.positions.length / 3) * 4)

    for (let i = 0; i < box_geometry.positions.length / 3; i++) {
        const position_index = i * 3
        const color_index = i * 4
        colors[color_index] = box_geometry.positions[position_index] * 0.5 + 0.5
        colors[color_index + 1] = box_geometry.positions[position_index + 1] * 0.5 + 0.5
        colors[color_index + 2] = box_geometry.positions[position_index + 2] * 0.5 + 0.5
        colors[color_index + 3] = 1
    }

    const box_mesh = new Mesh(graphics_device)
    box_mesh.setPositions(box_geometry.positions)
    box_mesh.setNormals(box_geometry.normals)
    box_mesh.setColors(colors)
    box_mesh.setIndices(box_geometry.indices)
    box_mesh.update()

    const box_material = new StandardMaterial()
    box_material.useLighting = false
    box_material.emissive = new Color(1, 1, 1)
    box_material.emissiveVertexColor = true

    const box = new Entity('cube')
    box.addComponent('render', {
        meshInstances: [new MeshInstance(box_mesh, box_material)],
    })
    app.root.addChild(box)

    // Create camera entity
    const camera = new Entity('camera')
    camera.addComponent('camera', {
        clearColorBuffer: false,
        fov: 72,
        nearClip: 1,
        farClip: 100,
    })
    app.root.addChild(camera)
    camera.setPosition(0, 0, 4)

    const assets = await loadAssets({ loadImage, loadJson })
    registerAssets({ resources, assets })
    const { grid } = createBackgroundUI({ ui: background_ui, assets, background_color: '#d2e5f7' })
    createForegroundUI({ ui: foreground_ui, assets, title: 'Hello PlayCanvas!' })
    syncCanvasSize({ canvas, app, graphics_device, background_ui, foreground_ui })
    background_ui.update()
    foreground_ui.update()

    // Event handling
    PLATFORM_EVENT_NAMES.forEach((type) => {
        canvas.addEventListener(type, (e) => {
            background_ui.dispatchPlatformEvent(e)
            foreground_ui.dispatchPlatformEvent(e)
        })
    })
    onCanvasEvent('resize', () => {
        syncCanvasSize({ canvas, app, graphics_device, background_ui, foreground_ui })
        background_ui.update()
        foreground_ui.update()
    })

    const context = graphics_device.gpuContext
    const rotation_sin = Math.sin(0.5)
    const rotation_cos = Math.cos(0.5)
    let bg_position = 0

    app.on('update', () => {
        const now = Date.now() / 1000
        box.setRotation(Math.sin(now) * rotation_sin, Math.cos(now) * rotation_sin, 0, rotation_cos)
    })

    app.on('prerender', () => {
        bg_position += 1
        grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
        background_ui.update()
        background_ui.draw({
            submit: false,
            command_encoder: graphics_device.getCommandEncoder(),
            texture_view: graphics_device.backBuffer.impl.assignedColorTexture.createView(),
            load_op: 'clear',
        })
    })

    app.on('postrender', () => {
        foreground_ui.update()
        foreground_ui.draw({
            submit: false,
            command_encoder: graphics_device.getCommandEncoder(),
            texture_view: graphics_device.backBuffer.impl.assignedColorTexture.createView(),
        })
    })

    app.on('frameend', () => resources.present())
    app.start()
}

function syncCanvasSize({ canvas, app, graphics_device, background_ui, foreground_ui }) {
    const device_pixel_ratio = graphics_device.maxPixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    app.resizeCanvas()

    for (const ui of [background_ui, foreground_ui]) {
        ui.setViewport(width, height)
        ui.setDevicePixelRatio(device_pixel_ratio)
    }
}
