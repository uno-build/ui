import { expect, test } from '@playwright/test'
import EventEmitter from '../src/core/EventEmitter'
import { RESOURCE_EVENT } from '../src/core/constants'
import { DEFINED_EVENTS } from '../src/events'
import { EVENT } from '../src/events/constants'
import ResourcesDom from '../src/renderer/dom/ResourcesDom'
import { OVERFLOW } from '../src/style/constants'
import UIDom from '../src/ui/UIDom'
import TestRenderer from './utils/TestRenderer.ts'
import TestUI from './utils/TestUI.ts'

test('EventEmitter registers, removes, emits, and destroys listeners', () => {
    const events = new EventEmitter()
    const received_events = []
    const first_event = { value: 1 }
    const second_event = { value: 2 }
    const listener = (event) => received_events.push(event)
    const off = events.on('first', listener)

    events.on('first', listener)
    events.on('second', listener)
    events.emit('first', first_event)
    events.emit('second', second_event)

    expect(received_events).toEqual([first_event, second_event])

    events.off('second', listener)
    off()
    events.emit('first', first_event)
    events.emit('second', second_event)

    expect(received_events).toEqual([first_event, second_event])

    events.on('first', listener)
    events.destroy()
    events.emit('first', first_event)

    expect(received_events).toEqual([first_event, second_event])
})

test('default event definitions expose their public types through UI', async () => {
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: DEFINED_EVENTS,
    })

    expect(ui.defined_events.map((defined_event) => defined_event.types)).toEqual([
        [
            EVENT.POINTERDOWN,
            EVENT.POINTERMOVE,
            EVENT.POINTERUP,
            EVENT.POINTERCANCEL,
            EVENT.POINTEROVER,
            EVENT.POINTEROUT,
        ],
        [EVENT.WHEEL],
        [EVENT.SCROLL],
        [EVENT.CLICK],
        [EVENT.FOCUS, EVENT.BLUR],
    ])

    ui.destroy()
})

test('focus and blur keep a single focused node and emit public transitions', async () => {
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: DEFINED_EVENTS,
    })
    const first = ui.create()
    const second = ui.create()
    const received_events = []
    const first_source_event = { type: 'programmatic-focus' }
    const second_source_event = { type: 'programmatic-focus' }

    ui.root.add(first)
    ui.root.add(second)

    for (const type of ['focus', 'blur']) {
        ui.root.on(type, (event) => {
            received_events.push({
                type: event.type,
                target: event.target,
                current_target: event.current_target,
                related_target: event.related_target,
                source_event: event.source_event,
            })
        })
    }

    first.focus(first_source_event)
    first.focus()
    second.focus(second_source_event)
    first.blur()
    second.blur()

    expect(received_events).toEqual([
        {
            type: 'focus',
            target: first,
            current_target: ui.root,
            related_target: null,
            source_event: first_source_event,
        },
        {
            type: 'blur',
            target: first,
            current_target: ui.root,
            related_target: second,
            source_event: second_source_event,
        },
        {
            type: 'focus',
            target: second,
            current_target: ui.root,
            related_target: first,
            source_event: second_source_event,
        },
        {
            type: 'blur',
            target: second,
            current_target: ui.root,
            related_target: null,
            source_event: null,
        },
    ])

    ui.destroy()
})

test('pointerdown moves focus to its target', async () => {
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: DEFINED_EVENTS,
    })
    const first = ui.create()
    const second = ui.create()
    const received_events = []
    const first_source_event = { type: 'pointerdown' }
    const second_source_event = { type: 'pointerdown' }

    ui.root.add(first)
    ui.root.add(second)
    ui.root.on('focus', (event) =>
        received_events.push([event.type, event.target, event.related_target, event.source_event]),
    )
    ui.root.on('blur', (event) =>
        received_events.push([event.type, event.target, event.related_target, event.source_event]),
    )

    ui.events.emit(EVENT.POINTERDOWN.name, {
        source_event: first_source_event,
        event_data: { x: 0, y: 0 },
        target: first,
    })
    ui.events.emit(EVENT.POINTERDOWN.name, {
        source_event: first_source_event,
        event_data: { x: 0, y: 0 },
        target: first,
    })
    ui.events.emit(EVENT.POINTERDOWN.name, {
        source_event: second_source_event,
        event_data: { x: 10, y: 10 },
        target: second,
    })

    expect(received_events).toEqual([
        ['focus', first, null, first_source_event],
        ['blur', first, second, second_source_event],
        ['focus', second, first, second_source_event],
    ])

    ui.destroy()
})

