import Node from './Node'
import Events, { EVENT_TYPES } from './Events'
import { nodeContainsPoint, sortPaintingOrder } from '../utils/nodes'

export default class UI {
    public root = null
    public renderer = null
    private events = new Events()
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

    protected dispatchEvent(source_event) {
        return !this.destroyed && EVENT_TYPES.includes(source_event.type)
    }

    protected dispatchEventAt(source_event, event_data) {
        const targets = event_data === null ? [] : this.getEventTargets(event_data.x, event_data.y)
        this.events.dispatch(source_event, event_data, targets)
    }

    private getEventTargets(x, y) {
        const targets = []

        for (let i = this.nodes.length - 1; i >= 0; i--) {
            if (nodeContainsPoint(this.nodes[i], x, y)) {
                targets.push(this.nodes[i])
            }
        }

        if (nodeContainsPoint(this.root, x, y)) {
            targets.push(this.root)
        }

        return targets
    }

    private addChild(parent, child, before_node) {
        if (child.ui !== this) {
            throw new Error('cannot add child from another UI')
        }
        if (child === this.root) {
            throw new Error('cannot add root as child')
        }
        if (child.parent !== null || this.nodes.includes(child) === true) {
            throw new Error('child already added')
        }
        const child_index = before_node === null ? parent.children.length : parent.children.indexOf(before_node)
        if (child_index === -1) {
            throw new Error('before child not found')
        }

        let ancestor = parent
        while (ancestor !== null) {
            if (ancestor === child) {
                throw new Error('cannot create node cycle')
            }
            ancestor = ancestor.parent
        }

        const parent_is_active = parent === this.root || this.nodes.includes(parent)
        child.parent = parent
        parent.children.splice(child_index, 0, child)
        if (parent_is_active) {
            this.activateNode(child, [...parent.path, child_index])
            for (let i = child_index + 1; i < parent.children.length; i++) {
                this.updateNodePath(parent.children[i], [...parent.path, i])
            }
        }
        this.renderer.addChild(parent, child, child_index)
    }

    private activateNode(node, path) {
        node.path = path
        this.nodes.push(node)

        for (let i = 0; i < node.children.length; i++) {
            this.activateNode(node.children[i], [...path, i])
        }
    }

    private updateNodePath(node, path) {
        node.path = path

        for (let i = 0; i < node.children.length; i++) {
            this.updateNodePath(node.children[i], [...path, i])
        }
    }

    private detachNode(node) {
        const parent = node.parent
        if (parent === null) {
            return
        }

        const detached_nodes = []
        const collectNodes = (current) => {
            detached_nodes.push(current)
            for (const child of current.children) {
                collectNodes(child)
            }
        }
        collectNodes(node)

        const detached_set = new Set(detached_nodes)
        this.nodes = this.nodes.filter((current) => detached_set.has(current) === false)
        parent.children.splice(parent.children.indexOf(node), 1)
        for (let i = 0; i < parent.children.length; i++) {
            this.updateNodePath(parent.children[i], [...parent.path, i])
        }
        this.renderer.detachChild(parent, node)
        node.parent = null
    }

    private destroyNode(node) {
        this.renderer.discardPendingStyles(node)
        this.renderer.destroyNode(node)
        this.created_nodes.delete(node)
        this.events.destroyNode(node)
        node.ui = null
        node.parent = null
        node.children.length = 0
        node.element = null
    }

    public destroy() {
        if (!this.destroyed) {
            this.destroyed = true
            const nodes = [...this.created_nodes]

            this.renderer.destroy(nodes)
            this.events.destroy()

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
            return true
        }
        return false
    }
}
