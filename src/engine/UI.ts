import Style from '../style'
import Node from './Node.ts'

export default class UI {
    public root = null
    private renderer = null
    private nodes = new Set()
    private node_id = 0
    private node_mutations = new Set()

    constructor({ renderer }) {
        this.renderer = renderer
    }

    public async init() {
        this.root = this.create({})
    }

    public create(styles = {}) {
        const node = new Node({
            id: this.getNextNodeId(),
            ui: this,
        })

        node.element = this.renderer.createElement(node)

        Object.keys(styles).forEach((name) => {
            this.setStyle(node, name, styles[name])
        })

        return node
    }

    public update() {
        for (const { node, mutation } of this.node_mutations) {
            this.renderer.setStyle(node, mutation.name, mutation.value)
        }

        for (const node of this.nodes) {
            node.layout = this.getLayout(node)
        }
    }

    private setStyle(node, name, value) {
        const style = Style.resolveStyle(name, value)
        node.styles[style.name] = {
            value: style.value,
            parsed: style.parsed,
        }
        this.node_mutations.add({ node, mutation: style })
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
        this.renderer.appendChild(parent, child)
    }

    private removeChild(child) {
        const parent = child.parent
        this.nodes.delete(child)
        child.parent = undefined
        this.renderer.removeChild(parent, child)
    }

    private getNextNodeId() {
        return this.node_id++
    }

    private getLayout(node) {
        const parentLayout =
            node.parent === this.root
                ? { x: 0, y: 0 }
                : (node.parent?.layout ?? { x: 0, y: 0 })
        return this.renderer.getLayout({
            node,
            parentLayout,
            root: this.root,
        })
    }
}