test('destroying the focused node clears focus state', async () => {
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: DEFINED_EVENTS,
    })
    const first = ui.create()
    const second = ui.create()
    const received_events = []

    ui.root.add(first)
    ui.root.add(second)
    ui.root.on('focus', (event) => received_events.push([event.target, event.related_target]))
    ui.root.on('blur', (event) => received_events.push([event.target, event.related_target]))

    first.focus()
    first.destroy()
    second.focus()

    expect(received_events).toEqual([
        [first, null],
        [second, null],
    ])

    ui.destroy()
})

test('UI instantiates definitions, emits source events, and runs definition cleanup', async () => {
    const initialized_uis = []
    const destroyed_uis = []
    const destroyed_nodes = []
    const define_activate = ({ ui }) => {
        initialized_uis.push(ui)
        const off = ui.events_source.on('activate', (event) => {
            if (event.node !== null) {
                ui.events.emit('activate', {
                    source_event: event.source_event,
                    event_data: {
                        ...event.event_data,
                        normalized: true,
                    },
                    target: event.node,
                })
            }
        })

        return {
            destroyNode(node) {
                destroyed_nodes.push(node)
            },
            destroy() {
                destroyed_uis.push(ui)
                off()
            },
        }
    }
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: [define_activate],
    })
    const child = ui.create()
    const source_events = []
    const propagated_events = []

    ui.root.style('width', '100px')
    ui.root.style('height', '100px')
    child.style('width', '100px')
    child.style('height', '100px')
    ui.root.add(child)
    ui.update()

    ui.events_source.on('activate', (event) => source_events.push(event))
    ui.root.on('activate', (event) => {
        propagated_events.push({
            type: event.type,
            value: event.value,
            normalized: event.normalized,
            target: event.target,
            current_target: event.current_target,
        })
    })

    const source_event = { type: 'activate' }
    const event_data = { x: 10, y: 20, value: 1 }
    ui.dispatchPlatformEvent(source_event, event_data)
    ui.dispatchPlatformEvent(source_event, null)

    expect(initialized_uis).toEqual([ui])
    expect(source_events).toEqual([
        {
            source_event,
            event_data,
            node: child,
        },
        {
            source_event,
            event_data: null,
            node: null,
        },
    ])
    expect(propagated_events).toEqual([
        {
            type: 'activate',
            value: 1,
            normalized: true,
            target: child,
            current_target: ui.root,
        },
    ])

    child.destroy()
    expect(destroyed_nodes).toEqual([child])

    expect(ui.destroy()).toBe(true)
    expect(ui.destroy()).toBe(false)
    expect(destroyed_uis).toEqual([ui])

    ui.events_source.emit('activate', {
        source_event,
        event_data,
        node: child,
    })

    expect(source_events).toHaveLength(2)

    const second_ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: [define_activate],
    })

    expect(initialized_uis).toEqual([ui, second_ui])
    second_ui.destroy()
    expect(destroyed_uis).toEqual([ui, second_ui])
})

test('UI notifies every stateful definition when destroying a node subtree', async () => {
    const destroyed_nodes = []
    const define_event = (name) => () => ({
        destroyNode(node) {
            destroyed_nodes.push([name, node])
        },
        destroy() {},
    })
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: [define_event('first'), () => ({ destroy() {} }), define_event('second')],
    })
    const parent = ui.create()
    const child = ui.create()

    ui.root.add(parent)
    parent.add(child)
    parent.destroy()

    expect(destroyed_nodes).toEqual([
        ['first', child],
        ['second', child],
        ['first', parent],
        ['second', parent],
    ])

    ui.destroy()
})

