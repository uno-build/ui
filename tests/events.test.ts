import { expect, test } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import Events from '../src/core/Events'
import { DEFAULT_EVENTS } from '../src/events/pointer'
import TestRenderer from './TestRenderer.ts'
import TestUI from './TestUI.ts'

const WORKSPACE_PATH = fileURLToPath(new URL('..', import.meta.url))
const EVENT_TYPES = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']
const createEvents = (custom_events = []) =>
    new Events({
        event_definitions: [...DEFAULT_EVENTS, ...custom_events],
    })
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
    const events = createEvents()
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

test('UI hit testing applies pointerEvents to overlapping nodes', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    const underneath = ui.create()
    const overlay = ui.create()
    const received_events = []

    ui.root.style('width', '200px')
    ui.root.style('height', '100px')
    for (const node of [underneath, overlay]) {
        node.style('position', 'absolute')
        node.style('width', '100px')
        node.style('height', '50px')
        ui.root.add(node)
        node.on('pointerdown', () => received_events.push(node))
    }
    overlay.style('pointerEvents', 'none')
    ui.update()

    ;(ui as any).dispatchEventAt({ type: 'pointerdown', pointerId: 1 }, { x: 50, y: 25 })

    overlay.style('pointerEvents', 'all')
    ;(ui as any).dispatchEventAt({ type: 'pointerdown', pointerId: 2 }, { x: 50, y: 25 })

    overlay.style('pointerEvents', 'unset')
    ;(ui as any).dispatchEventAt({ type: 'pointerdown', pointerId: 3 }, { x: 50, y: 25 })

    expect(received_events).toEqual([underneath, overlay, overlay])
})

test('pointerEvents is not inherited and does not block bubbling', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    const parent = ui.create()
    const child = ui.create()
    const received_events = []

    ui.root.style('width', '200px')
    ui.root.style('height', '100px')
    parent.style('position', 'absolute')
    parent.style('width', '100px')
    parent.style('height', '50px')
    parent.style('pointerEvents', 'none')
    child.style('width', '100px')
    child.style('height', '50px')
    ui.root.add(parent)
    parent.add(child)
    child.on('pointerdown', () => received_events.push('child'))
    parent.on('pointerdown', () => received_events.push('parent'))
    ui.update()

    ;(ui as any).dispatchEventAt({ type: 'pointerdown', pointerId: 1 }, { x: 50, y: 25 })

    expect(received_events).toEqual(['child', 'parent'])
})

test('pointerover and pointerout follow hit targets and bubble', () => {
    const events = createEvents()
    const root = { parent: null }
    const first = { parent: root }
    const second = { parent: root }
    const names = new Map([
        [root, 'root'],
        [first, 'first'],
        [second, 'second'],
    ])
    const received_events = []
    let current_source_event

    const record = (node, listener) => (event) => {
        received_events.push([
            event.type,
            listener,
            names.get(event.target),
            names.get(event.related_target) ?? null,
            event.x,
            event.current_target === node,
            event.source_event === current_source_event,
        ])
    }
    const dispatch = (source_event, event_data, target) => {
        current_source_event = source_event
        events.dispatch(source_event, event_data, target)
    }

    for (const [node, name] of names) {
        events.on(node, 'pointerover', record(node, name))
        events.on(node, 'pointerout', record(node, name))
    }

    dispatch({ type: 'pointermove', pointerId: 1 }, { x: 1 }, first)
    dispatch({ type: 'pointermove', pointerId: 1 }, { x: 2 }, first)
    dispatch({ type: 'pointermove', pointerId: 1 }, { x: 3 }, second)
    dispatch({ type: 'pointermove', pointerId: 1 }, null, null)

    expect(received_events).toEqual([
        ['pointerover', 'first', 'first', null, 1, true, true],
        ['pointerover', 'root', 'first', null, 1, true, true],
        ['pointerout', 'first', 'first', 'second', 3, true, true],
        ['pointerout', 'root', 'first', 'second', 3, true, true],
        ['pointerover', 'second', 'second', 'first', 3, true, true],
        ['pointerover', 'root', 'second', 'first', 3, true, true],
        ['pointerout', 'second', 'second', null, 3, true, true],
        ['pointerout', 'root', 'second', null, 3, true, true],
    ])
})

