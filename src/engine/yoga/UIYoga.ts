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
                ? { x: 0, y: 0, ...this.root.yoga.getComputedLayout() }
                : (node.parent?.paintLayout ?? {
                      x: 0,
                      y: 0,
                      width: 0,
                      height: 0,
                  })

        // local*: Yoga raw layout values relative to the parent, without accumulated offsets from ancestors.
        const width = layout.width
        const height = layout.height
        const left = layout.left
        const top = layout.top
        const right = layout.right
        const bottom = layout.bottom

        // x/y and left/top/right/bottom: accumulated 2D coordinates from the root.
        const x = parentLayout.x + left
        const y = parentLayout.y + top

        // Local center coordinates relative to the parent's center,
        // with Y flipped for GPU/3D-style coordinate systems.
        const centerX = left + width / 2 - parentLayout.width / 2
        const centerY = -(top + height / 2 - parentLayout.height / 2)

        return {
            width,
            height,
            left,
            top,
            right,
            bottom,
            x,
            y,
            centerX,
            centerY,
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
