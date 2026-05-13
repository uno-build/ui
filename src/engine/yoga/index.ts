import { loadYoga, ExperimentalFeature } from 'yoga-layout/load'
import { setYogaProperty, isYogaProperty } from './properties.ts'
// import { sortNodesForCanvasPaint } from '../order.ts'

export default async function UnoUI({ width, height }) {
    const Yoga = await loadYoga()
    const yoga_config = Yoga.Config.create()
    yoga_config.setUseWebDefaults(true)
    // yoga_config.setPointScaleFactor(200)
    yoga_config.setExperimentalFeatureEnabled(
        ExperimentalFeature.WebFlexBasis,
        true,
    )

    const state = { nodes: new Set(), root: null }
    state.root = create({ width: '100%', height: '100%' })

    function create(props) {
        const yoga = Yoga.Node.create(
            state.root === null ? yoga_config : undefined,
        )
        const add = (child) => {
            if (state.nodes.has(child)) {
                throw new Error('child already added')
            }
            const child_index = yoga.getChildCount()
            child.parent = node
            child.path = [...(node.path || []), child_index]
            state.nodes.add(child)
            yoga.insertChild(child.yoga, child_index)
        }
        const remove = (child) => {
            state.nodes.delete(child)
            yoga.removeChild(child.yoga)
        }
        const setProperty = (key, value) => {
            if (isYogaProperty(key)) {
                props[key] = value
                setYogaProperty(yoga, key, value)
                return
            } else if (isUnoProperty(key)) {
                props[key] = value
                return
            }
            console.warn(`unsupported property ${key}`)
        }
        const on = (type, listener) => {
            // no-op
        }
        const off = (type, listener) => {
            // no-op
        }

        const node = {
            yoga,
            parent: undefined,
            zIndex: props.zIndex || 0,
            path: [],
            layout: {},
            props,
            add,
            remove,
            setProperty,
            on,
            off,
        }

        Object.keys(props).forEach((key) => {
            setProperty(key, props[key])
        })

        return node
    }

    function update() {
        state.root.yoga.calculateLayout()
        const nodes = []
        for (const node of state.nodes) {
            const layout = node.yoga.getComputedLayout()
            if (!deepEqual(layout, node.layout)) {
                nodes.push(node)
            }
            node.layout = layout
        }
        return nodes
    }

    return {
        root: state.root,
        create,
        update,
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
