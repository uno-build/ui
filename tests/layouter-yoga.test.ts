import { expect, test } from '@playwright/test'
import { loadYoga } from 'yoga-layout/load'
import createYogaLayouter from '../src/layouter/yoga.ts'
import Style, { computeStyleValue } from '../src/style'
import { MEASURE_MODE } from '../src/style/consts'

test('Yoga layouter keeps handles private and returns computed box metrics', async () => {
    const layouter = await createYogaLayouter({ loadYoga })
    const root = createNode(0)
    const child = createNode(1, root)

    layouter.createNode(root)
    layouter.createNode(child)
    layouter.insertChild(root, child, 0)
    applyStyle(layouter, root, 'width', '100px')
    applyStyle(layouter, root, 'height', '100px')
    applyStyle(layouter, child, 'width', '40px')
    applyStyle(layouter, child, 'height', '30px')
    applyStyle(layouter, child, 'padding', '1px 2px 3px 4px')
    applyStyle(layouter, child, 'borderTopWidth', '5px')
    applyStyle(layouter, child, 'borderRightWidth', '6px')
    applyStyle(layouter, child, 'borderBottomWidth', '7px')
    applyStyle(layouter, child, 'borderLeftWidth', '8px')

    layouter.calculate()
    root.layout = layouter.getLayout(root)
    child.layout = layouter.getLayout(child)

    expect(root).not.toHaveProperty('element')
    expect(child.layout.padding).toEqual({ top: 1, right: 2, bottom: 3, left: 4 })
    expect(child.layout.border).toEqual({ top: 5, right: 6, bottom: 7, left: 8 })

    layouter.detachChild(root, child)
    expect(layouter.getChildIndex(root)).toBe(0)

    layouter.insertChild(root, child, 0)
    expect(layouter.getChildIndex(root)).toBe(1)

    layouter.detachChild(root, child)
    layouter.destroyNode(child)
    layouter.destroy([root])
})

test('Yoga layouter destroys attached and detached nodes with its config', async () => {
    const Yoga = await loadYoga()
    const destroy_node = Yoga.Node.destroy.bind(Yoga.Node)
    const destroy_config = Yoga.Config.destroy.bind(Yoga.Config)
    let node_destroy_count = 0
    let config_destroy_count = 0

    Yoga.Node.destroy = (node) => {
        node_destroy_count++
        destroy_node(node)
    }
    Yoga.Config.destroy = (config) => {
        config_destroy_count++
        destroy_config(config)
    }

    const layouter = await createYogaLayouter({ loadYoga: async () => Yoga })
    const root = createNode(0)
    const child = createNode(1, root)
    const detached = createNode(2)

    layouter.createNode(root)
    layouter.createNode(child)
    layouter.createNode(detached)
    layouter.insertChild(root, child, 0)
    layouter.destroy([root, child, detached])

    expect(node_destroy_count).toBe(3)
    expect(config_destroy_count).toBe(1)
})

test('Yoga layouter translates measure modes to the generic contract', async () => {
    const exact_layouter = await createYogaLayouter({ loadYoga })
    const exact_root = createNode(0)
    const exact_modes = []

    exact_layouter.createNode(exact_root)
    applyStyle(exact_layouter, exact_root, 'width', '100px')
    exact_layouter.setMeasureFunction(exact_root, (width, width_mode, height, height_mode) => {
        exact_modes.push(width_mode, height_mode)
        return { width: 10, height: 20 }
    })
    exact_layouter.calculate()

    expect(exact_modes).toEqual([MEASURE_MODE.EXACTLY, MEASURE_MODE.UNDEFINED])

    const at_most_layouter = await createYogaLayouter({ loadYoga })
    const at_most_root = createNode(0)
    const measured_child = createNode(1, at_most_root)
    const at_most_modes = []

    at_most_layouter.createNode(at_most_root)
    at_most_layouter.createNode(measured_child)
    at_most_layouter.insertChild(at_most_root, measured_child, 0)
    applyStyle(at_most_layouter, at_most_root, 'width', '100px')
    at_most_layouter.setMeasureFunction(measured_child, (width, width_mode, height, height_mode) => {
        at_most_modes.push(width_mode, height_mode)
        return { width: 10, height: 20 }
    })
    at_most_layouter.calculate()

    expect(at_most_modes).toEqual([MEASURE_MODE.AT_MOST, MEASURE_MODE.UNDEFINED])
})

test('Yoga layouter applies styles computed by its consumer', async () => {
    const layouter = await createYogaLayouter({ loadYoga })
    const root = createNode(0)
    const width_style = Style.resolveStyle('width', '2rem', { root_size: 16 }).expanded[0]

    layouter.createNode(root)
    root.styles.width = width_style
    layouter.applyStyle(root, computeStyleValue(width_style, { root_size: 20 }))
    layouter.calculate()

    expect(layouter.getLayout(root).width).toBe(40)
})

test('Yoga layouter resolves root percentages against the available size', async () => {
    const layouter = await createYogaLayouter({ loadYoga })
    const root = createNode(0)

    layouter.createNode(root)
    applyStyle(layouter, root, 'width', '100%')
    applyStyle(layouter, root, 'height', '100%')
    layouter.calculate(800, 600)

    expect(layouter.getLayout(root).width).toBe(800)
    expect(layouter.getLayout(root).height).toBe(600)
})

test('Yoga layouter reports whether its tree needs layout', async () => {
    const layouter = await createYogaLayouter({ loadYoga })
    const root = createNode(0)

    layouter.createNode(root)
    expect(layouter.isDirty()).toBe(true)

    layouter.calculate()
    expect(layouter.isDirty()).toBe(false)

    applyStyle(layouter, root, 'backgroundColor', '#123')
    expect(layouter.isDirty()).toBe(false)

    applyStyle(layouter, root, 'width', '100px')
    expect(layouter.isDirty()).toBe(true)

    layouter.destroy([root])
})

function createNode(id, parent = null) {
    return {
        id,
        parent,
        children: [],
        styles: {},
        layout: {},
    }
}

function applyStyle(layouter, node, name, value) {
    const resolved_style = Style.resolveStyle(name, value)
    for (const style of resolved_style.expanded) {
        node.styles[style.name] = style
        layouter.applyStyle(node, style)
    }
}
