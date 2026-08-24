import { expect, test } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import Events from '../src/core/Events'

const WORKSPACE_PATH = fileURLToPath(new URL('..', import.meta.url))
const EVENT_TYPES = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']
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

test('UIWebGPU dispatches pointer events in UI coordinates', async ({ page }) => {
    await page.goto('/dev/?renderers=RendererDom')

    const events = await page.evaluate(
        async ({ event_types, module_urls }) => {
            const [{ default: UIWebGPU }, { default: ResourcesWebGPU }, { loadYoga }] = await Promise.all([
                import(module_urls.ui),
                import(module_urls.resources),
                import('/@id/yoga-layout/load'),
            ])
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
            const { ui } = await UIWebGPU.create({ resources, loadYoga })
            const child = ui.create()
            const events = []
            let current_source_event

            ui.root.style('width', '200px')
            ui.root.style('height', '100px')
            child.style('width', '100px')
            child.style('height', '50px')
            ui.root.add(child)
            ui.update()

            const record = (expected_current_target, current_target) => (event) => {
                events.push({
                    type: event.type,
                    x: event.x,
                    y: event.y,
                    target: event.target === child ? 'child' : 'root',
                    current_target,
                    current_target_matches: event.current_target === expected_current_target,
                    source_event_matches: event.source_event === current_source_event,
                    has_distance: 'distance_to_camera' in event,
                })
            }
            const removed_listener = () => events.push({ current_target: 'removed' })

            child.on('pointerdown', removed_listener)
            child.off('pointerdown', removed_listener)
            for (const type of event_types) {
                child.on(type, record(child, 'child'))
                ui.root.on(type, record(ui.root, 'root'))
                canvas.addEventListener(type, (source_event) => {
                    current_source_event = source_event
                    ui.dispatchEvent(source_event)
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

            dispatch('pointerdown', 1, 100, 50)
            dispatch('pointermove', 1, 300, 150)
            dispatch('pointerup', 1, 300, 150)
            dispatch('pointerdown', 2, 100, 50)
            dispatch('pointercancel', 2, 300, 150)

            ui.destroy()
            resources.dispose()
            canvas.remove()
            return events
        },
        {
            event_types: EVENT_TYPES,
            module_urls: {
                ui: `/@fs${WORKSPACE_PATH}src/ui/UIWebGPU.ts`,
                resources: `/@fs${WORKSPACE_PATH}src/renderer/webgpu/ResourcesWebGPU.ts`,
            },
        },
    )

    expect(events.map(({ type, current_target }) => [type, current_target])).toEqual(EVENT_FLOW)
    expect(events.every(({ target }) => target === 'child')).toBe(true)
    expect(events.every(({ current_target_matches }) => current_target_matches)).toBe(true)
    expect(events.every(({ source_event_matches }) => source_event_matches)).toBe(true)
    expect(events.every(({ has_distance }) => has_distance === false)).toBe(true)

    for (const event of events) {
        const is_pointerdown = event.type === 'pointerdown'
        expect(event.x).toBe(is_pointerdown ? 50 : 150)
        expect(event.y).toBe(is_pointerdown ? 25 : 75)
    }
})

test('UIThree dispatches pointer events from raycast intersections', async ({ page }) => {
    await page.goto('/dev/?renderers=RendererDom')

    const events = await page.evaluate(
        async ({ event_types, module_urls }) => {
            const [{ default: UIThree }, { default: ResourcesWebGPU }, { loadYoga }, THREE] = await Promise.all([
                import(module_urls.ui),
                import(module_urls.resources),
                import('/@id/yoga-layout/load'),
                import('/@id/three/webgpu'),
            ])
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
                loadYoga,
                texture_width: 200,
                texture_height: 100,
                world_width: 2,
                world_height: 1,
            })
            const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 100)
            camera.position.z = 2
            camera.updateMatrixWorld()

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
                    ui.dispatchEvent(source_event, { camera })
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
        {
            event_types: EVENT_TYPES,
            module_urls: {
                ui: `/@fs${WORKSPACE_PATH}src/ui/UIThree.ts`,
                resources: `/@fs${WORKSPACE_PATH}src/renderer/webgpu/ResourcesWebGPU.ts`,
            },
        },
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

test('current_target follows the event path when the target has no listeners', () => {
    const events = new Events()
    const root = { parent: null }
    const combined = { parent: root }
    const inside = { parent: combined }
    const received_events = []

    events.on(combined, 'pointerdown', (event) => {
        received_events.push({
            listener: 'combined',
            target_matches: event.target === inside,
            current_target_matches: event.current_target === combined,
        })
    })
    events.on(root, 'pointerdown', (event) => {
        received_events.push({
            listener: 'root',
            target_matches: event.target === inside,
            current_target_matches: event.current_target === root,
        })
    })

    events.dispatch({ type: 'pointerdown', pointerId: 1 }, {}, inside)

    expect(received_events).toEqual([
        { listener: 'combined', target_matches: true, current_target_matches: true },
        { listener: 'root', target_matches: true, current_target_matches: true },
    ])
})
