import Node from './Node'
import { resolveStyle } from '../style'
import { sortPaintingOrder } from '../utils/sort-painting-order'

export default class UI {
    public root = null
    public renderer = null
    private nodes = []
    private next_node_id = 0

    protected constructor({ renderer }) {
        this.renderer = renderer
    }

    protected async initialize() {
        const output = await this.renderer.init()
        this.root = this.create()
        return output
    }

    public create() {
        const node = new Node({
            id: this.next_node_id++,
            ui: this,
        })

        node.element = this.renderer.createElement(node)

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
        return this.renderer.update(this.nodes)
    }

    public draw(options?) {
        return this.renderer.draw(options)
    }

    public setDevicePixelRatio(device_pixel_ratio) {
        this.renderer.setDevicePixelRatio(device_pixel_ratio)
    }

    public setViewport(width, height) {
        this.renderer.setViewport(width, height)
    }

    public setRootSize(root_size) {
        this.renderer.setRootSize(root_size)
    }

    public style(node, name, value) {
        const resolved_style = resolveStyle(name, value)
        for (const style of resolved_style.expanded) {
            node.styles[style.name] = {
                value: style.value,
                parsed: style.parsed,
            }
        }
        this.renderer.addPendingStyle(node, resolved_style)
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
