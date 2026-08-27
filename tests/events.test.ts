import { expect, test } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import Events from '../src/core/Events'
import { DEFAULT_EVENTS } from '../src/events'
import { OVERFLOW } from '../src/style/consts'
import TestRenderer from './utils/TestRenderer.ts'
import TestUI from './utils/TestUI.ts'

const WORKSPACE_PATH = fileURLToPath(new URL('..', import.meta.url))
const EVENT_TYPES = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']
const createEvents = (custom_events = []) =>
    new Events({
        definitions: [...DEFAULT_EVENTS, ...custom_events],
    })
const createScrollNode = ({ parent = null, horizontal = false, scroll_size = 1000, client_size = 200 } = {}) => {
    const node = {
        parent,
        scrolling: false,
        scrollLeft: 0,
        scrollTop: 0,
        scrollWidth: horizontal ? scroll_size : client_size,
        scrollHeight: horizontal ? client_size : scroll_size,
        clientWidth: client_size,
        clientHeight: client_size,
        styles: horizontal
            ? { overflowX: { parsed: { enum: OVERFLOW.scroll } } }
            : { overflowY: { parsed: { enum: OVERFLOW.scroll } } },
        ui: {
            update() {
                node.scrollLeft = Math.max(0, Math.min(node.scrollLeft, node.scrollWidth - node.clientWidth))
                node.scrollTop = Math.max(0, Math.min(node.scrollTop, node.scrollHeight - node.clientHeight))
            },
        },
    }

    return node
}
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