test('UIDom adapts native source events and removes its listeners on destroy', async () => {
    const listeners = new Map()
    const canvas = {
        addEventListener(type, listener) {
            if (!listeners.has(type)) {
                listeners.set(type, new Set())
            }
            listeners.get(type).add(listener)
        },
        removeEventListener(type, listener) {
            listeners.get(type).delete(listener)
        },
        getBoundingClientRect() {
            return {
                left: 20,
                top: 30,
                width: 400,
                height: 200,
            }
        },
        dispatchEvent(source_event) {
            listeners.get(source_event.type)?.forEach((listener) => listener(source_event))
        },
    }
    const fonts = new EventTarget()
    const original_document = (globalThis as any).document
    ;(globalThis as any).document = { fonts }

    try {
        const resources = ResourcesDom.create({ canvas })
        const { ui } = await UIDom.create({ resources })
        const received_events = []
        let font_event_count = 0

        resources.events.on(RESOURCE_EVENT.FONT, () => font_event_count++)

        ui.root.layout = { x: 0, y: 0, width: 200, height: 100 }
        ui.root.on('pointerdown', (event) => received_events.push(event))

        const source_event = {
            type: 'pointerdown',
            target: canvas,
            pointerId: 1,
            pointerType: 'mouse',
            clientX: 120,
            clientY: 80,
        }
        canvas.dispatchEvent(source_event)
        fonts.dispatchEvent(new Event('loadingdone'))

        expect(received_events).toHaveLength(1)
        expect(received_events[0]).toMatchObject({
            type: 'pointerdown',
            x: 50,
            y: 25,
            target: ui.root,
            current_target: ui.root,
            source_event,
        })
        expect([...listeners.values()].every((event_listeners) => event_listeners.size === 1)).toBe(true)
        expect(font_event_count).toBe(1)

        ui.destroy()
        canvas.dispatchEvent(source_event)
        fonts.dispatchEvent(new Event('loadingdone'))

        expect(received_events).toHaveLength(1)
        expect([...listeners.values()].every((event_listeners) => event_listeners.size === 0)).toBe(true)
        expect(font_event_count).toBe(1)
    } finally {
        ;(globalThis as any).document = original_document
    }
})

test('pointer events use capture while hover follows the hit node', async () => {
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: DEFINED_EVENTS,
    })
    const first = ui.create()
    const second = ui.create()
    const names = new Map([
        [first, 'first'],
        [second, 'second'],
    ])
    const received_events = []

    ui.root.add(first)
    ui.root.add(second)

    const record = (event) => {
        received_events.push({
            type: event.type,
            target: names.get(event.target),
            related_target:
                'related_target' in event
                    ? event.related_target === null
                        ? null
                        : names.get(event.related_target)
                    : undefined,
            x: event.x,
        })
    }

    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointerover', 'pointerout']) {
        ui.root.on(type, record)
    }

    const dispatch = (type, pointer_id, event_data, node) => {
        ui.events_source.emit(type, {
            source_event: {
                type,
                pointerId: pointer_id,
                pointerType: 'mouse',
            },
            event_data,
            node,
        })
    }

    dispatch('pointerdown', 1, { x: 1 }, first)
    dispatch('pointermove', 1, { x: 2 }, second)
    dispatch('pointerup', 1, { x: 3 }, second)
    dispatch('pointermove', 1, null, null)

    expect(received_events).toEqual([
        { type: 'pointerover', target: 'first', related_target: null, x: 1 },
        { type: 'pointerdown', target: 'first', related_target: undefined, x: 1 },
        { type: 'pointerout', target: 'first', related_target: 'second', x: 2 },
        { type: 'pointerover', target: 'second', related_target: 'first', x: 2 },
        { type: 'pointermove', target: 'first', related_target: undefined, x: 2 },
        { type: 'pointerup', target: 'first', related_target: undefined, x: 3 },
        { type: 'pointerout', target: 'second', related_target: null, x: 3 },
    ])

    ui.destroy()
})

