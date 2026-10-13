import type Node from '../core/Node'
import type { ComputedLayout, LayoutEdges, ResolvedStyle } from '../style/types'

import { UNIT, DISPLAY, BOX_SIZING, MEASURE_MODE } from '../style/constants'
import { calculateLayoutRect, getParentLayout, isSameEdges } from './utils'

type ParsedLayoutStyle = { kind?: string, value?: number, enum?: number }
type MeasureFunction = (
    width: number,
    width_mode: string,
    height: number,
    height_mode: string,
) => { width: number, height: number }
type Box = { left: number, top: number, width: number, height: number, padding: LayoutEdges, border: LayoutEdges }
type Axis = { start?: number, end?: number, size?: number, min?: number, max?: number, padding_border: number }
type Element = {
    parent: Element | null
    children: Element[]
    styles: Record<string, ParsedLayoutStyle | undefined>
    measure: MeasureFunction | null
    box: Box | null
    dirty: boolean
    child_dirty: boolean
    children_hidden: boolean
    new_layout: boolean
}

// The box styles this layouter reads. The renderer passes it every style, as it does to Yoga: paint and text styles
// are still read by the renderer (text sizes reach the layout through the measure function), and only the other
// layout styles (flex, margin, position...) have no effect without Yoga.
const LAYOUT_STYLE_NAMES = new Set([
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
])
const AXES = {
    x: { start: 'left', end: 'right', size: 'width', min: 'minWidth', max: 'maxWidth' },
    y: { start: 'top', end: 'bottom', size: 'height', min: 'minHeight', max: 'maxHeight' },
}
const ZERO_EDGES = { top: 0, right: 0, bottom: 0, left: 0 }
const HIDDEN_BOX: Box = { left: 0, top: 0, width: 0, height: 0, padding: ZERO_EDGES, border: ZERO_EDGES }