test('pointerover and pointerout use hit targets during pointer capture', () => {
    const events = createEvents()
    const first = { parent: null }
    const second = { parent: null }
    const names = new Map([
        [first, 'first'],
        [second, 'second'],
    ])
    const received_events = []
    const record = (event) => {
        received_events.push([
            event.type,
            names.get(event.target),
            names.get(event.related_target) ?? null,
            'related_target' in event,
            event.x,
        ])
    }

    for (const node of names.keys()) {
        for (const type of ['pointerover', 'pointerout', 'pointerdown', 'pointermove', 'pointerup']) {
            events.on(node, type, record)
        }
    }

    events.dispatch({ type: 'pointerdown', pointerId: 1, pointerType: 'mouse' }, { x: 1 }, first)
    events.dispatch({ type: 'pointermove', pointerId: 1, pointerType: 'mouse' }, { x: 2 }, second)
    events.dispatch({ type: 'pointerup', pointerId: 1, pointerType: 'mouse' }, { x: 3 }, second)
    events.dispatch({ type: 'pointermove', pointerId: 1, pointerType: 'mouse' }, null, null)

    expect(received_events).toEqual([
        ['pointerover', 'first', null, true, 1],
        ['pointerdown', 'first', null, false, 1],
        ['pointerout', 'first', 'second', true, 2],
        ['pointerover', 'second', 'first', true, 2],
        ['pointermove', 'first', null, false, 2],
        ['pointerup', 'first', null, false, 3],
        ['pointerout', 'second', null, true, 3],
    ])
})

test('pointerup and pointercancel end hover according to the pointer type', () => {
    const events = createEvents()
    const node = { parent: null }
    const received_events = []
    const record = (event) => {
        received_events.push({
            type: event.type,
            pointer_id: event.source_event.pointerId,
            x: event.x,
        })
    }

    for (const type of ['pointerover', 'pointerout', 'pointerup', 'pointercancel']) {
        events.on(node, type, record)
    }

    events.dispatch({ type: 'pointerdown', pointerId: 1, pointerType: 'touch' }, { x: 1 }, node)
    events.dispatch({ type: 'pointerup', pointerId: 1, pointerType: 'touch' }, { x: 2 }, node)
    events.dispatch({ type: 'pointerdown', pointerId: 2, pointerType: 'mouse' }, { x: 3 }, node)
    events.dispatch({ type: 'pointerup', pointerId: 2, pointerType: 'mouse' }, { x: 4 }, node)
    events.dispatch({ type: 'pointerdown', pointerId: 3, pointerType: 'pen' }, { x: 5 }, node)
    events.dispatch({ type: 'pointerup', pointerId: 3, pointerType: 'pen' }, { x: 6 }, node)
    events.dispatch({ type: 'pointerdown', pointerId: 4, pointerType: 'mouse' }, { x: 7 }, node)
    events.dispatch({ type: 'pointercancel', pointerId: 4, pointerType: 'mouse' }, null, null)

    expect(received_events).toEqual([
        { type: 'pointerover', pointer_id: 1, x: 1 },
        { type: 'pointerup', pointer_id: 1, x: 2 },
        { type: 'pointerout', pointer_id: 1, x: 2 },
        { type: 'pointerover', pointer_id: 2, x: 3 },
        { type: 'pointerup', pointer_id: 2, x: 4 },
        { type: 'pointerover', pointer_id: 3, x: 5 },
        { type: 'pointerup', pointer_id: 3, x: 6 },
        { type: 'pointerover', pointer_id: 4, x: 7 },
        { type: 'pointercancel', pointer_id: 4, x: 7 },
        { type: 'pointerout', pointer_id: 4, x: 7 },
    ])
})

