import { expect, test } from '@playwright/test'
import { loadYoga } from 'yoga-layout/load'
import createAbsoluteLayouter from '../../src/layouter/absolute.ts'
import createYogaLayouter from '../../src/layouter/yoga.ts'
import { isSameLayout } from '../../src/layouter/utils.ts'
import Style from '../../src/style'
import { MEASURE_MODE } from '../../src/style/constants'

const STYLE_NAMES = [
    'left',
    'top',
    'right',
    'bottom',
    'width',
    'height',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'boxSizing',
    'display',
]
const ROOT_STYLE_NAMES = STYLE_NAMES.filter((name) => /^(width|height|padding|border|boxSizing)/.test(name))

test('Absolute layouter places boxes inside the parent padding box', () => {
    const layouter = createAbsoluteLayouter()
    const root = createNode(layouter, 0)
    const panel = createNode(layouter, 1, root)
    const icon = createNode(layouter, 2, panel)
    const label = createNode(layouter, 3, panel)
    const bar = createNode(layouter, 4, panel)
    const hidden = createNode(layouter, 5, panel)
    const inner = createNode(layouter, 6, hidden)
    const title = createNode(layouter, 7, panel)
    const measures = []
    applyStyles(layouter, panel, {
        left: '10px',
        top: '20px',
        width: '200px',
        height: '100px',
        border: '2px solid #000000',
        padding: '8px',
    })
    applyStyles(layouter, icon, { width: '16px', height: '16px' })
    applyStyles(layouter, label, { right: '0px', top: '50%' })
    applyStyles(layouter, bar, { left: '0px', right: '0px', bottom: '0px', height: '10px' })
    applyStyles(layouter, hidden, { display: 'none' })
    applyStyles(layouter, inner, { width: '10px', height: '10px' })
    applyStyles(layouter, title, { left: '0px', right: '0px', maxWidth: '100px' })
    for (const node of [label, title]) {
        layouter.setMeasureFunction(node, (width, width_mode, height, height_mode) => {
            measures.push([node.id, width, width_mode, height_mode])
            return { width: 60, height: 20 }
        })
    }

    layouter.calculate(800, 600)
    readLayouts(layouter, root)

    expect(root.layout).toMatchObject({ x: 0, y: 0, width: 800, height: 600 })
    expect(panel.layout).toMatchObject({ x: 10, y: 20, width: 200, height: 100 })
    expect(icon.layout).toMatchObject({ x: 20, y: 30, width: 16, height: 16 })
    expect(label.layout).toMatchObject({ x: 148, y: 70, width: 60, height: 20 })
    expect(bar.layout).toMatchObject({ x: 12, y: 108, width: 196, height: 10 })
    expect(hidden.layout).toMatchObject({ x: 10, y: 20, width: 0, height: 0 })
    expect(inner.layout).toMatchObject({ x: 10, y: 20, width: 0, height: 0 })
    expect(title.layout).toMatchObject({ x: 12, y: 30, width: 100, height: 20 })
    expect(measures).toEqual([
        [3, NaN, MEASURE_MODE.UNDEFINED, MEASURE_MODE.UNDEFINED],
        [7, 100, MEASURE_MODE.EXACTLY, MEASURE_MODE.UNDEFINED],
    ])

    applyStyles(layouter, hidden, { display: 'flex' })
    layouter.calculate(800, 600)
    readLayouts(layouter, root)

    expect(hidden.layout).toMatchObject({ x: 20, y: 30, width: 0, height: 0 })
    expect(inner.layout).toMatchObject({ x: 20, y: 30, width: 10, height: 10 })
})

test('Absolute layouter ignores other styles and unchanged values, and measures only text with an auto size', () => {
    const layouter = createAbsoluteLayouter()
    const root = createNode(layouter, 0)
    const fixed = createNode(layouter, 1, root)
    const auto = createNode(layouter, 2, root)
    const measured_ids = []
    applyStyles(layouter, fixed, { width: '40px', height: '50%' })
    for (const node of [fixed, auto]) {
        layouter.setMeasureFunction(node, () => {
            measured_ids.push(node.id)
            return { width: 10, height: 10 }
        })
    }
    layouter.calculate(100, 100)
    readLayouts(layouter, root)
    expect(layouter.isDirty()).toBe(false)
    expect(measured_ids).toEqual([2])

    applyStyles(layouter, auto, {
        position: 'relative',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        flexGrow: '1',
        gap: '4px',
        margin: '10px',
        translate: '10px 10px',
        backgroundColor: '#123',
    })
    applyStyles(layouter, fixed, { width: '40px' })
    expect(layouter.isDirty()).toBe(false)

    measured_ids.length = 0
    layouter.markDirty(fixed)
    layouter.markDirty(auto)
    layouter.calculate(100, 100)
    expect(measured_ids).toEqual([2])
    expect(readLayouts(layouter, root)).toEqual([])
})

