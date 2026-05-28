import Engine from '../Engine.ts'
import { loadYoga } from 'yoga-layout/load'
import { YOGA_SETTER } from '../style/yoga.ts'
import { UNIT } from '../style/consts.ts'

export default class EngineYoga extends Engine {
    private Yoga
    private yoga_config
    private root_element

    public async init() {
        this.Yoga = await loadYoga()
        this.yoga_config = this.Yoga.Config.create()
        this.yoga_config.setUseWebDefaults(true)
        // this.yoga_config.setPointScaleFactor(200)
        this.yoga_config.setExperimentalFeatureEnabled(
            0, // ExperimentalFeature.WebFlexBasis
            true,
        )
    }

    public createElement(node) {
        const element = this.Yoga.Node.create(this.yoga_config)

        if (node.id === 0) {
            this.root_element = element
        }

        return element
    }

    public getChildIndex(node) {
        return node.element.getChildCount()
    }

    public insertChild(parent, node, childIndex) {
        parent.element.insertChild(node.element, childIndex)
    }

    public removeChild(parent, node) {
        parent.element.removeChild(node.element)
    }

    public updateStyle(node, style) {
        if (YOGA_SETTER.hasOwnProperty(style.name)) {
            YOGA_SETTER[style.name](node.element, style)
            return true
        }

        return false
    }

    public beforeUpdate() {
        this.root_element.calculateLayout()
    }

    // prettier-ignore
    public getLayout(node) {
        const node_rect = node.element.getComputedLayout()
        const parent_layout = this.getParentLayout(node)
        const parent_rect =
            node.parent?.element === this.root_element
                ? { ...parent_layout, ...this.root_element.getComputedLayout() }
                : parent_layout

        return this.calculateLayoutRect(
            applyWrappedRelativeOffsets(node, node_rect),
            parent_rect,
        )
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
