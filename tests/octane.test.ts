import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compile } from 'octane/compiler'
import {
    defineUniversalComponent,
    universalFor,
    universalPlan,
    universalValue,
    useState,
} from 'octane/universal/native'
import { useUI } from '../src/components/octane/context.ts'
import { createUniversalDriver, registerRootComponent } from '../src/components/octane/driver.ts'
import { getImageStyle } from '../src/components/shared.ts'
import EventEmitter from '../src/core/EventEmitter'
import { DEFINED_EVENTS } from '../src/events'
import TestRenderer from './utils/TestRenderer.ts'
import TestUI from './utils/TestUI.ts'

const COMPONENTS_URL = new URL('../src/components/octane/components.tsx', import.meta.url)
const OCTANE_RENDERER = {
    id: 'uno',
    module: 'octane/universal/native',
    target: 'universal' as const,
    server: 'client-only',
    text: 'host',
}

const compiled_components = compile(readFileSync(COMPONENTS_URL, 'utf8'), fileURLToPath(COMPONENTS_URL), {
    mode: 'client',
    renderer: OCTANE_RENDERER,
    rendererRegistry: { uno: OCTANE_RENDERER },
})
    .code.replaceAll("from 'octane/universal/native'", `from '${import.meta.resolve('octane/universal/native')}'`)
    .replace("from './context'", `from '${new URL('../src/components/octane/context.ts', import.meta.url)}'`)
    .replace("from '../shared'", `from '${new URL('../src/components/shared.ts', import.meta.url)}'`)

const { Image, Input, ScrollView, Text, View } = await import(
    `data:text/javascript;base64,${Buffer.from(compiled_components).toString('base64')}`
)

const clickAt = (ui, x, y) => {
    ui.dispatchPlatformEvent({ type: 'pointerdown', pointerId: 1 }, { x, y })
    ui.dispatchPlatformEvent({ type: 'pointerup', pointerId: 1 }, { x, y })
}

const createEventUI = () =>
    TestUI.create({
        renderer: new TestRenderer(),
        defined_events: DEFINED_EVENTS,
    })

const STATIC_TREE_PLAN = universalPlan('uno', {
    kind: 'host',
    type: 'view',
    props: { style: { width: '120px', height: '80px' } },
    children: [
        {
            kind: 'host',
            type: 'view',
            props: { style: { width: '40px', height: '30px' } },
        },
        {
            kind: 'host',
            type: 'view',
            props: { style: { width: '50px', height: '20px' } },
        },
    ],
})

const STATIC_TREE_COMPONENT = defineUniversalComponent('uno', () => universalValue(STATIC_TREE_PLAN))
const received_uis = []
const UI_CONTEXT_COMPONENT = defineUniversalComponent('uno', () => {
    received_uis.push(useUI())
    return universalValue(STATIC_TREE_PLAN)
})

const DYNAMIC_STYLE_PLAN = universalPlan('uno', {
    kind: 'host',
    type: 'view',
    bindings: [['style', 0]],
})

const DYNAMIC_STYLE_COMPONENT = defineUniversalComponent<{ style: Record<string, string> }>('uno', (props) =>
    universalValue(DYNAMIC_STYLE_PLAN, [props.style]),
)

const REF_PLAN = universalPlan('uno', {
    kind: 'host',
    type: 'view',
    bindings: [['ref', 0]],
})

const REF_COMPONENT = defineUniversalComponent<{ ref: { current: unknown } }>('uno', (props) =>
    universalValue(REF_PLAN, [props.ref]),
)

const CONDITIONAL_TREE_PLAN = universalPlan('uno', {
    kind: 'if',
    conditionSlot: 0,
    then: {
        kind: 'host',
        type: 'view',
        props: { style: { width: '100px' } },
        children: [
            {
                kind: 'host',
                type: 'view',
                props: { style: { height: '50px' } },
            },
        ],
    },
})

const CONDITIONAL_TREE_COMPONENT = defineUniversalComponent<{ visible: boolean }>('uno', (props) =>
    universalValue(CONDITIONAL_TREE_PLAN, [props.visible]),
)

const KEYED_ITEM_PLAN = universalPlan('uno', {
    kind: 'host',
    type: 'view',
    bindings: [['style', 0]],
})

