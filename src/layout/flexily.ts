import { createFlexily } from 'flexily'
import { UNIT } from '../style/consts.js'
import { calculateLayoutRect, getParentLayout } from './utils.js'

export default function createFlexilyLayout() {
    const Flexily = createFlexily()
    let root_element

    return {
        createElement(node) {
            const element = Flexily.createNode()

            if (node.id === 0) {
                root_element = element
            }

            return element
        },

        getChildIndex(node) {
            return node.element.getChildCount()
        },

        insertChild(parent, node, childIndex) {
            parent.element.insertChild(node.element, childIndex)
        },

        removeChild(parent, node) {
            parent.element.removeChild(node.element)
        },

        update() {
            root_element.calculateLayout()
        },

        // prettier-ignore
        getLayout(node) {
            const node_rect = node.element.getComputedLayout()
            const parent_layout = getParentLayout(node)
            const parent_rect =
                node.parent?.element === root_element
                    ? { ...parent_layout, ...root_element.getComputedLayout() }
                    : parent_layout

            return calculateLayoutRect(
                applyWrappedRelativeOffsets(node, node_rect),
                parent_rect,
            )
        },
    }
}

// Correct Yoga's wrapped flex relative offsets so painted divs match the DOM.
// Yoga may omit cross-axis offsets or apply reverse main-axis offsets backward.
function applyWrappedRelativeOffsets(node, rect) {
    const main_axis =
        FLEX_DIRECTION_AXIS[node.parent?.styles.flexDirection?.value]

    // If the node is not a relatively positioned child of a wrapped flex container, no correction is needed.
    if (main_axis == null || !isRelative(node) || !isWrappedFlexParent(node)) {
        return rect
    }

    let rect_corrected = rect
    for (const axis of RELATIVE_OFFSET_AXES) {
        const reference_size = readContentSize(
            node.parent,
            axis.reference_dimension,
        )
        const css_offset =
            readOffset(node.styles[axis.style_start], reference_size) -
            readOffset(node.styles[axis.style_end], reference_size)
        const yoga_offset =
            axis.name === main_axis.name ? css_offset * main_axis.direction : 0
        const correction = css_offset - yoga_offset

        if (correction !== 0) {
            rect_corrected = {
                ...rect_corrected,
                [axis.rect_property]:
                    rect_corrected[axis.rect_property] + correction,
            }
        }
    }

    return rect_corrected
}

const FLEX_DIRECTION_AXIS = {
    row: { name: 'x', direction: 1 },
    'row-reverse': { name: 'x', direction: -1 },
    column: { name: 'y', direction: 1 },
    'column-reverse': { name: 'y', direction: -1 },
}

const RELATIVE_OFFSET_AXES = [
    {
        name: 'x',
        rect_property: 'left',
        style_start: 'left',
        style_end: 'right',
        reference_dimension: 'width',
    },
    {
        name: 'y',
        rect_property: 'top',
        style_start: 'top',
        style_end: 'bottom',
        reference_dimension: 'height',
    },
]

function readContentSize(node, dimension) {
    const padding = readPxOffset(node.styles.padding)
    const borderWidth = readPxOffset(node.styles.borderWidth)

    return node.layout[dimension] - padding * 2 - borderWidth * 2
}

function readOffset(style, reference_size) {
    if (style?.parsed?.unit === UNIT.PERCENT) {
        return (reference_size * style.parsed.value) / 100
    }

    return readPxOffset(style)
}

function readPxOffset(style) {
    return style?.parsed?.unit === UNIT.PX ? style.parsed.value : 0
}

function isWrappedFlexParent(node) {
    const flexWrap = node.parent?.styles.flexWrap?.value
    return flexWrap === 'wrap' || flexWrap === 'wrap-reverse'
}

function isRelative(node) {
    return node.styles.position?.value === 'relative'
}
