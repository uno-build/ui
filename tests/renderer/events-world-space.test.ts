import { expect, test } from '@playwright/test'
import { PLATFORM_EVENT_NAMES } from '../../src/events/constants'

const TEST_PAGE_URL = '/tests/renderer/'
const EVENT_FLOW = [
    ['pointerdown', 'child'],
    ['pointerdown', 'root'],
    ['pointermove', 'child'],
    ['pointermove', 'root'],
    ['pointerup', 'child'],
    ['pointerup', 'root'],
    ['pointerdown', 'child'],
    ['pointerdown', 'root'],
    ['pointercancel', 'child'],
    ['pointercancel', 'root'],
]

test('UIThree dispatches pointer events from raycast intersections', { tag: '@webgpu' }, async ({ page }) => {
    await page.goto(TEST_PAGE_URL)

    const events = await page.evaluate(
        async ({ event_types }) => {
            const { UIThree, ResourcesWebGPU, THREE } = await import(
                '/tests/renderer/browser-entry.ts'
            )
            const canvas = document.createElement('canvas')
            canvas.width = 400
            canvas.height = 200
            Object.assign(canvas.style, {
                position: 'absolute',
                left: '0',
                top: '0',
                width: '400px',
                height: '200px',
            })
            document.body.appendChild(canvas)

            const resources = await ResourcesWebGPU.create({ canvas })
            const { ui, geometry, material, texture } = await UIThree.create({
                resources,
                register_platform_events: false,
                texture_width: 200,
                texture_height: 100,
                world_width: 2,
                world_height: 1,
            })
            const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 100)
            camera.position.z = 2
            camera.updateMatrixWorld()
            ui.setCamera(camera)

            const child = ui.create()
            const events = []
            let current_source_event

            ui.root.style('width', '200px')
            ui.root.style('height', '100px')
            child.style('width', '200px')
            child.style('height', '100px')
            ui.root.add(child)
            ui.update()

            const record = (expected_current_target, current_target) => (event) => {
                events.push({
                    type: event.type,
                    x: event.x,
                    y: event.y,
                    distance_to_camera: event.distance_to_camera,
                    target: event.target === child ? 'child' : 'root',
                    current_target,
                    current_target_matches: event.current_target === expected_current_target,
                    source_event_matches: event.source_event === current_source_event,
                })
            }

            for (const type of event_types) {
                child.on(type, record(child, 'child'))
                ui.root.on(type, record(ui.root, 'root'))
                canvas.addEventListener(type, (source_event) => {
                    current_source_event = source_event
                    ui.dispatchPlatformEvent(source_event)
                })
            }

            const rect = canvas.getBoundingClientRect()
            const dispatch = (type, pointer_id, x, y) => {
                canvas.dispatchEvent(
                    new PointerEvent(type, {
                        pointerId: pointer_id,
                        clientX: rect.left + x,
                        clientY: rect.top + y,
                    }),
                )
            }

            dispatch('pointerdown', 1, 200, 100)
            dispatch('pointermove', 1, 200, 100)
            dispatch('pointerup', 1, 200, 100)
            dispatch('pointerdown', 2, 200, 100)
            dispatch('pointercancel', 2, 200, 100)
            dispatch('pointerdown', 3, 1, 1)

            ui.destroy()
            geometry.dispose()
            material.dispose()
            texture.dispose()
            resources.dispose()
            canvas.remove()
            return events
        },
        { event_types: PLATFORM_EVENT_NAMES },
    )

    expect(events.map(({ type, current_target }) => [type, current_target])).toEqual(EVENT_FLOW)
    expect(events.every(({ target }) => target === 'child')).toBe(true)
    expect(events.every(({ current_target_matches }) => current_target_matches)).toBe(true)
    expect(events.every(({ source_event_matches }) => source_event_matches)).toBe(true)

    for (const event of events) {
        expect(event.x).toBeCloseTo(100)
        expect(event.y).toBeCloseTo(50)
        expect(event.distance_to_camera).toBeCloseTo(2)
    }
})