const KEYED_LIST_PLAN = universalPlan('uno', {
    kind: 'host',
    type: 'view',
    children: [{ kind: 'slot', slot: 0 }],
})

const KEYED_LIST_COMPONENT = defineUniversalComponent<{ items: { id: string; width: string }[] }>('uno', (props) =>
    universalValue(KEYED_LIST_PLAN, [
        universalFor(
            props.items,
            (item) => item.id,
            (item) => universalValue(KEYED_ITEM_PLAN, [{ width: item.width }]),
        ),
    ]),
)

const UNSUPPORTED_TAG_PLAN = universalPlan('uno', {
    kind: 'host',
    type: 'image',
})

const UNSUPPORTED_TAG_COMPONENT = defineUniversalComponent('uno', () => universalValue(UNSUPPORTED_TAG_PLAN))

const VIEW_INSIDE_TEXT_PLAN = universalPlan('uno', {
    kind: 'host',
    type: 'text',
    children: [{ kind: 'host', type: 'view' }],
})

const VIEW_INSIDE_TEXT_COMPONENT = defineUniversalComponent('uno', () => universalValue(VIEW_INSIDE_TEXT_PLAN))

const TEXT_INSIDE_VIEW_PLAN = universalPlan('uno', {
    kind: 'host',
    type: 'view',
    children: [{ kind: 'text', value: 'Text' }],
})

const TEXT_INSIDE_VIEW_COMPONENT = defineUniversalComponent('uno', () => universalValue(TEXT_INSIDE_VIEW_PLAN))

const DYNAMIC_TEXT_PLAN = universalPlan('uno', {
    kind: 'host',
    type: 'text',
    children: [{ kind: 'text', slot: 0 }],
})

const DYNAMIC_TEXT_COMPONENT = defineUniversalComponent<{ value: string }>('uno', (props) =>
    universalValue(DYNAMIC_TEXT_PLAN, [props.value]),
)

const CONDITIONAL_TEXT_PLAN = universalPlan('uno', {
    kind: 'host',
    type: 'text',
    children: [
        {
            kind: 'if',
            conditionSlot: 0,
            then: { kind: 'text', value: 'Contenido' },
        },
    ],
})

const CONDITIONAL_TEXT_COMPONENT = defineUniversalComponent<{ visible: boolean }>('uno', (props) =>
    universalValue(CONDITIONAL_TEXT_PLAN, [props.visible]),
)

const EVENT_TREE_PLAN = universalPlan('uno', {
    kind: 'host',
    type: 'view',
    props: { style: { width: '100px', height: '50px' } },
    bindings: [['onClick', 0]],
    children: [
        {
            kind: 'host',
            type: 'view',
            props: { style: { width: '40px', height: '20px' } },
        },
    ],
})

const EVENT_TREE_COMPONENT = defineUniversalComponent<{ onClick: ((event: unknown) => void) | null }>('uno', (props) =>
    universalValue(EVENT_TREE_PLAN, [props.onClick]),
)

const COUNTER_PLAN = universalPlan('uno', {
    kind: 'host',
    type: 'view',
    bindings: [
        ['style', 0],
        ['onClick', 1],
    ],
})

const COUNTER_COMPONENT = defineUniversalComponent('uno', () => {
    const [count, setCount] = useState(0)

    return universalValue(COUNTER_PLAN, [
        { width: `${100 + count}px`, height: '50px' },
        () => setCount((current) => current + 1),
    ])
})

test('Octane create and insert build the Uno node tree and apply initial styles', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    const root = registerRootComponent(STATIC_TREE_COMPONENT, { ui })
    const nodes_created = []
    const create_node = ui.create.bind(ui)
    let update_count = 0
    const update_ui = ui.update.bind(ui)

    ui.create = () => {
        const node = create_node()
        nodes_created.push(node)
        return node
    }
    ui.update = () => {
        update_count++
        return update_ui()
    }

    root.render(STATIC_TREE_COMPONENT, {})

    const parent = ui.root.children[0]
    const first_child = parent.children[0]
    const second_child = parent.children[1]

    expect(nodes_created).toEqual([parent, first_child, second_child])
    expect([...ui.nodes]).toEqual([ui.root, parent, first_child, second_child])
    expect(parent.parent).toBe(ui.root)
    expect(parent.children).toEqual([first_child, second_child])
    expect(first_child.parent).toBe(parent)
    expect(second_child.parent).toBe(parent)
    expect(parent.path).toEqual([0])
    expect(first_child.path).toEqual([0, 0])
    expect(second_child.path).toEqual([0, 1])
    expect(parent.styles.width.value).toBe('120px')
    expect(parent.styles.height.value).toBe('80px')
    expect(first_child.styles.width.value).toBe('40px')
    expect(second_child.styles.width.value).toBe('50px')
    expect(update_count).toBe(1)
})

