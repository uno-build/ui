import Style from './style'
import Node from './Node.ts'

export default class UI {
    public root = null
    private renderer = null
    private nodes = new Set()
    private next_node_id = 0

    constructor({ renderer }) {
        this.renderer = renderer
    }

    public async init() {
        await this.renderer.init()
        this.root = this.create()
    }

    public create(styles = {}) {
        const node = new Node({
            id: this.next_node_id++,
            ui: this,
        })

        node.element = this.renderer.createElement(node)

        Object.keys(styles).forEach((name) => {
            this.setStyle(node, name, styles[name])
        })

        return node
    }

    public update() {
        this.renderer.beforeUpdate(this.nodes)
        this.root.layout = this.renderer.getLayout(this.root)

        // Calculate layout
        for (const node of this.nodes) {
            node.layout = this.renderer.getLayout(node)
        }

        // Paint order
        const nodes_ordered = [...this.nodes].sort(comparePaintOrder)
        for (let i = 0; i < nodes_ordered.length; i++) {
            nodes_ordered[i].order = i
        }

        this.renderer.afterUpdate(this.nodes)
    }

    private setStyle(node, name, value) {
        const style = Style.resolveStyle(name, value)
        node.styles[style.name] = {
            value: style.value,
            parsed: style.parsed,
        }
        this.renderer.addPendingStyle(node, style)
    }

    private addChild(parent, child) {
        if (this.nodes.has(child) === true) {
            throw new Error('child already added')
        }
        if (parent !== this.root && this.nodes.has(parent) === false) {
            throw new Error('cannot add child before adding parent')
        }
        const childIndex = this.renderer.getChildIndex(parent)
        child.parent = parent
        child.path = [...parent.path, childIndex]
        this.nodes.add(child)
        this.renderer.addChild(parent, child)
    }

    private removeChild(child) {
        const parent = child.parent
        child.parent = null
        this.nodes.delete(child)
        this.renderer.removeChild(parent, child)
    }
}

export function comparePaintOrder(a, b) {
    const depth = readDivergentDepth(a.path, b.path)

    if (depth === a.path.length) {
        return -1
    }
    if (depth === b.path.length) {
        return 1
    }

    const branchA = readAncestorAtDepth(a, depth + 1)
    const branchB = readAncestorAtDepth(b, depth + 1)

    return (
        readZIndex(branchA) - readZIndex(branchB) ||
        branchA.path[depth] - branchB.path[depth]
    )
}

function readDivergentDepth(a, b, depth = 0) {
    return depth < a.length && depth < b.length && a[depth] === b[depth]
        ? readDivergentDepth(a, b, depth + 1)
        : depth
}

function readAncestorAtDepth(node, depth) {
    return node.path.length === depth
        ? node
        : readAncestorAtDepth(node.parent, depth)
}

function readZIndex(node) {
    return node.styles.zIndex?.parsed.value ?? 0
}

// STACKING CONTEXTS VERSION (NOT FORCING ZINDEX TO 0 FOR ALL NODES)
// export function comparePaintOrder(a, b) {
//     if (isAncestor(a, b)) {
//         return -1
//     }
//     if (isAncestor(b, a)) {
//         return 1
//     }

//     return compareStackingContexts(
//         readStackingContexts(a),
//         readStackingContexts(b),
//         a,
//         b,
//     )
// }

// function compareStackingContexts(
//     contextsA,
//     contextsB,
//     nodeA,
//     nodeB,
//     index = 0,
// ) {
//     const contextA = contextsA[index]
//     const contextB = contextsB[index]

//     if (contextA != null && contextB != null) {
//         return contextA === contextB
//             ? compareStackingContexts(
//                   contextsA,
//                   contextsB,
//                   nodeA,
//                   nodeB,
//                   index + 1,
//               )
//             : compareStackingItems(contextA, contextB)
//     }

//     if (contextA != null) {
//         return compareStackingItemToAutoItem(contextA, nodeB)
//     }
//     if (contextB != null) {
//         return -compareStackingItemToAutoItem(contextB, nodeA)
//     }

//     return comparePath(nodeA, nodeB)
// }

// function compareStackingItems(a, b) {
//     return readZIndex(a) - readZIndex(b) || comparePath(a, b)
// }

// function compareStackingItemToAutoItem(context, node) {
//     return readZIndex(context) || comparePath(context, node)
// }

// function readStackingContexts(node) {
//     const contexts =
//         node.parent == null ? [] : readStackingContexts(node.parent)

//     return createsStackingContext(node) ? [...contexts, node] : contexts
// }

// function createsStackingContext(node) {
//     return node.styles.zIndex != null
// }

// function isAncestor(a, b) {
//     return a.path.length < b.path.length && pathStartsWith(b.path, a.path)
// }

// function pathStartsWith(path, prefix, index = 0) {
//     return index === prefix.length
//         ? true
//         : path[index] === prefix[index] &&
//               pathStartsWith(path, prefix, index + 1)
// }

// function comparePath(a, b) {
//     const index = readDivergentIndex(a.path, b.path)
//     return (a.path[index] ?? -1) - (b.path[index] ?? -1)
// }

// function readDivergentIndex(a, b, index = 0) {
//     return index < a.length && index < b.length && a[index] === b[index]
//         ? readDivergentIndex(a, b, index + 1)
//         : index
// }

// function readZIndex(node) {
//     return node.styles.zIndex.parsed.value
// }