test('UIBabylon dispatches pointer events from raycast intersections', { tag: '@webgpu' }, async ({ page }) => {
    await page.goto(TEST_PAGE_URL)

    const events = await page.evaluate(
        async ({ event_types }) => {
            const { UIBabylon, ResourcesWebGPU, WebGPUEngine, Scene, FreeCamera, Vector3 } = await import(
                '/tests/renderer/browser-entry.ts'
            )
            const canvas = document.createElement('canvas')
            canvas.width = 400
            canvas.height = 200
            Object.assign(canvas.style, {
                position: 'absolute',
                left: '0',
                top: '0',
                width: '400px',
                height: '200px',
            })
            document.body.appendChild(canvas)

            const context = canvas.getContext('webgpu')
            const format = navigator.gpu.getPreferredCanvasFormat()
            const engine = new WebGPUEngine(canvas, {
                antialias: false,
                audioEngine: false,
                premultipliedAlpha: true,
                doNotHandleTouchAction: true,
                swapChainFormat: format,
            })
            await engine.initAsync()

            const scene = new Scene(engine)
            const resources = await ResourcesWebGPU.create({
                canvas,
                device: engine._device,
                context,
                format,
            })
            const { ui, plane, material, texture } = await UIBabylon.create({
                scene,
                resources,
                register_platform_events: false,
                texture_width: 200,
                texture_height: 100,
                world_width: 2,
                world_height: 1,
            })
            const camera = new FreeCamera('camera', new Vector3(0, 0, -2), scene)
            camera.setTarget(Vector3.Zero())
            camera.minZ = 0.1
            ui.setCamera(camera)

            const child = ui.create()
            const events = []
            let current_source_event

            ui.root.style('width', '200px')
            ui.root.style('height', '100px')
            child.style('width', '200px')
            child.style('height', '100px')
            ui.root.add(child)
            ui.update()

            const record = (expected_current_target, current_target) => (event) => {
                events.push({
                    type: event.type,
                    x: event.x,
                    y: event.y,
                    distance_to_camera: event.distance_to_camera,
                    target: event.target === child ? 'child' : 'root',
                    current_target,
                    current_target_matches: event.current_target === expected_current_target,
                    source_event_matches: event.source_event === current_source_event,
                })
            }

            for (const type of event_types) {
                child.on(type, record(child, 'child'))
                ui.root.on(type, record(ui.root, 'root'))
                canvas.addEventListener(type, (source_event) => {
                    current_source_event = source_event
                    ui.dispatchPlatformEvent(source_event)
                })
            }

            const rect = canvas.getBoundingClientRect()
            const dispatch = (type, pointer_id, x, y) => {
                canvas.dispatchEvent(
                    new PointerEvent(type, {
                        pointerId: pointer_id,
                        clientX: rect.left + x,
                        clientY: rect.top + y,
                    }),
                )
            }

            dispatch('pointerdown', 1, 200, 100)
            dispatch('pointermove', 1, 200, 100)
            dispatch('pointerup', 1, 200, 100)
            dispatch('pointerdown', 2, 200, 100)
            dispatch('pointercancel', 2, 200, 100)
            dispatch('pointerdown', 3, 1, 1)

            ui.destroy()
            plane.dispose()
            material.dispose()
            texture.dispose()
            resources.dispose()
            scene.dispose()
            engine.dispose()
            canvas.remove()
            return events
        },
        { event_types: PLATFORM_EVENT_NAMES },
    )

    expect(events.map(({ type, current_target }) => [type, current_target])).toEqual(EVENT_FLOW)
    expect(events.every(({ target }) => target === 'child')).toBe(true)
    expect(events.every(({ current_target_matches }) => current_target_matches)).toBe(true)
    expect(events.every(({ source_event_matches }) => source_event_matches)).toBe(true)

    for (const event of events) {
        expect(event.x).toBeCloseTo(100)
        expect(event.y).toBeCloseTo(50)
        expect(event.distance_to_camera).toBeCloseTo(2)
    }
})

