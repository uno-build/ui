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
