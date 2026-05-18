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
                ? { x: 0, y: 0 }
                : (node.parent?.paintLayout ?? { x: 0, y: 0 })
        return {
            width: layout.width,
            height: layout.height,
            x: parentLayout.x + layout.left,
            y: parentLayout.y + layout.top,
        }
    }
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
