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

    protected getPaintLayout(node) {
        const layout = node.yoga.getComputedLayout()
        const parentLayout =
            node.parent === this.root
                ? { left: 0, top: 0, ...this.root.yoga.getComputedLayout() }
                : (node.parent?.paintLayout ?? {
                      left: 0,
                      top: 0,
                      width: 0,
                      height: 0,
                  })
        const relativeOffset = getRelativePaintOffset(
            node,
            node.parent,
            parentLayout,
        )
        const left = parentLayout.left + layout.left + relativeOffset.x
        const top = parentLayout.top + layout.top + relativeOffset.y
        const right = left + layout.width
        const bottom = top + layout.height
        return {
            width: layout.width,
            height: layout.height,
            x: left,
            y: top,
            left,
            top,
            right,
            bottom,
        }
    }
}

function getRelativePaintOffset(node, parent, parentLayout) {
    if (node.props.position !== 'relative') {
        return { x: 0, y: 0 }
    }
    const contentSize = getContentSize(parent, parentLayout)
    return {
        x: getAxisOffset(node.props.left, node.props.right, contentSize.width),
        y: getAxisOffset(node.props.top, node.props.bottom, contentSize.height),
    }
}

function getAxisOffset(start, end, size) {
    if (start != null) {
        return resolvePoint(start, size)
    }
    if (end != null) {
        return -resolvePoint(end, size)
    }
    return 0
}

function getContentSize(node, layout) {
    return {
        width:
            layout.width -
            getComputedPadding(node, EDGE.left) -
            getComputedPadding(node, EDGE.right),
        height:
            layout.height -
            getComputedPadding(node, EDGE.top) -
            getComputedPadding(node, EDGE.bottom),
    }
}

function getComputedPadding(node, edge) {
    return node?.yoga.getComputedPadding(edge) ?? 0
}

function resolvePoint(value, size) {
    if (typeof value === 'number') {
        return value
    }
    if (typeof value !== 'string') {
        return 0
    }
    if (value.endsWith('%')) {
        return (size * Number.parseFloat(value)) / 100
    }
    return Number.parseFloat(value) || 0
}

const EDGE = {
    left: 0,
    top: 1,
    right: 2,
    bottom: 3,
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
