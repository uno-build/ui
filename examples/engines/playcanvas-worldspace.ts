import {
    AppBase,
    AppOptions,
    CameraComponentSystem,
    Color,
    ContainerHandler,
    Entity,
    FILLMODE_FILL_WINDOW,
    InputFrame,
    LIGHTFALLOFF_INVERSESQUARED,
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
import { PLATFORM_EVENT_NAMES } from '../../src/events/constants'
import { loadAssets, registerAssets } from '../shared/assets'
import { createBackgroundUI } from '../shared/uis/background-ui'
import { createForegroundUI } from '../shared/uis/foreground-ui'

const WORLD_HEIGHT = 2
const TEXTURE_SCALAR = window.devicePixelRatio

export async function main({
    canvas,
    onCanvasEvent,
    UIPlayCanvas,
    UI,
    ResourcesWebGPU,
    loadImage,
    loadJson,
}) {
    const gfx_options = {
        deviceTypes: ['webgpu'],
        antialias: true,
        alpha: true,
    }
    const graphics_device = await createGraphicsDevice(canvas, gfx_options)
    graphics_device.maxPixelRatio = Math.min(devicePixelRatio, 2)

    const resources = await ResourcesWebGPU.create({
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
    app.scene.lighting.shadowsEnabled = false

    const device_pixel_ratio = graphics_device.maxPixelRatio
    const device_width = Math.max(canvas.clientWidth, canvas.clientHeight)
    const device_height = Math.min(canvas.clientWidth, canvas.clientHeight)
    const world_width = WORLD_HEIGHT * (device_width / device_height)

    const assets = await loadAssets({ loadImage, loadJson })
    registerAssets({ resources, assets })
    const { ui: overlay_ui } = await UI.create({ resources, device_pixel_ratio })

    const texture_width = Math.round(device_width * TEXTURE_SCALAR)
    const texture_height = Math.round(device_height * TEXTURE_SCALAR)
    const { ui: first_ui, plane: first_plane } = await UIPlayCanvas.create({
        app,
        resources,
        device_pixel_ratio,
        texture_width,
        texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
    })
    const { ui: second_ui, plane: second_plane } = await UIPlayCanvas.create({
        app,
        resources,
        device_pixel_ratio,
        texture_width,
        texture_height,
        world_width,
        world_height: WORLD_HEIGHT,
    })

    first_plane.setPosition(-world_width / 2 - 0.25, 1, 0)
    first_plane.setLocalEulerAngles(0, 20, 0)
    app.root.addChild(first_plane)

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
        intensity: 2,
        range: 5,
        falloffMode: LIGHTFALLOFF_INVERSESQUARED,
    })
    point_light.setPosition(second_plane.getPosition().x + 0.5, second_plane.getPosition().y + 0.5, 2)
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

    let camera_controls_enabled = true
    const touch_source = new MultiTouchSource()
    touch_source.attach(canvas)
    const mouse_buttons = [false, false, false]
    let mouse_x = 0
    let mouse_y = 0
    let mouse_wheel = 0

    onCanvasEvent('pointerdown', (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return
        canvas.setPointerCapture(event.pointerId)
        setMouseButtons(mouse_buttons, event.buttons)
    })
    onCanvasEvent('pointermove', (event: PointerEvent) => {
        if (!camera_controls_enabled || event.pointerType !== 'mouse' || event.buttons === 0) return
        mouse_x += event.movementX
        mouse_y += event.movementY
    })
    onCanvasEvent('pointerup', (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return
        canvas.releasePointerCapture(event.pointerId)
        setMouseButtons(mouse_buttons, event.buttons)
    })
    onCanvasEvent('wheel', (event: WheelEvent) => {
        event.preventDefault()
        if (!camera_controls_enabled) return
        mouse_wheel += event.deltaY
    })
    onCanvasEvent('contextmenu', (event: MouseEvent) => event.preventDefault())

    const orbit_controller = new OrbitController()
    orbit_controller.pitchRange = new Vec2(-85, 85)
    orbit_controller.attach(new Pose().look(camera.getPosition(), new Vec3(0, 0.8, 0)), false)
    const orbit_frame = new InputFrame({ move: [0, 0, 0], rotate: [0, 0] })
    let touch_count = 0

    // Event handling
    PLATFORM_EVENT_NAMES.forEach((type) => {
        canvas.addEventListener(type, (e) => {
            overlay_ui.dispatchPlatformEvent(e)
            first_ui.dispatchPlatformEvent(e, { camera })
            second_ui.dispatchPlatformEvent(e, { camera })
        })
    })
    first_ui.root.on('pointerdown', () => {
        camera_controls_enabled = false
    })
    first_ui.root.on('pointerup', () => {
        camera_controls_enabled = true
    })
    second_ui.root.on('pointerdown', () => {
        camera_controls_enabled = false
    })
    second_ui.root.on('pointerup', () => {
        camera_controls_enabled = true
    })

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
    let bg_position = 0

    app.on('update', (delta_time) => {
        const touch_input = touch_source.read()
        touch_count += touch_input.count[0]

        const move: [number, number, number] = [0, 0, mouse_wheel * 0.001]
        const rotate: [number, number] = [0, 0]

        if (camera_controls_enabled) {
            if (mouse_buttons[0]) {
                rotate[0] += mouse_x * 0.2
                rotate[1] += mouse_y * 0.2
            } else if (mouse_buttons[1] || mouse_buttons[2]) {
                move[0] -= mouse_x * 0.005
                move[1] += mouse_y * 0.005
            } else if (touch_count === 1) {
                rotate[0] += touch_input.touch[0] * 0.2
                rotate[1] += touch_input.touch[1] * 0.2
            } else if (touch_count === 2) {
                move[0] -= touch_input.touch[0] * 0.005
                move[1] += touch_input.touch[1] * 0.005
                move[2] += touch_input.pinch[0] * 0.003
            }
        }

        mouse_x = 0
        mouse_y = 0
        mouse_wheel = 0

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

    app.on('frameend', () => resources.present())
    app.start()
}

function setMouseButtons(mouse_buttons: boolean[], buttons: number) {
    mouse_buttons[0] = (buttons & 1) !== 0
    mouse_buttons[1] = (buttons & 4) !== 0
    mouse_buttons[2] = (buttons & 2) !== 0
}

function syncCanvasSize({ canvas, app, graphics_device, overlay_ui }) {
    graphics_device.maxPixelRatio = Math.min(window.devicePixelRatio, 2)
    app.resizeCanvas()

    overlay_ui.setViewport(canvas.clientWidth, canvas.clientHeight)
    overlay_ui.setDevicePixelRatio(graphics_device.maxPixelRatio)
    overlay_ui.update()
}
