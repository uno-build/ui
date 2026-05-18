// import { sortNodesForCanvasPaint } from '../order.ts'
import Node from './NodeYoga.js'
import UI from '../UI.js'

export default class UIYoga extends UI<Node> {
    private Yoga
    private yoga_config

    constructor({ Yoga }) {
        super()

        this.Yoga = Yoga
        this.yoga_config = Yoga.Config.create()
        this.yoga_config.setUseWebDefaults(true)
        // this.yoga_config.setPointScaleFactor(200)
        this.yoga_config.setExperimentalFeatureEnabled(
            0, // ExperimentalFeature.WebFlexBasis
            true,
        )

        this.root = new Node({
            yoga: this.Yoga.Node.create(this.yoga_config),
            props: {},
            nodes: this.nodes,
        })
    }

    protected createNode(props) {
        const yoga = this.Yoga.Node.create(this.yoga_config)
        return new Node({
            yoga,
            props,
            nodes: this.nodes,
        })
    }

    protected beforeUpdate() {
        this.root.yoga.calculateLayout()
    }

    protected getLayout(node) {
        const layout = node.yoga.getComputedLayout()
        const offset = getRelativeLayoutCorrection(node)
        return {
            width: layout.width,
            height: layout.height,
            x: layout.left + offset.left,
            y: layout.top + offset.top,
        }
    }
}

function getRelativeLayoutCorrection(node) {
    const props = node.props
    if (props.position != null && props.position !== 'relative') {
        return { left: 0, top: 0 }
    }

    const expected = getCssRelativeOffset(props)
    const parentProps = node.parent?.props ?? {}
    const flexDirection = parentProps.flexDirection ?? 'row'
    const flexWrap = parentProps.flexWrap ?? 'nowrap'

    if (flexWrap === 'nowrap' || flexWrap === 'no-wrap') {
        return {
            left: isRowReverse(flexDirection) ? expected.left * 2 : 0,
            top: isColumnReverse(flexDirection) ? expected.top * 2 : 0,
        }
    }

    return {
        left: isColumn(flexDirection)
            ? expected.left
            : isRowReverse(flexDirection)
              ? expected.left * 2
              : 0,
        top: isRow(flexDirection)
            ? expected.top
            : isColumnReverse(flexDirection)
              ? expected.top * 2
              : 0,
    }
}

function getCssRelativeOffset(props) {
    const left = parsePoint(props.left)
    const right = parsePoint(props.right)
    const top = parsePoint(props.top)
    const bottom = parsePoint(props.bottom)
    console.log({ left, right, top, bottom })
    return {
        left: left ?? (right == null ? 0 : -right),
        top: top ?? (bottom == null ? 0 : -bottom),
    }
}

function parsePoint(value) {
    if (value == null) {
        return undefined
    }
    if (typeof value === 'number') {
        return value
    }
    if (typeof value === 'string' && value.endsWith('px')) {
        return parseFloat(value)
    }
    return undefined
}

function isRow(flexDirection) {
    return flexDirection === 'row' || flexDirection === 'row-reverse'
}

function isColumn(flexDirection) {
    return flexDirection === 'column' || flexDirection === 'column-reverse'
}

function isRowReverse(flexDirection) {
    return flexDirection === 'row-reverse'
}

function isColumnReverse(flexDirection) {
    return flexDirection === 'column-reverse'
}

// function getPaintOrder(nodes) {
//     return sortNodesForCanvasPaint(Array.from(nodes).filter(isAttachedToRoot))
// }

// function isAttachedToRoot(node) {
//     let current = node
//     while (current != null) {
//         if (current === state.root) {
//             return true
//         }
//         current = current.parent
//     }
//     return false
// }
