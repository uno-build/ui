import { expect, test } from '@playwright/test'
import createEngine from '../src/layouter/yoga.ts'
import { MEASURE_MODE } from '../src/layouter/types.ts'
import Style, { computeStyleValue } from '../src/style'

test('Yoga layout engine keeps handles private and returns computed box metrics', async () => {
    const engine = await createEngine()
    const root = createNode(0)
    const child = createNode(1, root)

    engine.createNode(root)
    engine.createNode(child)
    engine.insertChild(root, child, 0)
    applyStyle(engine, root, 'width', '100px')
    applyStyle(engine, root, 'height', '100px')
    applyStyle(engine, child, 'width', '40px')
    applyStyle(engine, child, 'height', '30px')
    applyStyle(engine, child, 'padding', '1px 2px 3px 4px')
    applyStyle(engine, child, 'borderTopWidth', '5px')
    applyStyle(engine, child, 'borderRightWidth', '6px')
    applyStyle(engine, child, 'borderBottomWidth', '7px')
    applyStyle(engine, child, 'borderLeftWidth', '8px')

    engine.calculate()
    root.layout = engine.getLayout(root)
    child.layout = engine.getLayout(child)

    expect(root).not.toHaveProperty('element')
    expect(child.layout.padding).toEqual({ top: 1, right: 2, bottom: 3, left: 4 })
    expect(child.layout.border).toEqual({ top: 5, right: 6, bottom: 7, left: 8 })

    engine.removeChild(root, child)
    expect(engine.getChildIndex(root)).toBe(0)
})

test('Yoga layout engine translates measure modes to the generic contract', async () => {
    const exact_engine = await createEngine()
    const exact_root = createNode(0)
    const exact_modes = []

    exact_engine.createNode(exact_root)
    applyStyle(exact_engine, exact_root, 'width', '100px')
    exact_engine.setMeasureFunction(exact_root, (width, width_mode, height, height_mode) => {
        exact_modes.push(width_mode, height_mode)
        return { width: 10, height: 20 }
    })
    exact_engine.calculate()

    expect(exact_modes).toEqual([MEASURE_MODE.EXACTLY, MEASURE_MODE.UNDEFINED])

    const at_most_engine = await createEngine()
    const at_most_root = createNode(0)
    const measured_child = createNode(1, at_most_root)
    const at_most_modes = []

    at_most_engine.createNode(at_most_root)
    at_most_engine.createNode(measured_child)
    at_most_engine.insertChild(at_most_root, measured_child, 0)
    applyStyle(at_most_engine, at_most_root, 'width', '100px')
    at_most_engine.setMeasureFunction(measured_child, (width, width_mode, height, height_mode) => {
        at_most_modes.push(width_mode, height_mode)
        return { width: 10, height: 20 }
    })
    at_most_engine.calculate()

    expect(at_most_modes).toEqual([MEASURE_MODE.AT_MOST, MEASURE_MODE.UNDEFINED])
})

test('Yoga layout engine applies styles computed by its consumer', async () => {
    const engine = await createEngine()
    const root = createNode(0)
    const width_style = Style.resolveStyle('width', '2rem', { root_size: 16 }).expanded[0]

    engine.createNode(root)
    root.styles.width = width_style
    engine.applyStyle(root, computeStyleValue(width_style, { root_size: 20 }))
    engine.calculate()

    expect(engine.getLayout(root).width).toBe(40)
})

test('Yoga layout engine applies computed numeric functions', async () => {
    const engine = await createEngine()
    const root = createNode(0)
    const width_style = Style.resolveStyle('width', 'clamp(20px, 10vw, 40px)').expanded[0]

    engine.createNode(root)
    root.styles.width = width_style
    engine.applyStyle(
        root,
        computeStyleValue(width_style, { root_size: 16, viewport_width: 300, viewport_height: 200 }),
    )
    engine.calculate()

    expect(engine.getLayout(root).width).toBe(30)
})

test('Yoga layout engine resolves root percentages against the available size', async () => {
    const engine = await createEngine()
    const root = createNode(0)

    engine.createNode(root)
    applyStyle(engine, root, 'width', '100%')
    applyStyle(engine, root, 'height', '100%')
    engine.calculate(800, 600)

    expect(engine.getLayout(root).width).toBe(800)
    expect(engine.getLayout(root).height).toBe(600)
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

function applyStyle(engine, node, name, value) {
    const resolved_style = Style.resolveStyle(name, value)
    for (const style of resolved_style.expanded) {
        node.styles[style.name] = style
        engine.applyStyle(node, style)
    }
}
