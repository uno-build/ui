import { loadYoga, ExperimentalFeature } from 'yoga-layout/load'
import { setYogaProperty, isYogaProperty } from './properties.ts'
// import { sortNodesForCanvasPaint } from '../order.ts'

export default async function UI({}) {
    const self = {}
    const Yoga = await loadYoga()
    const yoga_config = Yoga.Config.create()
    yoga_config.setUseWebDefaults(true)
    // yoga_config.setPointScaleFactor(200)
    yoga_config.setExperimentalFeatureEnabled(
        ExperimentalFeature.WebFlexBasis,
        true,
    )

    self.nodes = new Set()
    self.root = new Node({
        yoga: Yoga.Node.create(yoga_config),
        props: {},
        nodes: self.nodes,
    })

    self.create = (props) => {
        const yoga = Yoga.Node.create()
        return Node({
            yoga,
            props,
            nodes: self.nodes,
        })
    }

    self.update = () => {
        self.root.yoga.calculateLayout()
        const nodes = []
        for (const node of self.nodes) {
            const layout = node.yoga.getComputedLayout()
            if (!deepEqual(layout, node.layout)) {
                nodes.push(node)
            }
            node.layout = layout
        }
        return nodes
    }

    self.render = () => {}

    return self
}

function Node({ yoga, props, nodes }) {
    const self = {}
    self.yoga = yoga
    self.parent = undefined
    self.path = []
    self.layout = {}
    self.props = props

    self.add = (child) => {
        if (nodes.has(child)) {
            throw new Error('child already added')
        }
        const child_index = yoga.getChildCount()
        child.parent = self
        child.path = [...(self.path || []), child_index]
        nodes.add(child)
        yoga.insertChild(child.yoga, child_index)
    }
    self.remove = (child) => {
        nodes.delete(child)
        yoga.removeChild(child.yoga)
    }
    self.setProperty = (key, value) => {
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
    self.on = (type, listener) => {
        // no-op
    }
    self.off = (type, listener) => {
        // no-op
    }

    Object.keys(props).forEach((key) => {
        self.setProperty(key, props[key])
    })

    return self
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