test('Octane update changes Uno styles without replacing node identity', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    const root = registerRootComponent(DYNAMIC_STYLE_COMPONENT, { ui })

    root.render({
        style: { width: '100px', height: '40px', backgroundColor: '#f00' },
    })

    const node = ui.root.children[0]

    root.render({
        style: { width: '200px', height: '60px', backgroundColor: '#00f' },
    })

    expect(ui.root.children).toEqual([node])
    expect([...ui.nodes]).toEqual([ui.root, node])
    expect(node.styles.width.value).toBe('200px')
    expect(node.styles.height.value).toBe('60px')
    expect(node.styles.backgroundColor.value).toBe('#00f')
})

test('Octane refs receive the public instance containing the main Uno node', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    const root = registerRootComponent(REF_COMPONENT, { ui })
    const ref = { current: null }

    root.render({ ref })

    const node = ui.root.children[0]
    expect(ref.current).toEqual({ nodes: { main: node } })

    root.unmount()

    expect(ref.current).toBe(null)
})

for (const [name, Component, props] of [
    ['View', View, {}],
    ['Text', Text, {}],
    ['Image', Image, { src: 'image' }],
]) {
    test(`${name} refs expose the main Uno node`, async () => {
        const resources = {
            getImageSize: () => ({ width: 10, height: 10 }),
            events: new EventEmitter(),
        }
        const ui = await TestUI.create({ renderer: new TestRenderer(), resources })
        const root = registerRootComponent(Component, { ui })
        const ref = { current: null }

        root.render({ ...props, ref })

        const node = ui.root.children[0]
        expect(ref.current).toEqual({ nodes: { main: node } })

        root.unmount()

        expect(ref.current).toBe(null)
    })
}

test('ScrollView refs expose the main and content Uno nodes', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const root = registerRootComponent(ScrollView, { ui })
    const ref = { current: null }

    root.render({ ref })

    const main = ui.root.children[0]
    const content = main.children[0]
    expect(ref.current).toEqual({ nodes: { main, content } })

    root.unmount()

    expect(ref.current).toBe(null)
})

test('Input refs expose its Uno nodes and focus and blur the main node', async () => {
    const ui = await createEventUI()
    const root = registerRootComponent(Input, { ui })
    const ref = { current: null }

    root.render({ ref, value: 'Value' })

    const main = ui.root.children[0]
    const content = main.children[0]
    const text = content.children[0]
    let focus_count = 0
    let blur_count = 0
    const focus = main.focus.bind(main)
    const blur = main.blur.bind(main)
    main.focus = (...args) => {
        focus_count++
        focus(...args)
    }
    main.blur = (...args) => {
        blur_count++
        blur(...args)
    }

    expect(ref.current.nodes).toEqual({ main, content, text, caret: null })
    expect(ref.current.focus).toEqual(expect.any(Function))
    expect(ref.current.blur).toEqual(expect.any(Function))

    ref.current.focus()

    const caret = content.children[1]
    expect(focus_count).toBe(1)
    expect(ref.current.nodes).toEqual({ main, content, text, caret })

    ref.current.blur()

    expect(blur_count).toBe(1)
    expect(ref.current.nodes).toEqual({ main, content, text, caret: null })

    root.unmount()

    expect(ref.current).toBe(null)
})

test('Octane insert and move place nodes before existing siblings', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    const root = registerRootComponent(KEYED_LIST_COMPONENT, { ui })
    const a = { id: 'a', width: '10px' }
    const b = { id: 'b', width: '20px' }
    const c = { id: 'c', width: '30px' }
    const x = { id: 'x', width: '40px' }

    root.render({ items: [a, b, c] })

    const parent = ui.root.children[0]
    const [a_node, b_node, c_node] = parent.children

    root.render({ items: [c, a, b] })

    expect(parent.children).toEqual([c_node, a_node, b_node])
    expect(parent.children.map((node) => node.path)).toEqual([
        [0, 0],
        [0, 1],
        [0, 2],
    ])

    root.render({ items: [c, x, a, b] })

    const x_node = parent.children[1]
    expect(parent.children).toEqual([c_node, x_node, a_node, b_node])
    expect(x_node.styles.width.value).toBe('40px')
})