// Lays out every node like Yoga does with `position: absolute` on all of them: a box depends only on its own
// styles, its own measure and its parent's box, so a change never lays out its siblings or ancestors again.
export default function createAbsoluteLayouter() {
    const elements = new WeakMap<Node, Element>()
    let root_element: Element | undefined

    function getElement(node: Node) {
        return elements.get(node)!
    }

    function markElement(element: Element) {
        element.dirty = true
        for (let ancestor = element.parent; ancestor !== null && !ancestor.child_dirty; ancestor = ancestor.parent) {
            ancestor.child_dirty = true
        }
    }

    function computeBox(element: Element, parent: Box): Box {
        const { styles } = element
        if (styles.display?.enum === DISPLAY.none) {
            return HIDDEN_BOX
        }

        const container_width = parent.width - parent.border.left - parent.border.right
        const container_height = parent.height - parent.border.top - parent.border.bottom
        const padding = {
            top: resolveLength(styles.paddingTop, container_width) ?? 0,
            right: resolveLength(styles.paddingRight, container_width) ?? 0,
            bottom: resolveLength(styles.paddingBottom, container_width) ?? 0,
            left: resolveLength(styles.paddingLeft, container_width) ?? 0,
        }
        const border = {
            top: resolveLength(styles.borderTopWidth, 0) ?? 0,
            right: resolveLength(styles.borderRightWidth, 0) ?? 0,
            bottom: resolveLength(styles.borderBottomWidth, 0) ?? 0,
            left: resolveLength(styles.borderLeftWidth, 0) ?? 0,
        }
        const content_box = styles.boxSizing?.enum === BOX_SIZING['content-box']
        const is_root = element === root_element
        const padding_border_x = padding.left + padding.right + border.left + border.right
        const padding_border_y = padding.top + padding.bottom + border.top + border.bottom
        const x = resolveAxis(styles, AXES.x, container_width, padding_border_x, content_box, is_root)
        const y = resolveAxis(styles, AXES.y, container_height, padding_border_y, content_box, is_root)
        let width = x.size
        let height = y.size
        if (width === undefined || height === undefined) {
            const measured = element.measure?.(
                width === undefined ? NaN : Math.max(0, width - padding_border_x),
                width === undefined ? MEASURE_MODE.UNDEFINED : MEASURE_MODE.EXACTLY,
                height === undefined ? NaN : Math.max(0, height - padding_border_y),
                height === undefined ? MEASURE_MODE.UNDEFINED : MEASURE_MODE.EXACTLY,
            )
            width ??= (measured?.width ?? 0) + padding_border_x
            height ??= (measured?.height ?? 0) + padding_border_y
        }
        width = boundSize(x, width)
        height = boundSize(y, height)

        return {
            left: placeAxis(x, width, container_width, parent.border.left, parent.padding.left),
            top: placeAxis(y, height, container_height, parent.border.top, parent.padding.top),
            width,
            height,
            padding,
            border,
        }
    }

    // Returns whether the subtree has boxes the walk from the root has not read yet.
    function layoutElement(element: Element, parent: Box, parent_changed: boolean, hidden: boolean): boolean {
        let resized = false
        if (element.dirty || parent_changed) {
            const box = hidden ? HIDDEN_BOX : computeBox(element, parent)
            const previous = element.box
            resized =
                previous === null ||
                box.width !== previous.width ||
                box.height !== previous.height ||
                !isSameEdges(box.padding, previous.padding) ||
                !isSameEdges(box.border, previous.border)
            element.new_layout ||= resized || box.left !== previous!.left || box.top !== previous!.top
            element.box = box
            element.dirty = false
        }

        const children_hidden = hidden || element.styles.display?.enum === DISPLAY.none
        const children_changed = resized || children_hidden !== element.children_hidden
        if (children_changed || element.child_dirty) {
            element.children_hidden = children_hidden
            for (const child of element.children) {
                if (layoutElement(child, element.box!, children_changed, children_hidden)) {
                    element.new_layout = true
                }
            }
            element.child_dirty = false
        }

        return element.new_layout
    }

    function getParentRect(node: Node) {
        const parent_layout = getParentLayout(node)

        return node.parent !== null && elements.get(node.parent) === root_element
            ? { ...parent_layout, width: root_element!.box!.width, height: root_element!.box!.height }
            : parent_layout
    }

    function getLayout(node: Node) {
        const box = getElement(node).box!

        return { ...calculateLayoutRect(box, getParentRect(node)), padding: box.padding, border: box.border }
    }

    return {
        createNode(node: Node) {
            const element: Element = {
                parent: null,
                children: [],
                styles: {},
                measure: null,
                box: null,
                dirty: true,
                child_dirty: false,
                children_hidden: false,
                new_layout: false,
            }
            elements.set(node, element)

            if (node.id === 0) {
                root_element = element
            }
        },

        getChildIndex(node: Node) {
            return getElement(node).children.length
        },

        insertChild(parent: Node, node: Node, child_index: number) {
            const element = getElement(node)
            const parent_element = getElement(parent)
            parent_element.children.splice(child_index, 0, element)
            element.parent = parent_element
            // A moved box can keep its offsets under a parent placed elsewhere.
            element.new_layout = true
            markElement(element)
        },

        detachChild(parent: Node, node: Node) {
            const element = getElement(node)
            const children = getElement(parent).children
            children.splice(children.indexOf(element), 1)
            element.parent = null
        },

        destroyNode(node: Node) {
            elements.delete(node)
        },

        destroy(nodes: Node[]) {
            for (const node of nodes) {
                elements.delete(node)
            }

            root_element = undefined
        },

        applyStyle(node: Node, style: ResolvedStyle & { name: string }) {
            if (LAYOUT_STYLE_NAMES.has(style.name)) {
                const element = getElement(node)
                const previous = element.styles[style.name]
                const parsed = style.parsed as ParsedLayoutStyle
                // Like Yoga, an unchanged value is not laid out again: a failed update applies its styles again.
                if (previous?.kind !== parsed.kind || previous?.value !== parsed.value || previous?.enum !== parsed.enum) {
                    element.styles[style.name] = parsed
                    markElement(element)
                }
            }
        },

        setMeasureFunction(node: Node, measureFunction: MeasureFunction) {
            const element = getElement(node)
            element.measure = measureFunction
            markElement(element)
        },

        markDirty(node: Node) {
            markElement(getElement(node))
        },

        isDirty() {
            return root_element!.dirty || root_element!.child_dirty
        },

        calculate(width: number, height: number) {
            const viewport = { left: 0, top: 0, width, height, padding: ZERO_EDGES, border: ZERO_EDGES }
            layoutElement(root_element!, viewport, true, false)
        },

        getLayout,

        // Unread boxes are flagged up to the root: the subtree of an unflagged node kept its boxes.
        getNewLayout(node: Node, parent_changed: boolean) {
            const element = getElement(node)
            if (element.new_layout) {
                element.new_layout = false
                return getLayout(node)
            }

            return parent_changed
                ? { ...node.layout, ...calculateLayoutRect(node.layout as ComputedLayout, getParentRect(node)) }
                : node.layout
        },
    }
}

function resolveLength(length: ParsedLayoutStyle | undefined, base: number, offset = 0) {
    if (length?.kind === UNIT.PX) {
        return length.value! + offset
    }
    if (length?.kind === UNIT.PERCENT) {
        return (length.value! * base) / 100 + offset
    }
}

// The root fills the viewport: its insets are ignored.
function resolveAxis(
    styles: Element['styles'],
    names: typeof AXES.x,
    container_size: number,
    padding_border: number,
    content_box: boolean,
    is_root: boolean,
): Axis {
    const offset = content_box ? padding_border : 0
    const axis: Axis = {
        start: is_root ? 0 : resolveLength(styles[names.start], container_size),
        end: is_root ? 0 : resolveLength(styles[names.end], container_size),
        size: resolveLength(styles[names.size], container_size, offset),
        min: resolveLength(styles[names.min], container_size, offset),
        max: resolveLength(styles[names.max], container_size, offset),
        padding_border,
    }
    // Like Yoga, an auto size between two insets is stretched and bounded before measuring.
    if (axis.size === undefined && axis.start !== undefined && axis.end !== undefined) {
        axis.size = boundSize(axis, container_size - axis.start - axis.end)
    }

    return axis
}

// As in CSS, a min larger than the max wins; Yoga's result depends on how many of its passes bound the size.
function boundSize({ min, max, padding_border }: Axis, size: number) {
    return Math.max(Math.min(size, max ?? Infinity), min ?? 0, padding_border)
}

// Offset from the parent's border box: an inset from its padding box, or else the start of its content box.
function placeAxis({ start, end }: Axis, size: number, container_size: number, border: number, padding: number) {
    return border + (start ?? (end !== undefined ? container_size - end - size : padding))
}
