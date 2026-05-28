import { loadYoga } from 'yoga-layout/load'
import { YOGA_SETTER } from '../style/yoga.ts'
import { UNIT } from '../style/consts.ts'

export default class LayoutEngineYoga {
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
        const parent_layout = getParentLayout(node)
        const parent_rect =
            node.parent.element === this.root_element
                ? { ...parent_layout, ...this.root_element.getComputedLayout() }
                : parent_layout

        return calculateLayoutRect(
            applyWrappedRelativeOffsets(node, node_rect),
            parent_rect,
        )
    }
}

function applyWrappedRelativeOffsets(node, rect) {
    const mainAxis =
        FLEX_DIRECTION_MAIN_AXIS[node.parent?.styles.flexDirection?.value]

    if (
        node.styles.position?.value !== 'relative' ||
        node.parent?.styles.flexWrap?.value == null ||
        node.parent?.styles.flexWrap?.value === 'nowrap' ||
        mainAxis == null
    ) {
        return rect
    }

    let correctedRect = rect

    for (const axis of RELATIVE_OFFSET_AXES) {
        const referenceSize = readContentSize(
            node.parent,
            axis.referenceDimension,
        )
        const cssOffset =
            readOffset(node.styles[axis.startStyle], referenceSize) -
            readOffset(node.styles[axis.endStyle], referenceSize)
        const yogaOffset =
            axis.name === mainAxis.name ? cssOffset * mainAxis.direction : 0
        const correction = cssOffset - yogaOffset

        if (correction !== 0) {
            correctedRect = {
                ...correctedRect,
                [axis.rectProperty]:
                    correctedRect[axis.rectProperty] + correction,
            }
        }
    }

    return correctedRect
}

const RELATIVE_OFFSET_AXES = [
    {
        name: 'x',
        rectProperty: 'left',
        startStyle: 'left',
        endStyle: 'right',
        referenceDimension: 'width',
    },
    {
        name: 'y',
        rectProperty: 'top',
        startStyle: 'top',
        endStyle: 'bottom',
        referenceDimension: 'height',
    },
]

const FLEX_DIRECTION_MAIN_AXIS = {
    row: { name: 'x', direction: 1 },
    'row-reverse': { name: 'x', direction: -1 },
    column: { name: 'y', direction: 1 },
    'column-reverse': { name: 'y', direction: -1 },
}

function getParentLayout(node) {
    const parent = node.parent

    if (parent === null || parent.parent === null) {
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        }
    }

    return parent.layout
}

function calculateLayoutRect(node_rect, parent_rect) {
    const width = Math.round(node_rect.width)
    const height = Math.round(node_rect.height)
    const left = Math.round(node_rect.left)
    const top = Math.round(node_rect.top)
    const x = Math.round(parent_rect.x + left)
    const y = Math.round(parent_rect.y + top)
    const centerX = Math.round(left + width / 2 - parent_rect.width / 2)
    const centerY = Math.round(-(top + height / 2 - parent_rect.height / 2))

    return {
        width,
        height,
        left,
        top,
        x,
        y,
        centerX,
        centerY,
    }
}

function readContentSize(node, dimension) {
    const padding = readPxOffset(node.styles.padding)
    const borderWidth = readPxOffset(node.styles.borderWidth)

    return node.layout[dimension] - padding * 2 - borderWidth * 2
}

function readOffset(style, referenceSize) {
    if (style?.parsed?.unit === UNIT.PERCENT) {
        return (referenceSize * style.parsed.value) / 100
    }

    return readPxOffset(style)
}

function readPxOffset(style) {
    return style?.parsed?.unit === UNIT.PX ? style.parsed.value : 0
}