test('Octane remove and destroy detach and release the Uno subtree in order', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    const root = registerRootComponent(CONDITIONAL_TREE_COMPONENT, { ui })
    const operations = []
    const detach_child = renderer.detachChild.bind(renderer)
    const destroy_node = renderer.destroyNode.bind(renderer)
    let update_count = 0
    const update_ui = ui.update.bind(ui)

    renderer.detachChild = (parent, node) => {
        operations.push({ op: 'detach', parent, node })
        detach_child(parent, node)
    }
    renderer.destroyNode = (node) => {
        operations.push({ op: 'destroy', node })
        destroy_node(node)
    }
    ui.update = () => {
        update_count++
        return update_ui()
    }

    root.render({ visible: true })

    const parent = ui.root.children[0]
    const child = parent.children[0]

    root.render({ visible: false })

    expect(operations).toEqual([
        { op: 'detach', parent: ui.root, node: parent },
        { op: 'detach', parent, node: child },
        { op: 'destroy', node: child },
        { op: 'destroy', node: parent },
    ])
    expect(update_count).toBe(2)
    expect([...ui.nodes]).toEqual([ui.root])
    expect(ui.root.children).toEqual([])
    expect(parent.ui).toBe(null)
    expect(child.ui).toBe(null)
    expect(parent.element).toBe(null)
    expect(child.element).toBe(null)
})

test('Octane roots keep create, insert, remove, and destroy state isolated', async () => {
    const first_ui = await TestUI.create({ renderer: new TestRenderer() })
    const second_ui = await TestUI.create({ renderer: new TestRenderer() })
    const first_root = registerRootComponent(STATIC_TREE_COMPONENT, { ui: first_ui })
    const second_root = registerRootComponent(STATIC_TREE_COMPONENT, { ui: second_ui })

    first_root.render({})
    second_root.render({})

    const second_parent = second_ui.root.children[0]
    const second_children = [...second_parent.children]

    first_root.unmount()

    expect(first_ui.root.children).toEqual([])
    expect([...first_ui.nodes]).toEqual([first_ui.root])
    expect(second_ui.root.children).toEqual([second_parent])
    expect(second_parent.children).toEqual(second_children)
    expect(second_parent.ui).toBe(second_ui)

    second_root.unmount()

    expect(second_ui.root.children).toEqual([])
    expect([...second_ui.nodes]).toEqual([second_ui.root])
})

test('Octane roots expose their own UI through useUI', async () => {
    const first_ui = await TestUI.create({ renderer: new TestRenderer() })
    const second_ui = await TestUI.create({ renderer: new TestRenderer() })
    const first_root = registerRootComponent(UI_CONTEXT_COMPONENT, { ui: first_ui })
    const second_root = registerRootComponent(UI_CONTEXT_COMPONENT, { ui: second_ui })
    received_uis.length = 0

    first_root.render({})
    second_root.render({})

    expect(received_uis).toEqual([first_ui, second_ui])
})

test('Image derives intrinsic size from registered resources', () => {
    const resources = {
        getImageSize() {
            return { width: 40, height: 20 }
        },
    }

    expect(getImageStyle(resources, 'coin')).toEqual({
        width: '40px',
        height: '20px',
        backgroundImage: 'coin',
        backgroundSize: '100% 100%',
        backgroundPosition: '50% 50%',
    })
    expect(getImageStyle(resources, 'coin', { width: '100px' })).toEqual({
        width: '100px',
        aspectRatio: '2',
        backgroundImage: 'coin',
        backgroundSize: '100% 100%',
        backgroundPosition: '50% 50%',
    })
    expect(getImageStyle(resources, 'coin', { height: '100px' })).toEqual({
        height: '100px',
        aspectRatio: '2',
        backgroundImage: 'coin',
        backgroundSize: '100% 100%',
        backgroundPosition: '50% 50%',
    })
    expect(getImageStyle(resources, 'coin', { width: '100px', height: '80px' })).toEqual({
        width: '100px',
        height: '80px',
        backgroundImage: 'coin',
        backgroundSize: '100% 100%',
        backgroundPosition: '50% 50%',
    })
})

