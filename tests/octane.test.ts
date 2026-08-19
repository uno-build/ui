import { expect, test } from '@playwright/test'
import { defineUniversalComponent, universalFor, universalPlan, universalValue } from 'octane/universal/native'
import { createUniversalDriver, registerRootComponent } from '../src/components/octane/index.js'
import TestRenderer from './TestRenderer.ts'
import TestUI from './TestUI.ts'

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

test('Octane create and insert build the Uno node tree and apply initial styles', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    const root = registerRootComponent(STATIC_TREE_COMPONENT, { ui })
    const created_nodes = []
    const create_node = ui.create.bind(ui)
    let update_count = 0
    const update_ui = ui.update.bind(ui)

    ui.create = () => {
        const node = create_node()
        created_nodes.push(node)
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

    expect(created_nodes).toEqual([parent, first_child, second_child])
    expect([...ui.nodes]).toEqual([parent, first_child, second_child])
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
    expect([...ui.nodes]).toEqual([node])
    expect(node.styles.width.value).toBe('200px')
    expect(node.styles.height.value).toBe('60px')
    expect(node.styles.backgroundColor.value).toBe('#00f')
})

test('Octane refs receive the Uno node public instance', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    const root = registerRootComponent(REF_COMPONENT, { ui })
    const ref = { current: null }

    root.render({ ref })

    const node = ui.root.children[0]
    expect(ref.current).toBe(node)

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
    expect([...ui.nodes]).toEqual([])
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
    expect([...first_ui.nodes]).toEqual([])
    expect(second_ui.root.children).toEqual([second_parent])
    expect(second_parent.children).toEqual(second_children)
    expect(second_parent.ui).toBe(second_ui)

    second_root.unmount()

    expect(second_ui.root.children).toEqual([])
    expect([...second_ui.nodes]).toEqual([])
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