test('touch pointerup and pointercancel end hover after the pointer event', async () => {
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: DEFINED_EVENTS,
    })
    const node = ui.create()
    const received_events = []

    ui.root.add(node)

    for (const type of ['pointerover', 'pointerout', 'pointerup', 'pointercancel']) {
        ui.root.on(type, (event) => {
            received_events.push({
                type: event.type,
                pointer_id: event.source_event.pointerId,
                x: event.x,
            })
        })
    }

    const dispatch = (type, pointer_id, pointer_type, event_data, target) => {
        ui.events_source.emit(type, {
            source_event: {
                type,
                pointerId: pointer_id,
                pointerType: pointer_type,
            },
            event_data,
            node: target,
        })
    }

    dispatch('pointerdown', 1, 'touch', { x: 1 }, node)
    dispatch('pointerup', 1, 'touch', { x: 2 }, node)
    dispatch('pointerdown', 2, 'mouse', { x: 3 }, node)
    dispatch('pointercancel', 2, 'mouse', null, null)

    expect(received_events).toEqual([
        { type: 'pointerover', pointer_id: 1, x: 1 },
        { type: 'pointerup', pointer_id: 1, x: 2 },
        { type: 'pointerout', pointer_id: 1, x: 2 },
        { type: 'pointerover', pointer_id: 2, x: 3 },
        { type: 'pointercancel', pointer_id: 2, x: 3 },
        { type: 'pointerout', pointer_id: 2, x: 3 },
    ])

    ui.destroy()
})

test('destroying a node clears its pointer capture and hover state', async () => {
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: DEFINED_EVENTS,
    })
    const first = ui.create()
    const second = ui.create()
    const received_events = []

    ui.root.add(first)
    ui.root.add(second)

    for (const type of ['pointerover', 'pointerout', 'pointermove']) {
        ui.root.on(type, (event) => {
            received_events.push({
                type: event.type,
                target: event.target,
                related_target: event.related_target,
            })
        })
    }

    ui.events_source.emit('pointerdown', {
        source_event: { type: 'pointerdown', pointerId: 1, pointerType: 'mouse' },
        event_data: { x: 1 },
        node: first,
    })
    first.destroy()
    received_events.length = 0

    ui.events_source.emit('pointermove', {
        source_event: { type: 'pointermove', pointerId: 1, pointerType: 'mouse' },
        event_data: { x: 2 },
        node: second,
    })

    expect(received_events).toEqual([
        { type: 'pointerover', target: second, related_target: null },
        { type: 'pointermove', target: second, related_target: undefined },
    ])

    ui.destroy()
})

test('click requires a matching hit node and is cancelled by scrolling or pointercancel', async () => {
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: DEFINED_EVENTS,
    })
    const first = ui.create()
    const second = ui.create()
    const received_events = []

    ui.root.add(first)
    ui.root.add(second)
    ui.root.on('click', (event) => {
        received_events.push({
            pointer_id: event.source_event.pointerId,
            target: event.target,
            x: event.x,
        })
    })

    const dispatch = (type, pointer_id, event_data, node) => {
        ui.events_source.emit(type, {
            source_event: {
                type,
                pointerId: pointer_id,
                pointerType: 'mouse',
            },
            event_data,
            node,
        })
    }

    dispatch('pointerdown', 1, { x: 1 }, first)
    dispatch('pointerup', 1, { x: 2 }, first)

    dispatch('pointerdown', 2, { x: 3 }, first)
    dispatch('pointerup', 2, { x: 4 }, second)

    dispatch('pointerdown', 3, { x: 5 }, first)
    dispatch('pointercancel', 3, null, null)
    dispatch('pointerup', 3, { x: 6 }, first)

    dispatch('pointerdown', 4, { x: 7 }, first)
    ui.root.scrolling = true
    dispatch('pointerup', 4, { x: 8 }, first)

    dispatch('pointerdown', 5, { x: 9 }, first)
    expect(ui.root.scrolling).toBe(false)
    dispatch('pointerup', 5, { x: 10 }, first)

    expect(received_events).toEqual([
        { pointer_id: 1, target: first, x: 2 },
        { pointer_id: 5, target: first, x: 10 },
    ])

    ui.destroy()
})