test('Image preserves explicit aspect ratio and owns its background styles', () => {
    const resources = {
        getImageSize() {
            return { width: 40, height: 20 }
        },
    }

    expect(
        getImageStyle(resources, 'coin', {
            width: '100px',
            aspectRatio: '3',
            backgroundImage: 'other',
            backgroundSize: 'contain',
        }),
    ).toEqual({
        width: '100px',
        aspectRatio: '3',
        backgroundImage: 'coin',
        backgroundSize: '100% 100%',
        backgroundPosition: '50% 50%',
    })
})

test('Image maps objectFit to background styles', () => {
    const resources = {
        getImageSize() {
            return { width: 40, height: 20 }
        },
    }

    for (const [object_fit, background_size] of [
        ['fill', '100% 100%'],
        ['contain', 'contain'],
        ['cover', 'cover'],
        ['none', 'unset'],
    ]) {
        expect(getImageStyle(resources, 'coin', { width: '100px', height: '50px', objectFit: object_fit })).toEqual({
            width: '100px',
            height: '50px',
            backgroundImage: 'coin',
            backgroundSize: background_size,
            backgroundPosition: '50% 50%',
        })
    }
})

test('Image rejects unsupported objectFit values', () => {
    const resources = {
        getImageSize() {
            return { width: 40, height: 20 }
        },
    }

    expect(() => getImageStyle(resources, 'coin', { objectFit: 'scale-down' })).toThrow(
        'Unsupported objectFit "scale-down".',
    )
})

test('Image recalculates its ratio when src changes', () => {
    const sizes = {
        coin: { width: 40, height: 20 },
        card: { width: 30, height: 60 },
    }
    const resources = {
        getImageSize(src) {
            return sizes[src]
        },
    }

    expect(getImageStyle(resources, 'coin', { width: '100px' }).aspectRatio).toBe('2')
    expect(getImageStyle(resources, 'card', { width: '100px' }).aspectRatio).toBe('0.5')
})

test('Image rejects unregistered sources', () => {
    const resources = { getImageSize: () => undefined }

    expect(() => getImageStyle(resources, 'missing.png')).toThrow('Image source "missing.png" is not registered.')
})

test('Octane rejects unsupported tag elements', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const root = registerRootComponent(UNSUPPORTED_TAG_COMPONENT, { ui })

    expect(() => root.render({})).toThrow("Unsupported tag element '<image>'")
})

test('Octane rejects View children inside Text', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const root = registerRootComponent(VIEW_INSIDE_TEXT_COMPONENT, { ui })

    expect(() => root.render({})).toThrow('<Text> cannot have children.')
})

test('Octane rejects text children outside Text', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const root = registerRootComponent(TEXT_INSIDE_VIEW_COMPONENT, { ui })

    expect(() => root.render({})).toThrow('Texts must be inserted into a <Text> component.')
})

test('Octane rejects unsupported renderer commands', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const driver = createUniversalDriver({ ui })
    const batch = driver.prepareBatch(
        {},
        {
            commands: [{ op: 'visibility' }],
        },
    )

    expect(() => batch.apply()).toThrow("Octane components does not support command 'visibility'")
})

test('Octane updates text content without replacing the Text node', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const root = registerRootComponent(DYNAMIC_TEXT_COMPONENT, { ui })

    root.render({ value: 'Antes' })

    const text_node = ui.root.children[0]

    root.render({ value: 'Después' })

    expect(ui.root.children).toEqual([text_node])
    expect(text_node.text_content).toBe('Después')
})

test('Octane clears removed conditional text without removing the Text node', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const root = registerRootComponent(CONDITIONAL_TEXT_COMPONENT, { ui })

    root.render({ visible: true })

    const text_node = ui.root.children[0]

    expect(() => root.render({ visible: false })).not.toThrow()
    expect(ui.root.children).toEqual([text_node])
    expect(text_node.text_content).toBe('')
})