test('hover state is isolated by pointer and cleared on destruction', () => {
    const events = createEvents()
    const root = { parent: null }
    const first = { parent: root }
    const second = { parent: root }
    const received_events = []

    events.on(root, 'pointerout', (event) => {
        received_events.push({
            pointer_id: event.source_event.pointerId,
            target: event.target,
        })
    })

    events.dispatch({ type: 'pointermove', pointerId: 1 }, {}, first)
    events.dispatch({ type: 'pointermove', pointerId: 2 }, {}, second)
    events.dispatch({ type: 'pointermove', pointerId: 1 }, null, null)
    events.destroyNode(second)
    events.dispatch({ type: 'pointermove', pointerId: 2 }, null, null)

    expect(received_events).toEqual([{ pointer_id: 1, target: first }])

    events.dispatch({ type: 'pointermove', pointerId: 3 }, {}, first)
    events.destroy()
    events.on(root, 'pointerout', (event) => received_events.push(event))
    events.dispatch({ type: 'pointermove', pointerId: 3 }, null, null)

    expect(received_events).toEqual([{ pointer_id: 1, target: first }])
})

test('click follows pointerup when pointerdown and pointerup hit the same target', () => {
    const events = createEvents()
    const root = { parent: null }
    const first = { parent: root }
    const second = { parent: root }
    const received_events = []

    for (const [node, name] of [
        [first, 'first'],
        [root, 'root'],
    ]) {
        for (const type of ['pointerdown', 'pointerup', 'click']) {
            events.on(node, type, (event) => {
                received_events.push([
                    event.type,
                    name,
                    event.target === first,
                    event.source_event.type,
                    event.x,
                ])
            })
        }
    }

    events.dispatch({ type: 'pointerdown', pointerId: 1 }, { x: 1 }, first)
    events.dispatch({ type: 'pointerup', pointerId: 1 }, { x: 2 }, first)
    events.dispatch({ type: 'pointerdown', pointerId: 2 }, { x: 3 }, first)
    events.dispatch({ type: 'pointerup', pointerId: 2 }, { x: 4 }, second)
    events.dispatch({ type: 'pointerdown', pointerId: 3 }, { x: 5 }, first)
    events.dispatch({ type: 'pointercancel', pointerId: 3 }, null, null)
    events.dispatch({ type: 'pointerup', pointerId: 3 }, { x: 6 }, first)

    expect(received_events).toEqual([
        ['pointerdown', 'first', true, 'pointerdown', 1],
        ['pointerdown', 'root', true, 'pointerdown', 1],
        ['pointerup', 'first', true, 'pointerup', 2],
        ['pointerup', 'root', true, 'pointerup', 2],
        ['click', 'first', true, 'pointerup', 2],
        ['click', 'root', true, 'pointerup', 2],
        ['pointerdown', 'first', true, 'pointerdown', 3],
        ['pointerdown', 'root', true, 'pointerdown', 3],
        ['pointerup', 'first', true, 'pointerup', 4],
        ['pointerup', 'root', true, 'pointerup', 4],
        ['pointerdown', 'first', true, 'pointerdown', 5],
        ['pointerdown', 'root', true, 'pointerdown', 5],
    ])
})

test('event definitions normalize source events and are instantiated per Events instance', () => {
    const counts = []
    const activate_event = Events.defineEvent('activate', ({ emit }) => {
        let count = 0

        return {
            main: {
                activate({ source_event, event_data, hit_target }) {
                    count++
                    emit('activate', {
                        source_event,
                        event_data: {
                            ...event_data,
                            count,
                        },
                        target: hit_target,
                    })
                },
            },
        }
    })

    for (let i = 0; i < 2; i++) {
        const events = new Events({ event_definitions: [activate_event] })
        const node = { parent: null }

        events.on(node, 'activate', (event) => counts.push(event.count))
        events.dispatch({ type: 'activate' }, {}, node)
    }

    expect(counts).toEqual([1, 1])
})
