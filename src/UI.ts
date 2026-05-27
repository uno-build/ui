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
        for (const node of this.nodes) {
            node.layout = this.renderer.getLayout(node)
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