test('Octane unmounts Text with text content without retaining nodes', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const root = registerRootComponent(DYNAMIC_TEXT_COMPONENT, { ui })

    root.render({ value: 'Contenido' })

    const text_node = ui.root.children[0]

    expect(() => root.unmount()).not.toThrow()
    expect(ui.root.children).toEqual([])
    expect([...ui.nodes]).toEqual([ui.root])
    expect(text_node.ui).toBe(null)
    expect(text_node.element).toBe(null)
})

test('Octane classifies event props from the Uno event metadata', async () => {
    const ui = await createEventUI()
    const driver = createUniversalDriver({ ui })

    expect(driver.events.classify('onClick')).toEqual({ type: 'click', priority: 'discrete' })
    expect(driver.events.classify('onPointerMove')).toEqual({ type: 'pointermove', priority: 'continuous' })
    expect(driver.events.classify('onPointerOut')).toEqual({ type: 'pointerout', priority: 'continuous' })
    expect(driver.events.classify('onScroll')).toEqual({ type: 'scroll', priority: 'continuous' })
    expect(driver.events.classify('style')).toBe(null)
})

test('Octane event handlers receive Uno events through hit testing and bubbling', async () => {
    const ui = await createEventUI()
    const root = registerRootComponent(EVENT_TREE_COMPONENT, { ui })
    const received_events = []

    root.render({
        onClick: (event) =>
            received_events.push({
                type: event.type,
                target: event.target,
                current_target: event.current_target,
            }),
    })

    const parent = ui.root.children[0]
    const child = parent.children[0]

    clickAt(ui, 10, 10)

    expect(received_events).toEqual([{ type: 'click', target: child, current_target: parent }])
})

test('Octane keeps a single Uno listener when the handler changes between renders', async () => {
    const ui = await createEventUI()
    const root = registerRootComponent(EVENT_TREE_COMPONENT, { ui })
    const registrations = []
    const removals = []
    const received_events = []
    const register_listener = ui.events.on.bind(ui.events)
    const remove_listener = ui.events.off.bind(ui.events)

    ui.events.on = (type, listener) => {
        registrations.push(type)
        return register_listener(type, listener)
    }
    ui.events.off = (type, listener) => {
        removals.push(type)
        remove_listener(type, listener)
    }

    root.render({ onClick: () => received_events.push('first') })

    root.render({ onClick: () => received_events.push('second') })

    clickAt(ui, 10, 10)

    expect(received_events).toEqual(['second'])
    expect(registrations).toEqual(['click'])
    expect(removals).toEqual([])
})

test('Octane removes the Uno listener when the event prop is cleared', async () => {
    const ui = await createEventUI()
    const root = registerRootComponent(EVENT_TREE_COMPONENT, { ui })
    const received_events = []

    root.render({ onClick: () => received_events.push('first') })

    const parent = ui.root.children[0]

    root.render({ onClick: null })

    clickAt(ui, 10, 10)

    expect(received_events).toEqual([])

    root.render({ onClick: () => received_events.push('second') })

    clickAt(ui, 10, 10)

    expect(ui.root.children).toEqual([parent])
    expect(received_events).toEqual(['second'])
})

test('Octane commits state updates from an event handler within the dispatch', async () => {
    const ui = await createEventUI()
    const root = registerRootComponent(COUNTER_COMPONENT, { ui })

    root.render({})

    const node = ui.root.children[0]

    expect(node.styles.width.value).toBe('100px')

    clickAt(ui, 10, 10)

    expect(ui.root.children).toEqual([node])
    expect(node.styles.width.value).toBe('101px')
})

test('Octane moves text content between Text parents', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const driver = createUniversalDriver({ ui })
    const initial_batch = driver.prepareBatch(
        {},
        {
            commands: [
                { op: 'create', id: 1, type: 'text', props: {} },
                { op: 'create', id: 2, type: 'text', props: {} },
                { op: 'create', id: 3, type: '#text', props: { value: 'Contenido' } },
                { op: 'insert', id: 1, parent: null, before: null },
                { op: 'insert', id: 2, parent: null, before: null },
                { op: 'insert', id: 3, parent: 1, before: null },
            ],
        },
    )

    initial_batch.apply()

    const [first_text, second_text] = ui.root.children
    const move_batch = driver.prepareBatch(
        {},
        {
            commands: [{ op: 'move', id: 3, parent: 2, before: null }],
        },
    )

    move_batch.apply()

    expect(first_text.text_content).toBe('')
    expect(second_text.text_content).toBe('Contenido')
})