test('UIBabylonLite dispatches pointer events from raycast intersections', { tag: '@webgpu' }, async ({ page }) => {
    await page.goto(TEST_PAGE_URL)

    const events = await page.evaluate(
        async ({ event_types }) => {
            const { UIBabylonLite, ResourcesWebGPU, BABYLON } = await import(
                '/tests/renderer/browser-entry.ts'
            )
            const canvas = document.createElement('canvas')
            canvas.width = 400
            canvas.height = 200
            Object.assign(canvas.style, {
                position: 'absolute',
                left: '0',
                top: '0',
                width: '400px',
                height: '200px',
            })
            document.body.appendChild(canvas)

            const render_canvas = new OffscreenCanvas(400, 200)
            const engine = await BABYLON.createEngine(render_canvas, { msaaSamples: 1, alphaMode: 'premultiplied' })
            const scene = BABYLON.createSceneContext(engine)
            const resources = await ResourcesWebGPU.create({
                canvas: render_canvas,
                device: engine._device,
                context: render_canvas.getContext('webgpu'),
                format: engine.format,
            })
            const { ui, plane } = await UIBabylonLite.create({
                engine,
                scene,
                resources,
                register_platform_events: false,
                texture_width: 200,
                texture_height: 100,
                world_width: 2,
                world_height: 1,
            })
            const camera = BABYLON.createFreeCamera({ x: 0, y: 0, z: -2 }, { x: 0, y: 0, z: 0 })
            camera.nearPlane = 0.1
            scene.camera = camera
            ui.setCamera(camera)
            BABYLON.addToScene(scene, plane)

            const child = ui.create()
            const events = []
            const source_events = new Map()
            const dispatch_promises = []

            ui.root.style('width', '200px')
            ui.root.style('height', '100px')
            child.style('width', '200px')
            child.style('height', '100px')
            ui.root.add(child)
            ui.update()

            const record = (expected_current_target, current_target) => (event) => {
                events.push({
                    type: event.type,
                    x: event.x,
                    y: event.y,
                    distance_to_camera: event.distance_to_camera,
                    target: event.target === child ? 'child' : 'root',
                    current_target,
                    current_target_matches: event.current_target === expected_current_target,
                    source_event_matches:
                        event.source_event ===
                        source_events.get(`${event.source_event.type}:${event.source_event.pointerId}`),
                })
            }

            for (const type of event_types) {
                child.on(type, record(child, 'child'))
                ui.root.on(type, record(ui.root, 'root'))
                canvas.addEventListener(type, (source_event) => {
                    source_events.set(`${source_event.type}:${source_event.pointerId}`, source_event)
                    dispatch_promises.push(ui.dispatchPlatformEvent(source_event))
                })
            }

            const rect = canvas.getBoundingClientRect()
            const dispatch = (type, pointer_id, x, y) => {
                canvas.dispatchEvent(
                    new PointerEvent(type, {
                        pointerId: pointer_id,
                        clientX: rect.left + x,
                        clientY: rect.top + y,
                    }),
                )
            }

            dispatch('pointerdown', 1, 200, 100)
            dispatch('pointermove', 1, 200, 100)
            dispatch('pointerup', 1, 200, 100)
            dispatch('pointerdown', 2, 200, 100)
            dispatch('pointercancel', 2, 200, 100)
            dispatch('pointerdown', 3, 1, 1)
            await Promise.all(dispatch_promises)

            ui.destroy()
            resources.dispose()
            BABYLON.disposeScene(scene)
            BABYLON.disposeEngine(engine)
            canvas.remove()
            return events
        },
        { event_types: PLATFORM_EVENT_NAMES },
    )

    expect(events.map(({ type, current_target }) => [type, current_target])).toEqual(EVENT_FLOW)
    expect(events.every(({ target }) => target === 'child')).toBe(true)
    expect(events.every(({ current_target_matches }) => current_target_matches)).toBe(true)
    expect(events.every(({ source_event_matches }) => source_event_matches)).toBe(true)

    for (const event of events) {
        expect(event.x).toBeCloseTo(100)
        expect(event.y).toBeCloseTo(50)
        expect(event.distance_to_camera).toBeCloseTo(2)
    }
})

