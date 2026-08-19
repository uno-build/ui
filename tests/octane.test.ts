import { expect, test } from '@playwright/test'
import {
    defineUniversalComponent,
    universalPlan,
    universalValue,
} from 'octane/universal/native'
import { createUniversalRendererRoot } from '../src/components/octane/index.js'
import TestRenderer from './TestRenderer.ts'
import TestUI from './TestUI.ts'

const CONDITIONAL_PLAN = universalPlan('uno', {
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

const CONDITIONAL_COMPONENT = defineUniversalComponent<{ visible: boolean }>('uno', (props) =>
    universalValue(CONDITIONAL_PLAN, [props.visible]),
)

test('Octane remove and destroy detach and release a conditional subtree', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    const root = createUniversalRendererRoot({ ui })
    const destroyed_nodes = []
    const destroy_node = renderer.destroyNode.bind(renderer)

    renderer.destroyNode = (node) => {
        destroyed_nodes.push(node)
        destroy_node(node)
    }

    root.render(CONDITIONAL_COMPONENT, { visible: true })

    const parent = ui.root.children[0]
    const child = parent.children[0]
    expect([...ui.nodes]).toEqual([parent, child])

    root.render(CONDITIONAL_COMPONENT, { visible: false })

    expect(destroyed_nodes).toEqual([child, parent])
    expect([...ui.nodes]).toEqual([])
    expect(ui.root.children).toEqual([])
    expect(parent.ui).toBe(null)
    expect(child.ui).toBe(null)
})

test('Octane roots keep host instance ids isolated', async () => {
    const first_ui = await TestUI.create({ renderer: new TestRenderer() })
    const second_ui = await TestUI.create({ renderer: new TestRenderer() })
    const first_root = createUniversalRendererRoot({ ui: first_ui })
    const second_root = createUniversalRendererRoot({ ui: second_ui })

    first_root.render(CONDITIONAL_COMPONENT, { visible: true })
    second_root.render(CONDITIONAL_COMPONENT, { visible: true })

    const second_parent = second_ui.root.children[0]
    first_root.unmount()

    expect(first_ui.root.children).toEqual([])
    expect(second_ui.root.children).toEqual([second_parent])
    expect(second_parent.ui).toBe(second_ui)

    second_root.unmount()

    expect(second_ui.root.children).toEqual([])
})