test('current_target follows the event path when the target has no listeners', () => {
    const events = createEvents()
    const root = { parent: null, styles: {} }
    const combined = { parent: root, styles: {} }
    const inside = { parent: combined, styles: {} }
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

test('stopPropagation stops bubbling after the current target listeners', () => {
    const events = createEvents()
    const root = { parent: null, styles: {} }
    const parent = { parent: root, styles: {} }
    const child = { parent, styles: {} }
    const calls = []

    events.on(child, 'pointerdown', (event) => {
        calls.push(['child-first', event.source_event.pointerId])
        if (event.source_event.pointerId === 1) {
            event.stopPropagation()
        }
    })
    events.on(child, 'pointerdown', (event) => calls.push(['child-second', event.source_event.pointerId]))
    events.on(parent, 'pointerdown', (event) => calls.push(['parent', event.source_event.pointerId]))
    events.on(root, 'pointerdown', (event) => calls.push(['root', event.source_event.pointerId]))

    events.dispatch({ type: 'pointerdown', pointerId: 1 }, {}, child)
    events.dispatch({ type: 'pointerdown', pointerId: 2 }, {}, child)

    expect(calls).toEqual([
        ['child-first', 1],
        ['child-second', 1],
        ['child-first', 2],
        ['child-second', 2],
        ['parent', 2],
        ['root', 2],
    ])
})

test('duplicate listeners are ignored and removed by one off call', () => {
    const events = createEvents()
    const node = { parent: null, styles: {} }
    let calls = 0
    const listener = () => calls++

    events.on(node, 'pointerdown', listener)
    events.on(node, 'pointerdown', listener)
    events.dispatch({ type: 'pointerdown', pointerId: 1 }, {}, node)

    events.off(node, 'pointerdown', listener)
    events.dispatch({ type: 'pointerdown', pointerId: 2 }, {}, node)

    expect(calls).toBe(1)
})

test('listener mutations follow web dispatch semantics', () => {
    const events = createEvents()
    const node = { parent: null, styles: {} }
    const calls = []
    const added_listener = () => calls.push('added')
    const removed_listener = () => calls.push('removed')
    const first_listener = () => {
        calls.push('first')
        events.off(node, 'pointerdown', removed_listener)
        events.on(node, 'pointerdown', added_listener)
    }

    events.on(node, 'pointerdown', first_listener)
    events.on(node, 'pointerdown', removed_listener)
    events.dispatch({ type: 'pointerdown', pointerId: 1 }, {}, node)
    events.dispatch({ type: 'pointerdown', pointerId: 2 }, {}, node)

    expect(calls).toEqual(['first', 'first', 'added'])
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
    const root = { parent: null, styles: {} }
    const first = { parent: root, styles: {} }
    const second = { parent: root, styles: {} }
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
    const first = { parent: null, styles: {} }
    const second = { parent: null, styles: {} }
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
    const node = { parent: null, styles: {} }
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
    const root = { parent: null, styles: {} }
    const first = { parent: root, styles: {} }
    const second = { parent: root, styles: {} }
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
    const root = { parent: null, styles: {} }
    const first = { parent: root, styles: {} }
    const second = { parent: root, styles: {} }
    const received_events = []

    for (const [node, name] of [
        [first, 'first'],
        [root, 'root'],
    ]) {
        for (const type of ['pointerdown', 'pointerup', 'click']) {
            events.on(node, type, (event) => {
                received_events.push([event.type, name, event.target === first, event.source_event.type, event.x])
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

test('click is suppressed while an ancestor is scrolling', () => {
    const events = createEvents()
    const root = { parent: null, scrolling: false, styles: {} }
    const scroller = { parent: root, scrolling: false, styles: {} }
    const child = { parent: scroller, scrolling: false, styles: {} }
    const received_events = []

    for (const type of ['pointerup', 'click']) {
        events.on(child, type, (event) => received_events.push([event.type, event.x]))
    }

    events.dispatch({ type: 'pointerdown', pointerId: 1 }, { x: 1 }, child)
    root.scrolling = true
    events.dispatch({ type: 'pointerup', pointerId: 1 }, { x: 2 }, child)

    events.dispatch({ type: 'pointerdown', pointerId: 2 }, { x: 3 }, child)
    events.dispatch({ type: 'pointerup', pointerId: 2 }, { x: 4 }, child)

    expect(received_events).toEqual([
        ['pointerup', 2],
        ['pointerup', 4],
        ['click', 4],
    ])
    expect(root.scrolling).toBe(false)
})

test('a touch drag scrolls the nearest scrollable ancestor and emits scroll', () => {
    const events = createEvents()
    const scroller = createScrollNode()
    const child = { parent: scroller, styles: {} }
    const received_events = []

    events.on(scroller, 'scroll', (event) => received_events.push([event.scroll_left, event.scroll_top]))

    events.dispatch({ type: 'pointerdown', pointerId: 1, pointerType: 'touch' }, { x: 0, y: 100 }, child)
    events.dispatch({ type: 'pointermove', pointerId: 1, pointerType: 'touch' }, { x: 0, y: 60 }, child)

    expect(scroller.scrollTop).toBe(40)
    expect(received_events).toEqual([[0, 40]])
})

test('a mouse drag does not scroll', () => {
    const events = createEvents()
    const scroller = createScrollNode()
    const child = { parent: scroller, styles: {} }
    const received_events = []

    events.on(scroller, 'scroll', () => received_events.push('scroll'))

    events.dispatch({ type: 'pointerdown', pointerId: 1, pointerType: 'mouse' }, { x: 0, y: 100 }, child)
    events.dispatch({ type: 'pointermove', pointerId: 1, pointerType: 'mouse' }, { x: 0, y: 60 }, child)

    expect(scroller.scrollTop).toBe(0)
    expect(received_events).toEqual([])
})

test('the scrolling flag is only set past the drag slop', () => {
    const events = createEvents()
    const scroller = createScrollNode()
    const child = { parent: scroller, styles: {} }

    events.dispatch({ type: 'pointerdown', pointerId: 1, pointerType: 'touch' }, { x: 0, y: 100 }, child)
    events.dispatch({ type: 'pointermove', pointerId: 1, pointerType: 'touch' }, { x: 0, y: 92 }, child)

    expect(scroller.scrollTop).toBe(8)
    expect(scroller.scrolling).toBe(false)

    events.dispatch({ type: 'pointermove', pointerId: 1, pointerType: 'touch' }, { x: 0, y: 80 }, child)

    expect(scroller.scrollTop).toBe(20)
    expect(scroller.scrolling).toBe(true)
})

test('the wheel scrolls with normalized deltas scaled by the scrollable content', () => {
    const events = createEvents()
    const scroller = createScrollNode()
    const child = { parent: scroller, styles: {} }

    events.dispatch({ type: 'wheel', deltaX: 0, deltaY: 3, deltaMode: 1 }, { x: 0, y: 0 }, child)

    expect(scroller.scrollTop).toBe(48)
})

test('the wheel moves a horizontal scroller with the vertical delta', () => {
    const events = createEvents()
    const scroller = createScrollNode({ horizontal: true })
    const child = { parent: scroller, styles: {} }

    events.dispatch({ type: 'wheel', deltaX: 0, deltaY: 12, deltaMode: 0 }, { x: 0, y: 0 }, child)

    expect(scroller.scrollLeft).toBe(12)
    expect(scroller.scrollTop).toBe(0)
})

test('the wheel chains to the ancestor when the inner scroller is at its end', () => {
    const events = createEvents()
    const outer = createScrollNode()
    const inner = createScrollNode({ parent: outer })
    const child = { parent: inner, styles: {} }

    inner.scrollTop = inner.scrollHeight - inner.clientHeight

    events.dispatch({ type: 'wheel', deltaX: 0, deltaY: 3, deltaMode: 1 }, { x: 0, y: 0 }, child)

    expect(inner.scrollTop).toBe(800)
    expect(outer.scrollTop).toBe(48)
})

test('scroll is not emitted when the clamped offset does not change', () => {
    const events = createEvents()
    const scroller = createScrollNode()
    const child = { parent: scroller, styles: {} }
    const received_events = []

    events.on(scroller, 'scroll', () => received_events.push('scroll'))

    events.dispatch({ type: 'pointerdown', pointerId: 1, pointerType: 'touch' }, { x: 0, y: 100 }, child)
    events.dispatch({ type: 'pointermove', pointerId: 1, pointerType: 'touch' }, { x: 0, y: 140 }, child)

    expect(scroller.scrollTop).toBe(0)
    expect(received_events).toEqual([])
})

test('UI dispatches custom source events and instantiates definitions per instance', async () => {
    const counts = []
    const activate_event = Events.defineEvent(
        { name: 'activate', component: 'onActivate', priority: 'discrete' },
        ({ emit }) => {
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
        },
    )
    for (let i = 0; i < 2; i++) {
        const ui = await TestUI.create({
            renderer: new TestRenderer(),
            custom_events: [activate_event],
        })

        ui.root.style('width', '1px')
        ui.root.style('height', '1px')
        ui.root.on('activate', (event) => counts.push(event.count))
        ui.update()
        ui.dispatchEvent({ type: 'activate' }, { x: 0, y: 0 })
        ui.destroy()
    }

    expect(counts).toEqual([1, 1])
})
