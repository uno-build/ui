import { loadYoga, ExperimentalFeature } from 'yoga-layout/load'
import { setYogaProperty, isYogaProperty } from './properties.ts'
// import { sortNodesForCanvasPaint } from '../order.ts'

export default function UI({}) {
    let Yoga
    this.nodes = new Set()

    this.init = async () => {
        Yoga = await loadYoga()
        const yoga_config = Yoga.Config.create()
        yoga_config.setUseWebDefaults(true)
        // yoga_config.setPointScaleFactor(200)
        yoga_config.setExperimentalFeatureEnabled(
            ExperimentalFeature.WebFlexBasis,
            true,
        )
        this.root = new Node({
            yoga: Yoga.Node.create(yoga_config),
            props: {},
            nodes: this.nodes,
        })
    }

    this.create = (props) => {
        const yoga = Yoga.Node.create()
        return new Node({
            yoga,
            props,
            nodes: this.nodes,
        })
    }

    this.update = () => {
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

    this.render = () => {}
}

function Node({ yoga, props, nodes }) {
    this.yoga = yoga
    this.parent = undefined
    this.path = []
    this.layout = {}
    this.props = props

    this.add = (child) => {
        if (nodes.has(child)) {
            throw new Error('child already added')
        }
        const child_index = yoga.getChildCount()
        child.parent = this
        child.path = [...(this.path || []), child_index]
        nodes.add(child)
        yoga.insertChild(child.yoga, child_index)
    }
    this.remove = (child) => {
        nodes.delete(child)
        yoga.removeChild(child.yoga)
    }
    this.setProperty = (key, value) => {
        if (isYogaProperty(key)) {
            props[key] = value
            setYogaProperty(yoga, key, value)
            return
        } else if (isUnoProperty(key)) {
            props[key] = value
            return
        }
        // console.warn(`unsupported property ${key}`)
    }
    this.on = (type, listener) => {
        // no-op
    }
    this.off = (type, listener) => {
        // no-op
    }

    Object.keys(props).forEach((key) => {
        this.setProperty(key, props[key])
    })
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