test('wheel is normalized before scrolling the nearest available node', async () => {
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: DEFINED_EVENTS,
    })
    const scroller = ui.create()
    const child = ui.create()
    const received_events = []
    let update_count = 0

    ui.root.add(scroller)
    scroller.add(child)
    scroller.styles.overflowY = { parsed: { enum: OVERFLOW.scroll } }
    scroller.scrollWidth = 200
    scroller.scrollHeight = 1000
    scroller.clientWidth = 200
    scroller.clientHeight = 200
    ui.update = () => update_count++

    ui.root.on('wheel', (event) => {
        received_events.push({
            type: event.type,
            target: event.target,
            delta_x: event.delta_x,
            delta_y: event.delta_y,
        })
    })
    ui.root.on('scroll', (event) => {
        received_events.push({
            type: event.type,
            target: event.target,
            scroll_left: event.scroll_left,
            scroll_top: event.scroll_top,
        })
    })

    const source_event = {
        type: 'wheel',
        deltaX: 0,
        deltaY: 3,
        deltaMode: 1,
    }
    ui.events_source.emit('wheel', {
        source_event,
        event_data: { x: 10, y: 20 },
        node: child,
    })

    expect(received_events).toEqual([
        {
            type: 'wheel',
            target: child,
            delta_x: 0,
            delta_y: 48,
        },
        {
            type: 'scroll',
            target: scroller,
            scroll_left: 0,
            scroll_top: 192,
        },
    ])
    expect(scroller.scrollTop).toBe(192)
    expect(update_count).toBe(1)

    ui.destroy()
})

test('touch drag emits scroll and suppresses click past the scroll slop', async () => {
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: DEFINED_EVENTS,
    })
    const scroller = ui.create()
    const child = ui.create()
    const received_scrolls = []
    const received_clicks = []
    let update_count = 0

    ui.root.add(scroller)
    scroller.add(child)
    scroller.styles.overflowY = { parsed: { enum: OVERFLOW.scroll } }
    scroller.scrollWidth = 200
    scroller.scrollHeight = 1000
    scroller.clientWidth = 200
    scroller.clientHeight = 200
    ui.update = () => update_count++

    ui.root.on('scroll', (event) => {
        received_scrolls.push([event.scroll_left, event.scroll_top])
    })
    ui.root.on('click', (event) => {
        received_clicks.push(event.source_event.pointerId)
    })

    const dispatch = (type, pointer_id, x, y) => {
        ui.events_source.emit(type, {
            source_event: {
                type,
                pointerId: pointer_id,
                pointerType: 'touch',
            },
            event_data: { x, y },
            node: child,
        })
    }

    dispatch('pointerdown', 1, 0, 100)
    dispatch('pointermove', 1, 0, 60)
    dispatch('pointerup', 1, 0, 60)

    dispatch('pointerdown', 2, 0, 100)
    dispatch('pointerup', 2, 0, 100)

    expect(received_scrolls).toEqual([[0, 40]])
    expect(received_clicks).toEqual([2])
    expect(scroller.scrolling).toBe(false)
    expect(update_count).toBe(1)

    ui.destroy()
})

test('destroying referenced nodes clears click and scroll state', async () => {
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: DEFINED_EVENTS,
    })
    const scroller = ui.create()
    const child = ui.create()
    const normalized_events = []

    ui.root.add(scroller)
    scroller.add(child)
    scroller.styles.overflowY = { parsed: { enum: OVERFLOW.scroll } }
    scroller.scrollWidth = 200
    scroller.scrollHeight = 1000
    scroller.clientWidth = 200
    scroller.clientHeight = 200

    for (const type of ['click', 'scroll']) {
        ui.events.on(type, (event) => normalized_events.push(event))
    }

    ui.events_source.emit('pointerdown', {
        source_event: { type: 'pointerdown', pointerId: 1, pointerType: 'touch' },
        event_data: { x: 0, y: 100 },
        node: child,
    })
    scroller.destroy()

    ui.events_source.emit('pointermove', {
        source_event: { type: 'pointermove', pointerId: 1, pointerType: 'touch' },
        event_data: { x: 0, y: 50 },
        node: null,
    })
    ui.events_source.emit('pointerup', {
        source_event: { type: 'pointerup', pointerId: 1, pointerType: 'touch' },
        event_data: { x: 0, y: 50 },
        node: child,
    })

    expect(normalized_events).toEqual([])
    expect(scroller.scrollTop).toBe(0)

    ui.destroy()
})