test('UIPlayCanvas dispatches pointer events from raycast intersections', { tag: '@webgpu' }, async ({ page }) => {
    await page.goto(TEST_PAGE_URL)

    const events = await page.evaluate(
        async ({ event_types }) => {
            const { UIPlayCanvas, ResourcesWebGPU, PLAYCANVAS } = await import(
                '/tests/renderer/browser-entry.ts'
            )
            const canvas = document.createElement('canvas')
            canvas.width = 400
            canvas.height = 200
            Object.assign(canvas.style, {
                position: 'absolute',
                left: '0',
                top: '0',
                width: '400px',
                height: '200px',
            })
            document.body.appendChild(canvas)

            const graphics_device = await PLAYCANVAS.createGraphicsDevice(canvas, {
                deviceTypes: ['webgpu'],
                antialias: false,
                alpha: true,
            })
            const resources = await ResourcesWebGPU.create({
                canvas,
                device: graphics_device.wgpu,
                context: graphics_device.gpuContext,
                format: graphics_device.canvasConfig.format,
            })
            const app_options = new PLAYCANVAS.AppOptions()
            app_options.graphicsDevice = graphics_device
            app_options.componentSystems = [
                PLAYCANVAS.RenderComponentSystem,
                PLAYCANVAS.CameraComponentSystem,
            ]
            app_options.resourceHandlers = [PLAYCANVAS.TextureHandler, PLAYCANVAS.ContainerHandler]

            const app = new PLAYCANVAS.AppBase(canvas)
            app.init(app_options)

            const { ui, plane, mesh, material, texture } = await UIPlayCanvas.create({
                app,
                resources,
                register_platform_events: false,
                texture_width: 200,
                texture_height: 100,
                world_width: 2,
                world_height: 1,
            })
            const camera = new PLAYCANVAS.Entity('camera', app)
            camera.addComponent('camera', {
                fov: 60,
                nearClip: 0.1,
                farClip: 100,
            })
            camera.setPosition(0, 0, 2)
            camera.lookAt(0, 0, 0)
            app.root.addChild(camera)
            app.root.addChild(plane)
            ui.setCamera(camera)

            const child = ui.create()
            const events = []
            let current_source_event

            ui.root.style('width', '200px')
            ui.root.style('height', '100px')
            child.style('width', '200px')
            child.style('height', '100px')
            ui.root.add(child)
            ui.update()

            const record = (expected_current_target, current_target) => (event) => {
                events.push({
                    type: event.type,
                    x: event.x,
                    y: event.y,
                    distance_to_camera: event.distance_to_camera,
                    target: event.target === child ? 'child' : 'root',
                    current_target,
                    current_target_matches: event.current_target === expected_current_target,
                    source_event_matches: event.source_event === current_source_event,
                })
            }

            for (const type of event_types) {
                child.on(type, record(child, 'child'))
                ui.root.on(type, record(ui.root, 'root'))
                canvas.addEventListener(type, (source_event) => {
                    current_source_event = source_event
                    ui.dispatchPlatformEvent(source_event)
                })
            }

            const rect = canvas.getBoundingClientRect()
            const dispatch = (type, pointer_id, x, y) => {
                canvas.dispatchEvent(
                    new PointerEvent(type, {
                        pointerId: pointer_id,
                        clientX: rect.left + x,
                        clientY: rect.top + y,
                    }),
                )
            }

            dispatch('pointerdown', 1, 200, 100)
            dispatch('pointermove', 1, 200, 100)
            dispatch('pointerup', 1, 200, 100)
            dispatch('pointerdown', 2, 200, 100)
            dispatch('pointercancel', 2, 200, 100)
            dispatch('pointerdown', 3, 1, 1)

            ui.destroy()
            plane.destroy()
            mesh.destroy()
            material.destroy()
            texture.destroy()
            resources.dispose()
            app.destroy()
            canvas.remove()
            return events
        },
        { event_types: PLATFORM_EVENT_NAMES },
    )

    expect(events.map(({ type, current_target }) => [type, current_target])).toEqual(EVENT_FLOW)
    expect(events.every(({ target }) => target === 'child')).toBe(true)
    expect(events.every(({ current_target_matches }) => current_target_matches)).toBe(true)
    expect(events.every(({ source_event_matches }) => source_event_matches)).toBe(true)

    for (const event of events) {
        expect(event.x).toBeCloseTo(100)
        expect(event.y).toBeCloseTo(50)
        expect(event.distance_to_camera).toBeCloseTo(2)
    }
})
