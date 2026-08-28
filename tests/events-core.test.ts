import { expect, test } from '@playwright/test'
import Events from '../src/core/Events'
import TestRenderer from './utils/TestRenderer.ts'
import TestUI from './utils/TestUI.ts'

test('Events registers, removes, emits, and destroys listeners', () => {
    const events = new Events()
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

test('UI instantiates definitions, emits raw events, and runs definition cleanup', async () => {
    const initialized_uis = []
    const destroyed_uis = []
    const define_activate = ({ ui }) => {
        initialized_uis.push(ui)
        const off = ui.events.on('activate', (event) => {
            if (event.raw && event.node !== null) {
                ui.events.emit('activate', {
                    raw: false,
                    source_event: event.source_event,
                    event_data: {
                        ...event.event_data,
                        normalized: true,
                    },
                    target: event.node,
                })
            }
        })

        return () => {
            destroyed_uis.push(ui)
            off()
        }
    }
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: [define_activate],
    })
    const child = ui.create()
    const raw_events = []
    const propagated_events = []

    ui.root.style('width', '100px')
    ui.root.style('height', '100px')
    child.style('width', '100px')
    child.style('height', '100px')
    ui.root.add(child)
    ui.update()

    ui.events.on('activate', (event) => {
        if (event.raw) {
            raw_events.push(event)
        }
    })
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
    ui.dispatchEvent(source_event, event_data)
    ui.dispatchEvent(source_event, null)

    expect(initialized_uis).toEqual([ui])
    expect(raw_events).toEqual([
        {
            raw: true,
            source_event,
            event_data,
            node: child,
        },
        {
            raw: true,
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

    expect(ui.destroy()).toBe(true)
    expect(ui.destroy()).toBe(false)
    expect(destroyed_uis).toEqual([ui])

    ui.events.emit('activate', {
        raw: true,
        source_event,
        event_data,
        node: child,
    })

    expect(raw_events).toHaveLength(2)

    const second_ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: [define_activate],
    })

    expect(initialized_uis).toEqual([ui, second_ui])
    second_ui.destroy()
    expect(destroyed_uis).toEqual([ui, second_ui])
})

test('Node ignores raw events and bubbles normalized events from the target', async () => {
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

    ui.events.emit('activate', {
        raw: true,
        source_event,
        event_data: { value: 0 },
        node: child,
    })
    ui.events.emit('activate', {
        raw: false,
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
        raw: false,
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
        raw: false,
        source_event: { type: 'activate' },
        event_data: {},
        target: child,
    })

    expect(calls).toEqual(['duplicate', 'child-first', 'child-second'])

    child.off('activate', duplicate_listener)
    calls.length = 0
    ui.events.emit('activate', {
        raw: false,
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
        raw: false,
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
        raw: false,
        source_event: { type: 'destroyed' },
        event_data: {},
        target: root,
    })

    expect(ui_destroyed_calls).toBe(0)
})