test('Node receives public events without receiving source events', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const parent = ui.create()
    const child = ui.create()
    const sibling = ui.create()
    const calls = []
    const dispatched_events = []
    const source_event = { type: 'activate' }

    ui.root.add(parent)
    parent.add(child)
    ui.root.add(sibling)

    parent.on('activate', (event) => {
        dispatched_events.push(event)
        calls.push({
            listener: 'parent',
            type: event.type,
            value: event.value,
            target: event.target,
            current_target: event.current_target,
            related_target: event.related_target,
            source_event: event.source_event,
        })
    })
    ui.root.on('activate', (event) => {
        dispatched_events.push(event)
        calls.push({
            listener: 'root',
            type: event.type,
            value: event.value,
            target: event.target,
            current_target: event.current_target,
            related_target: event.related_target,
            source_event: event.source_event,
        })
    })
    sibling.on('activate', () => calls.push({ listener: 'sibling' }))

    ui.events_source.emit('activate', {
        source_event,
        event_data: { value: 0 },
        node: child,
    })
    ui.events.emit('activate', {
        source_event,
        event_data: { value: 1 },
        target: child,
        related_target: sibling,
    })

    expect(calls).toEqual([
        {
            listener: 'parent',
            type: 'activate',
            value: 1,
            target: child,
            current_target: parent,
            related_target: sibling,
            source_event,
        },
        {
            listener: 'root',
            type: 'activate',
            value: 1,
            target: child,
            current_target: ui.root,
            related_target: sibling,
            source_event,
        },
    ])
    expect(dispatched_events[0]).toBe(dispatched_events[1])

    let has_related_target
    parent.on('plain', (event) => {
        has_related_target = 'related_target' in event
    })
    ui.events.emit('plain', {
        source_event,
        event_data: {},
        target: child,
    })

    expect(has_related_target).toBe(false)

    ui.destroy()
})

test('Node handles duplicate listeners, off, stopPropagation, and destruction', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const parent = ui.create()
    const child = ui.create()
    const calls = []
    const duplicate_listener = () => calls.push('duplicate')

    ui.root.add(parent)
    parent.add(child)

    child.on('activate', duplicate_listener)
    child.on('activate', duplicate_listener)
    child.on('activate', (event) => {
        calls.push('child-first')
        event.stopPropagation()
    })
    child.on('activate', () => calls.push('child-second'))
    parent.on('activate', () => calls.push('parent'))

    ui.events.emit('activate', {
        source_event: { type: 'activate' },
        event_data: {},
        target: child,
    })

    expect(calls).toEqual(['duplicate', 'child-first', 'child-second'])

    child.off('activate', duplicate_listener)
    calls.length = 0
    ui.events.emit('activate', {
        source_event: { type: 'activate' },
        event_data: {},
        target: child,
    })

    expect(calls).toEqual(['child-first', 'child-second'])

    let destroyed_calls = 0
    const destroyed_child = child
    child.on('destroyed', () => destroyed_calls++)
    child.destroy()
    ui.events.emit('destroyed', {
        source_event: { type: 'destroyed' },
        event_data: {},
        target: destroyed_child,
    })

    expect(destroyed_calls).toBe(0)

    let ui_destroyed_calls = 0
    const root = ui.root
    root.on('destroyed', () => ui_destroyed_calls++)
    ui.destroy()
    ui.events.emit('destroyed', {
        source_event: { type: 'destroyed' },
        event_data: {},
        target: root,
    })

    expect(ui_destroyed_calls).toBe(0)
})