test('Absolute layouter measures and reads only the boxes that changed', () => {
    const layouter = createAbsoluteLayouter()
    const root = createNode(layouter, 0)
    const panel = createNode(layouter, 1, root)
    const labels = [2, 3, 4].map((id) => createNode(layouter, id, panel))
    const measured_ids = []
    let text_width = 10
    for (const label of labels) {
        layouter.setMeasureFunction(label, () => {
            measured_ids.push(label.id)
            return { width: label === labels[0] ? text_width : 10, height: 10 }
        })
    }
    layouter.calculate(100, 100)
    readLayouts(layouter, root)
    measured_ids.length = 0

    text_width = 30
    layouter.markDirty(labels[0])
    layouter.calculate(100, 100)

    expect(measured_ids).toEqual([2])
    expect(readLayouts(layouter, root).map(({ id }) => id)).toEqual([0, 1, 2])
    expect(labels[0].layout.width).toBe(30)

    detachNode(layouter, labels[2])
    expect(layouter.isDirty()).toBe(false)

    layouter.destroy([root, panel, ...labels])
    expect(() => layouter.getChildIndex(panel)).toThrow()
})

// The reference is laid out from scratch every round: incremental Yoga keeps stale sizes in absolute nodes whose
// percentages depend on a containing block that changed.
test('Absolute layouter matches a fresh Yoga layout with every node absolutely positioned', async () => {
    const yoga = await loadYoga()
    const mismatches = []

    for (let seed = 1; seed <= 100; seed++) {
        const random = createRandom(seed)
        const layouter = createAbsoluteLayouter()
        const texts = new Map()
        const nodes = [createNode(layouter, 0)]
        const node_count = 2 + Math.floor(random() * 12)
        for (let id = 1; id < node_count; id++) {
            nodes.push(createNode(layouter, id, nodes[Math.floor(random() * id)]))
            applyStyles(layouter, nodes[id], { position: 'absolute' })
        }
        for (const node of nodes) {
            const names = node.id === 0 ? ROOT_STYLE_NAMES : STYLE_NAMES
            const styles = names.filter(() => random() < 0.3).map((name) => [name, getRandomStyleValue(random, name)])
            applyStyles(layouter, node, Object.fromEntries(styles))
            if (node.id !== 0 && node.children.length === 0 && random() < 0.6) {
                texts.set(node.id, { width: Math.floor(random() * 150), line_height: 10 + Math.floor(random() * 10) })
                layouter.setMeasureFunction(node, createTextMeasure(texts.get(node.id)))
            }
        }

        let viewport = [400, 300]
        for (let round = 0; round <= 20; round++) {
            if (round > 0) {
                const edit = random()
                if (edit < 0.5) {
                    const node = nodes[Math.floor(random() * node_count)]
                    const names = node.id === 0 ? ROOT_STYLE_NAMES : STYLE_NAMES
                    const name = names[Math.floor(random() * names.length)]
                    applyStyles(layouter, node, { [name]: getRandomStyleValue(random, name) })
                } else if (edit < 0.7 && texts.size > 0) {
                    const id = [...texts.keys()][Math.floor(random() * texts.size)]
                    texts.get(id).width = Math.floor(random() * 150)
                    layouter.markDirty(nodes[id])
                } else if (edit < 0.85) {
                    const node = nodes[1 + Math.floor(random() * (node_count - 1))]
                    const parents = nodes.filter((parent) => !texts.has(parent.id) && !isInSubtree(parent, node))
                    const parent = parents[Math.floor(random() * parents.length)]
                    const child_index = Math.floor(random() * parent.children.length)
                    detachNode(layouter, node)
                    insertNode(layouter, parent, node, child_index)
                } else {
                    viewport = [200 + Math.floor(random() * 600), 150 + Math.floor(random() * 450)]
                }
            }

            layouter.calculate(...viewport)
            readLayouts(layouter, nodes[0])
            const yoga_root = await layoutWithYoga(yoga, nodes[0], texts, viewport)
            compareLayouts(yoga_root, nodes[0], `seed ${seed} round ${round}`, mismatches)
        }
    }

    expect(mismatches.slice(0, 10)).toEqual([])
})

async function layoutWithYoga(yoga, root, texts, viewport) {
    const layouter = await createYogaLayouter({ loadYoga: async () => yoga })
    const yoga_nodes = []
    const copyNode = (node, parent) => {
        const copy = createNode(layouter, node.id, parent)
        yoga_nodes.push(copy)
        for (const style of Object.values(node.styles)) {
            layouter.applyStyle(copy, style)
        }
        if (texts.has(node.id)) {
            layouter.setMeasureFunction(copy, createTextMeasure(texts.get(node.id)))
        }
        for (const child of node.children) {
            copyNode(child, copy)
        }

        return copy
    }
    const yoga_root = copyNode(root, null)
    layouter.calculate(...viewport)
    readAllLayouts(layouter, yoga_root)
    layouter.destroy(yoga_nodes)

    return yoga_root
}

