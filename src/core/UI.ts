import Node from './Node'
import { resolveStyle } from '../style'
import { sortPaintingOrder } from '../utils/sort-painting-order'

export default class UI {
    public root = null
    public renderer = null
    private nodes = []
    private created_nodes = new Set()
    private next_node_id = 0
    private destroyed = false

    protected constructor({ renderer }) {
        this.renderer = renderer
    }

    protected async initialize() {
        const output = await this.renderer.init()
        this.root = this.create()
        return output
    }

    public create() {
        if (!this.destroyed) {
            const node = new Node({
                id: this.next_node_id++,
                ui: this,
            })

            node.element = this.renderer.createElement(node)
            this.created_nodes.add(node)

            return node
        }
    }

    public update() {
        if (!this.destroyed) {
            this.nodes.sort(sortPaintingOrder)
            this.renderer.beforeUpdate(this.nodes)
            this.root.layout = this.renderer.getLayout(this.root)

            for (let i = 0; i < this.nodes.length; i++) {
                const node = this.nodes[i]
                node.layout = this.renderer.getLayout(node)
                node.order = i
            }

            this.renderer.afterUpdate(this.nodes)
            return this.renderer.update(this.nodes)
        }
    }

    public draw(options?) {
        if (!this.destroyed) {
            return this.renderer.draw(options)
        }
    }

    public setDevicePixelRatio(device_pixel_ratio) {
        if (!this.destroyed) {
            this.renderer.setDevicePixelRatio(device_pixel_ratio)
        }
    }

    public setViewport(width, height) {
        if (!this.destroyed) {
            this.renderer.setViewport(width, height)
        }
    }

    public setRootSize(root_size) {
        if (!this.destroyed) {
            this.renderer.setRootSize(root_size)
        }
    }

    public style(node, name, value) {
        if (!this.destroyed) {
            const resolved_style = resolveStyle(name, value)
            for (const style of resolved_style.expanded) {
                node.styles[style.name] = {
                    value: style.value,
                    parsed: style.parsed,
                }
            }
            this.renderer.addPendingStyle(node, resolved_style)
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
        child.ui = null
        child.parent = null
        child.children.length = 0
        parent.children.splice(parent.children.indexOf(child), 1)
        this.nodes.splice(index, 1)
        this.renderer.discardPendingStyles(child)
        this.renderer.removeChild(parent, child)
        this.created_nodes.delete(child)
        child.element = null
    }

    public destroy() {
        if (!this.destroyed) {
            this.destroyed = true
            const nodes = [...this.created_nodes]

            this.renderer.destroy(nodes)

            for (const node of nodes) {
                node.ui = null
                node.parent = null
                node.children.length = 0
                node.element = null
            }

            this.created_nodes.clear()
            this.nodes.length = 0
            this.root = null
            this.renderer = null
            this.destroyResources()
        }
    }

    protected destroyResources() {}
}
