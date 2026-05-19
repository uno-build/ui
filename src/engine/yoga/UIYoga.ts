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
                ? { left: 0, top: 0, right: 0, bottom: 0 }
                : (node.parent?.paintLayout ?? {
                      left: 0,
                      top: 0,
                      right: 0,
                      bottom: 0,
                  })
        const left = parentLayout.left + layout.left
        const top =
            parentLayout.top + layout.top + getRelativeVerticalOffset(node)
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

function getRelativeVerticalOffset(node) {
    if (node.props.position !== 'relative') {
        return 0
    }
    if (node.props.top != null) {
        return parsePoint(node.props.top)
    }
    if (node.props.bottom != null) {
        return -parsePoint(node.props.bottom)
    }
    return 0
}

function parsePoint(value) {
    if (typeof value === 'number') {
        return value
    }
    return Number.parseFloat(value) || 0
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