function createNode(layouter, id, parent = null) {
    const node = { id, parent: null, children: [], styles: {}, layout: {} }
    layouter.createNode(node)
    if (parent !== null) {
        insertNode(layouter, parent, node)
    }

    return node
}

function insertNode(layouter, parent, node, child_index = parent.children.length) {
    node.parent = parent
    parent.children.splice(child_index, 0, node)
    layouter.insertChild(parent, node, child_index)
}

function detachNode(layouter, node) {
    const parent = node.parent
    parent.children.splice(parent.children.indexOf(node), 1)
    layouter.detachChild(parent, node)
    node.parent = null
}

function isInSubtree(node, subtree_root) {
    return node === subtree_root || (node.parent !== null && isInSubtree(node.parent, subtree_root))
}

function applyStyles(layouter, node, styles) {
    for (const [name, value] of Object.entries(styles)) {
        for (const style of Style.resolveStyle(name, value).expanded) {
            node.styles[style.name] = style
            layouter.applyStyle(node, style)
        }
    }
}

// Same walk as UI.update(): returns the nodes that received a new layout object.
function readLayouts(layouter, root) {
    const read_nodes = []
    const updateLayout = (node, parent_changed) => {
        const layout = layouter.getNewLayout(node, parent_changed)
        if (layout === node.layout) {
            return
        }
        read_nodes.push(node)
        const changed = !isSameLayout(node.layout, layout)
        node.layout = layout
        for (const child of node.children) {
            updateLayout(child, changed)
        }
    }
    updateLayout(root, false)

    return read_nodes
}

function readAllLayouts(layouter, node) {
    node.layout = layouter.getLayout(node)
    for (const child of node.children) {
        readAllLayouts(layouter, child)
    }
}

function compareLayouts(expected_node, node, label, mismatches) {
    const expected_values = getLayoutValues(expected_node.layout)
    const values = getLayoutValues(node.layout)
    for (const [key, expected_value] of Object.entries(expected_values)) {
        // Yoga stores layouts as 32-bit floats.
        if (!(Math.abs(values[key] - expected_value) < 1e-3)) {
            mismatches.push(`${label} node ${node.id} ${key}: Yoga ${expected_value}, absolute ${values[key]}`)
        }
    }
    for (const [index, child] of node.children.entries()) {
        compareLayouts(expected_node.children[index], child, label, mismatches)
    }
}

function getLayoutValues({ x, y, width, height, padding, border }) {
    return {
        x,
        y,
        width,
        height,
        ...Object.fromEntries(Object.entries(padding).map(([side, value]) => [`padding ${side}`, value])),
        ...Object.fromEntries(Object.entries(border).map(([side, value]) => [`border ${side}`, value])),
    }
}

function createTextMeasure(text) {
    return (width, width_mode, height, height_mode) => {
        const max_width = width_mode === MEASURE_MODE.UNDEFINED ? Infinity : width
        // Yoga passes 32-bit floats: a width that splits the text exactly can come in slightly smaller.
        const lines = max_width >= text.width ? 1 : Math.ceil(text.width / Math.max(max_width, 1) - 1e-4)
        return {
            width: width_mode === MEASURE_MODE.EXACTLY ? width : Math.min(text.width, max_width),
            height: height_mode === MEASURE_MODE.EXACTLY ? height : lines * text.line_height,
        }
    }
}

function getRandomStyleValue(random, name) {
    const integer = (max) => Math.floor(random() * (max + 1))
    if (random() < 0.1) {
        return 'unset'
    }
    if (name === 'display') {
        return random() < 0.5 ? 'none' : 'flex'
    }
    if (name === 'boxSizing') {
        return random() < 0.5 ? 'border-box' : 'content-box'
    }
    if (name.startsWith('border')) {
        return `${integer(6)}px`
    }
    // Disjoint percentages of the same container never contradict, unlike a min larger than its max, which Yoga
    // bounds again in each pass.
    if (name.startsWith('min')) {
        return `${integer(50)}%`
    }
    if (name.startsWith('max')) {
        return `${50 + integer(50)}%`
    }
    if (random() < 0.4) {
        return `${integer(100)}%`
    }
    if (['left', 'top', 'right', 'bottom'].includes(name)) {
        return random() < 0.3 ? 'auto' : `${integer(100) - 20}px`
    }
    if (name === 'width' || name === 'height') {
        return random() < 0.3 ? 'auto' : `${integer(150)}px`
    }

    return `${integer(name.startsWith('padding') ? 12 : 150)}px`
}

// mulberry32
function createRandom(seed) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0
        let value = Math.imul(seed ^ (seed >>> 15), seed | 1)
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296
    }
}
