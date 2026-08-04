import {
    AppBase,
    AppOptions,
    CameraComponentSystem,
    Color,
    ContainerHandler,
    Entity,
    FILLMODE_FILL_WINDOW,
    InputFrame,
    KeyboardMouseSource,
    LightComponentSystem,
    Mesh,
    MeshInstance,
    MultiTouchSource,
    OrbitController,
    Pose,
    PRIMITIVE_LINES,
    RESOLUTION_AUTO,
    RenderComponentSystem,
    StandardMaterial,
    TextureHandler,
    Vec2,
    Vec3,
    createGraphicsDevice,
} from 'playcanvas'
import { loadAssets, registerAssets } from './uis/assets'
import { createBackgroundUI } from './uis/background-ui'
import { createForegroundUI } from './uis/foreground-ui'

const WORLD_HEIGHT = 2
const TEXTURE_SCALAR = window.devicePixelRatio

export async function main({
    canvas,
    onCanvasEvent,
    UIPlaycanvas,
    UIWebGPU,
    WebGPUResources,
    loadImage,
    loadJson,
    loadYoga,
}) {
    const gfx_options = {
        deviceTypes: ['webgpu'],
        antialias: true,
        alpha: true,
    }
    const graphics_device = await createGraphicsDevice(canvas, gfx_options)
    graphics_device.maxPixelRatio = Math.min(devicePixelRatio, 2)

    const webgpu = await WebGPUResources.create({
        canvas,
        device: graphics_device.wgpu,
        context: graphics_device.gpuContext,
        format: graphics_device.canvasConfig.format,
    })

    const create_options = new AppOptions()
    create_options.graphicsDevice = graphics_device
    create_options.componentSystems = [RenderComponentSystem, CameraComponentSystem, LightComponentSystem]
    create_options.resourceHandlers = [TextureHandler, ContainerHandler]

    const app = new AppBase(canvas)
    app.init(create_options)
    app.setCanvasFillMode(FILLMODE_FILL_WINDOW)
    app.setCanvasResolution(RESOLUTION_AUTO)
    app.scene.ambientLight = new Color(0.2, 0.25, 0.35)

    const device_pixel_ratio = graphics_device.maxPixelRatio
    const device_width = Math.max(canvas.clientWidth, canvas.clientHeight)
    const device_height = Math.min(canvas.clientWidth, canvas.clientHeight)
    const world_width = WORLD_HEIGHT * (device_width / device_height)

    const assets = await loadAssets({ loadImage, loadJson })
    registerAssets({ webgpu, assets })
    const overlay_ui = await UIWebGPU.create({ webgpu, loadYoga, device_pixel_ratio })

    const texture_width = Math.round(device_width * TEXTURE_SCALAR)
    const texture_height = Math.round(device_height * TEXTURE_SCALAR)
    const first_ui = await UIPlaycanvas.create({
        app,
        webgpu,
        loadYoga,
        device_pixel_ratio,
        texture_width,
        texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
    })
    const second_ui = await UIPlaycanvas.create({
        app,
        webgpu,
        loadYoga,
        device_pixel_ratio,
        texture_width,
        texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
    })

    const first_plane = first_ui.plane
    first_plane.setPosition(-world_width / 2 - 0.25, 1, 0)
    first_plane.setLocalEulerAngles(0, 20, 0)
    app.root.addChild(first_plane)

    const second_plane = second_ui.plane
    second_plane.setPosition(world_width / 2 + 0.25, 1, 0)
    second_plane.setLocalEulerAngles(0, -20, 0)
    app.root.addChild(second_plane)

    const grid_positions = []
    for (let position = -10; position <= 10; position++) {
        grid_positions.push(position, -0.12, -10, position, -0.12, 10)
        grid_positions.push(-10, -0.12, position, 10, -0.12, position)
    }

    const grid_mesh = new Mesh(graphics_device)
    grid_mesh.setPositions(grid_positions)
    grid_mesh.update(PRIMITIVE_LINES)

    const grid_material = new StandardMaterial()
    grid_material.useLighting = false
    grid_material.emissive = new Color(0.278, 0.333, 0.412)

    const grid = new Entity('grid', app)
    grid.addComponent('render', {
        meshInstances: [new MeshInstance(grid_mesh, grid_material)],
    })
    app.root.addChild(grid)

    const directional_light = new Entity('directional-light', app)
    directional_light.addComponent('light', {
        type: 'directional',
        color: new Color(1, 1, 1),
        intensity: 3,
    })
    directional_light.setLocalEulerAngles(45, -30, 0)
    app.root.addChild(directional_light)

    const point_light = new Entity('point-light', app)
    point_light.addComponent('light', {
        type: 'omni',
        color: new Color(0.376, 0.647, 0.98),
        intensity: 25,
        range: 4.75,
    })
    point_light.setPosition(second_plane.getPosition().x, second_plane.getPosition().y + 0.5, 2)
    app.root.addChild(point_light)

    const camera = new Entity('camera', app)
    camera.addComponent('camera', {
        clearColor: new Color(0.067, 0.094, 0.153),
        fov: 60,
        nearClip: 0.1,
        farClip: 100,
    })
    camera.setPosition(0, 3.5, 9)
    camera.lookAt(0, 0.8, 0)
    app.root.addChild(camera)

    const mouse_source = new KeyboardMouseSource()
    mouse_source.attach(canvas)
    const touch_source = new MultiTouchSource()
    touch_source.attach(canvas)

    const orbit_controller = new OrbitController()
    orbit_controller.pitchRange = new Vec2(-85, 85)
    orbit_controller.attach(new Pose().look(camera.getPosition(), new Vec3(0, 0.8, 0)), false)
    const orbit_frame = new InputFrame({ move: [0, 0, 0], rotate: [0, 0] })
    let touch_count = 0

    const { grid: first_grid } = createBackgroundUI({ ui: first_ui, assets, title: 'First UI' })
    const { grid: second_grid } = createBackgroundUI({ ui: second_ui, assets, title: 'Second UI' })
    createForegroundUI({ ui: overlay_ui, assets, title: 'PlayCanvas' })

    for (const ui of [first_ui, second_ui]) {
        ui.setViewport(device_width, device_height)
        ui.update()
    }

    syncCanvasSize({ canvas, app, graphics_device, overlay_ui })
    onCanvasEvent('resize', () => syncCanvasSize({ canvas, app, graphics_device, overlay_ui }))

    const context = graphics_device.gpuContext
    const has_present = typeof context.present === 'function'
    let bg_position = 0

    app.on('update', (delta_time) => {
        const mouse_input = mouse_source.read()
        const touch_input = touch_source.read()
        touch_count += touch_input.count[0]

        const move = [0, 0, mouse_input.wheel[0] * 0.001]
        const rotate = [0, 0]

        if (mouse_source._button[0] === 1) {
            rotate[0] += mouse_input.mouse[0] * 0.2
            rotate[1] += mouse_input.mouse[1] * 0.2
        } else if (mouse_source._button[1] === 1 || mouse_source._button[2] === 1) {
            move[0] -= mouse_input.mouse[0] * 0.005
            move[1] += mouse_input.mouse[1] * 0.005
        }

        if (touch_count === 1) {
            rotate[0] += touch_input.touch[0] * 0.2
            rotate[1] += touch_input.touch[1] * 0.2
        } else if (touch_count === 2) {
            move[0] -= touch_input.touch[0] * 0.005
            move[1] += touch_input.touch[1] * 0.005
            move[2] += touch_input.pinch[0] * 0.003
        }

        orbit_frame.deltas.move.append(move)
        orbit_frame.deltas.rotate.append(rotate)
        const pose = orbit_controller.update(orbit_frame, delta_time)
        camera.setPosition(pose.position)
        camera.setEulerAngles(pose.angles)
    })

    app.on('prerender', () => {
        bg_position += 1
        first_grid.style('backgroundPosition', `${bg_position}px ${bg_position}px`)
        second_grid.style('backgroundPosition', `${-bg_position}px ${bg_position}px`)

        const command_encoder = graphics_device.getCommandEncoder()
        first_ui.update()
        first_ui.draw({ submit: false, command_encoder })
        second_ui.update()
        second_ui.draw({ submit: false, command_encoder })
    })

    app.on('postrender', () => {
        overlay_ui.update()
        overlay_ui.draw({
            submit: false,
            command_encoder: graphics_device.getCommandEncoder(),
            texture_view: graphics_device.backBuffer.impl.assignedColorTexture.createView(),
        })
    })

    if (has_present) {
        app.on('frameend', () => context.present())
    }

    app.start()
}

function syncCanvasSize({ canvas, app, graphics_device, overlay_ui }) {
    const device_pixel_ratio = graphics_device.maxPixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    app.resizeCanvas()
    overlay_ui.setViewport(width, height)
    overlay_ui.setDevicePixelRatio(device_pixel_ratio)
    overlay_ui.update()
}
