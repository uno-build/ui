import Style from './style'
import Node from './Node'
import { sortPaintingOrder } from './utils/sortPaintingOrder'

export default class UI {
    public root = null
    private renderer = null
    private nodes = []
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
        this.nodes.sort(sortPaintingOrder)
        this.renderer.beforeUpdate(this.nodes)
        this.root.layout = this.renderer.getLayout(this.root)

        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i]
            node.layout = this.renderer.getLayout(node)
            node.order = i
        }

        this.renderer.afterUpdate(this.nodes)
    }

    public setStyle(node, name, value) {
        const styles = Style.resolveStyle(name, value)
        for (const style of styles) {
            node.styles[style.name] = {
                value: style.value,
                parsed: style.parsed,
            }
            this.renderer.addPendingStyle(node, style)
        }
    }

    private addChild(parent, child) {
        if (this.nodes.includes(child) === true) {
            throw new Error('child already added')
        }
        if (parent !== this.root && this.nodes.includes(parent) === false) {
            throw new Error('cannot add child before adding parent')
        }
        const child_index = this.renderer.getChildIndex(parent)
        child.parent = parent
        child.path = [...parent.path, child_index]
        parent.children.push(child)
        this.nodes.push(child)
        this.renderer.addChild(parent, child)
    }

    private removeChild(child) {
        const index = this.nodes.indexOf(child)
        if (index === -1) {
            throw new Error('child not found')
        }

        for (const nested_child of [...child.children]) {
            this.removeChild(nested_child)
        }

        const parent = child.parent
        child.parent = null
        child.children.length = 0
        parent.children.splice(parent.children.indexOf(child), 1)
        this.nodes.splice(index, 1)
        this.renderer.discardPendingStyles(child)
        this.renderer.removeChild(parent, child)
        child.element = null
    }
}
