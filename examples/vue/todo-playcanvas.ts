import {
    AppBase,
    AppOptions,
    CameraComponentSystem,
    Color,
    ContainerHandler,
    Entity,
    FILLMODE_FILL_WINDOW,
    InputFrame,
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
import { registerRootComponent } from '../../src/components/vue'
import VueTodo, { loadResources } from './todo.vue'

// The Todo card is 620x640 and the page pads it by PAGE_PADDING on every side.
const PAGE_PADDING = 32
const UI_WIDTH = 620 + PAGE_PADDING * 2
const UI_HEIGHT = 640 + PAGE_PADDING * 2
const WORLD_HEIGHT = 2
const WORLD_WIDTH = WORLD_HEIGHT * (UI_WIDTH / UI_HEIGHT)
const WORLD_PAGE_PADDING = (PAGE_PADDING / UI_HEIGHT) * WORLD_HEIGHT
const FLOOR_Y = -0.12
// That padding is transparent, so the plane drops by it for the card itself to land on the grid.
const PANEL_Y = FLOOR_Y + WORLD_HEIGHT / 2 - WORLD_PAGE_PADDING
const TEXTURE_SCALAR = window.devicePixelRatio

export async function main({ canvas, onCanvasEvent, ResourcesWebGPU, UIPlayCanvas }) {
    const gfx_options = {
        deviceTypes: ['webgpu'],
        antialias: true,
        alpha: true,
    }
    const graphics_device = await createGraphicsDevice(canvas, gfx_options)
    graphics_device.maxPixelRatio = Math.min(window.devicePixelRatio, 2)

    const resources = await ResourcesWebGPU.create({
        canvas,
        device: graphics_device.wgpu,
        context: graphics_device.gpuContext,
        format: graphics_device.canvasConfig.format,
    })
    await loadResources(resources)

    const create_options = new AppOptions()
    create_options.graphicsDevice = graphics_device
    create_options.componentSystems = [RenderComponentSystem, CameraComponentSystem]
    create_options.resourceHandlers = [TextureHandler, ContainerHandler]

    const app = new AppBase(canvas)
    app.init(create_options)
    app.setCanvasFillMode(FILLMODE_FILL_WINDOW)
    app.setCanvasResolution(RESOLUTION_AUTO)
    app.scene.ambientLight = new Color(1, 1, 1)

    const device_pixel_ratio = TEXTURE_SCALAR
    const texture_width = Math.round(UI_WIDTH * TEXTURE_SCALAR)
    const texture_height = Math.round(UI_HEIGHT * TEXTURE_SCALAR)
    const { ui, plane } = await UIPlayCanvas.create({
        app,
        resources,
        device_pixel_ratio,
        texture_width,
        texture_height,
        world_width: WORLD_WIDTH,
        world_height: WORLD_HEIGHT,
        createMaterial() {
            const material = new StandardMaterial()
            material.useLighting = false
            return material
        },
    })

    plane.setPosition(0, PANEL_Y, 0)
    app.root.addChild(plane)

    const grid_positions: number[] = []
    for (let position = -10; position <= 10; position++) {
        grid_positions.push(position, FLOOR_Y, -10, position, FLOOR_Y, 10)
        grid_positions.push(-10, FLOOR_Y, position, 10, FLOOR_Y, position)
    }

    const grid_mesh = new Mesh(graphics_device)
    grid_mesh.setPositions(grid_positions)
    grid_mesh.update(PRIMITIVE_LINES)

    const grid_material = new StandardMaterial()
    grid_material.diffuse = new Color(0, 0, 0)
    grid_material.emissive = new Color(0.278, 0.333, 0.412)
    grid_material.useLighting = false

    const grid = new Entity('grid', app)
    grid.addComponent('render', {
        meshInstances: [new MeshInstance(grid_mesh, grid_material)],
    })
    app.root.addChild(grid)

    const camera = new Entity('camera', app)
    camera.addComponent('camera', {
        clearColor: new Color(0.067, 0.094, 0.153),
        fov: 60,
        nearClip: 0.1,
        farClip: 100,
    })
    camera.setPosition(0, PANEL_Y + 1.31, 4.5)
    camera.lookAt(0, PANEL_Y, 0)
    app.root.addChild(camera)

    const active_pointers = new Set()
    const panel_pointers = new Set()

    canvas.addEventListener(
        'pointerdown',
        (event) => {
            active_pointers.add(event.pointerId)
        },
        { capture: true },
    )
    const releasePointer = (event) => {
        active_pointers.delete(event.pointerId)
        panel_pointers.delete(event.pointerId)
    }
    canvas.addEventListener('pointerup', releasePointer, { capture: true })
    canvas.addEventListener('pointercancel', releasePointer, { capture: true })

    ui.setCamera(camera)

    ui.root.on('pointerdown', (event) => {
        panel_pointers.add(event.source_event.pointerId)
    })

    let camera_zoom_enabled = true
    ui.root.on('pointerover', (event) => {
        camera_zoom_enabled = event.source_event.pointerType !== 'mouse'
    })
    ui.root.on('pointerout', () => {
        camera_zoom_enabled = true
    })

    const touch_source = new MultiTouchSource()
    touch_source.attach(canvas)
    const mouse_buttons = [false, false, false]
    let mouse_x = 0
    let mouse_y = 0
    let mouse_wheel = 0

    canvas.addEventListener('pointerdown', (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return
        canvas.setPointerCapture(event.pointerId)
        setMouseButtons(mouse_buttons, event.buttons)
    })
    canvas.addEventListener('pointermove', (event: PointerEvent) => {
        if (!canControlCamera() || event.pointerType !== 'mouse' || event.buttons === 0) return
        mouse_x += event.movementX
        mouse_y += event.movementY
    })
    const releaseMousePointer = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') return
        canvas.releasePointerCapture(event.pointerId)
        setMouseButtons(mouse_buttons, event.buttons)
    }
    canvas.addEventListener('pointerup', releaseMousePointer)
    canvas.addEventListener('pointercancel', releaseMousePointer)
    canvas.addEventListener(
        'wheel',
        (event: WheelEvent) => {
            event.preventDefault()
            if (!camera_zoom_enabled) return
            mouse_wheel += event.deltaY
        },
        { passive: false },
    )
    canvas.addEventListener('contextmenu', (event: MouseEvent) => event.preventDefault())

    const orbit_controller = new OrbitController()
    orbit_controller.pitchRange = new Vec2(-85, 85)
    orbit_controller.attach(new Pose().look(camera.getPosition(), new Vec3(0, PANEL_Y, 0)), false)
    const orbit_frame = new InputFrame({ move: [0, 0, 0], rotate: [0, 0] })
    let touch_count = 0

    function canControlCamera() {
        return active_pointers.size !== 1 || panel_pointers.size === 0
    }

    app.on('update', (delta_time) => {
        const touch_input = touch_source.read()
        touch_count += touch_input.count[0]

        const move: [number, number, number] = [0, 0, mouse_wheel * 0.001]
        const rotate: [number, number] = [0, 0]

        if (canControlCamera()) {
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

    registerRootComponent(VueTodo, { ui }).render({ backgroundColor: 'unset', boxShadow: 'unset' })

    ui.setViewport(UI_WIDTH, UI_HEIGHT)
    ui.update()

    syncCanvasSize({ app, graphics_device })
    onCanvasEvent('resize', () => syncCanvasSize({ app, graphics_device }))

    app.on('prerender', () => {
        ui.update()
        ui.draw({
            submit: false,
            command_encoder: graphics_device.getCommandEncoder(),
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

function syncCanvasSize({ app, graphics_device }) {
    graphics_device.maxPixelRatio = Math.min(window.devicePixelRatio, 2)
    app.resizeCanvas()
}
