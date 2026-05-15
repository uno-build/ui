import { setYogaProperty, isYogaProperty } from './properties.ts'
import BaseNode from '../node.ts'
// import { sortNodesForCanvasPaint } from '../order.ts'

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

class Node extends BaseNode {
    public yoga

    constructor({ yoga, props, nodes }) {
        super({ props, nodes })
        this.yoga = yoga
        this.applyProperties()
    }

    protected getChildIndex() {
        return this.yoga.getChildCount()
    }

    protected attachChild(child, child_index) {
        this.yoga.insertChild(child.yoga, child_index)
    }

    protected detachChild(child) {
        this.yoga.removeChild(child.yoga)
    }

    setProperty(key, value) {
        if (isYogaProperty(key)) {
            this.props[key] = value
            setYogaProperty(this.yoga, key, value)
            return
        } else if (isUnoProperty(key)) {
            this.props[key] = value
            return
        }
        // console.warn(`unsupported property ${key}`)
    }

    on(type, listener) {
        // no-op
    }

    off(type, listener) {
        // no-op
    }
}

const cssUnoProperties = new Set(['zIndex'])
function isUnoProperty(key) {
    return cssUnoProperties.has(key)
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
