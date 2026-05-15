// import { sortNodesForCanvasPaint } from '../order.ts'
import Node from './NodeYoga.js'

export default class UI {
    public nodes = new Set()
    public root
    private Yoga

    constructor({ Yoga }) {
        this.Yoga = Yoga
        const yoga_config = Yoga.Config.create()
        yoga_config.setUseWebDefaults(true)
        // yoga_config.setPointScaleFactor(200)
        yoga_config.setExperimentalFeatureEnabled(
            0, // ExperimentalFeature.WebFlexBasis
            true,
        )

        this.root = new Node({
            yoga: this.Yoga.Node.create(yoga_config),
            props: {},
            nodes: this.nodes,
        })
    }

    create(props) {
        const yoga = this.Yoga.Node.create()
        return new Node({
            yoga,
            props,
            nodes: this.nodes,
        })
    }

    update() {
        this.root.yoga.calculateLayout()
        const nodes = []
        for (const node of this.nodes) {
            const layout = node.yoga.getComputedLayout()
            if (!deepEqual(layout, node.layout)) {
                nodes.push(node)
            }
            node.layout = layout
        }
        return nodes
    }
}

function deepEqual(obj1, obj2) {
    for (const key in obj1) {
        if (obj1[key] !== obj2[key]) {
            return false
        }
    }
    return true
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
