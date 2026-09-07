import Node from './Node'
import EventEmitter from './EventEmitter'
import { isNodeAtPoint, sortPaintingOrder } from '../utils/nodes'

export const OPERATIONS = {
    ADD: 'add',
    REMOVE: 'remove',
    STYLE: 'style',
    TEXT: 'text',
    SCROLL: 'scroll',
    VIEWPORT: 'viewport',
    ROOT_SIZE: 'root_size',
    PIXEL_RATIO: 'pixel_ratio',
}

export default class UI {
    public root = null
    public renderer = null
    public resources = null
    public defined_events = []
    public events
    public events_source
    protected operations = new Set()
    private nodes = []
    private nodes_created = new Set()
    private next_node_id = 0
    private destroyed = false

    protected constructor({ renderer, resources = null, defined_events = [] }) {
        this.renderer = renderer
        this.resources = resources
        this.events = new EventEmitter()
        this.events_source = new EventEmitter()
        this.defined_events = defined_events.map((definedEvent) => definedEvent({ ui: this }))
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
            this.nodes_created.add(node)

            return node
        }
    }

    public update() {
        // console.log(
        //     '------update',
        //     Array.from(this.operations).map((op) => op.op),
        // )

        if (!this.destroyed && this.operations.size > 0) {
            this.nodes.sort(sortPaintingOrder)

            for (const { op, node, style } of this.operations) {
                if (op === OPERATIONS.STYLE && this.nodes.includes(node)) {
                    this.renderer.updateStyle(node, style)
                }
            }

            this.renderer.beforeUpdate(this.nodes)
            this.root.layout = this.renderer.getLayout(this.root)

            for (let i = 0; i < this.nodes.length; i++) {
                const node = this.nodes[i]
                node.layout = this.renderer.getLayout(node)
                node.order = i
            }

            this.renderer.afterUpdate(this.nodes)
            this.operations.clear()

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
            this.operations.add({ op: OPERATIONS.PIXEL_RATIO })
            this.renderer.setDevicePixelRatio(device_pixel_ratio)
        }
    }

    public setViewport(width, height) {
        if (!this.destroyed) {
            this.operations.add({ op: OPERATIONS.VIEWPORT })
            this.renderer.setViewport(width, height)
        }
    }

    public setRootSize(root_size) {
        if (!this.destroyed) {
            this.operations.add({ op: OPERATIONS.ROOT_SIZE })
            this.renderer.setRootSize(root_size)
        }
    }

    public destroy() {
        if (!this.destroyed) {
            this.destroyed = true
            const nodes = [...this.nodes_created]

            this.renderer.destroy(nodes)
            this.defined_events.forEach((defined_event) => defined_event.destroy())
            this.defined_events.length = 0
            nodes.forEach((node) => node.destroyEvents())
            this.events.destroy()
            this.events_source.destroy()

            for (const node of nodes) {
                this.releaseNode(node)
            }

            this.operations.clear()
            this.nodes_created.clear()
            this.nodes.length = 0
            this.root = null
            this.renderer = null
            this.resources = null
            return true
        }
        return false
    }

    protected emitPlatformEvent(source_event, event_data) {
        const node = event_data === null ? null : this.getNodeAtPoint(event_data.x, event_data.y)
        this.events_source.emit(source_event.type, {
            source_event,
            event_data,
            node,
        })
    }

    private getNodeAtPoint(x, y) {
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            if (isNodeAtPoint(this.nodes[i], x, y)) {
                return this.nodes[i]
            }
        }
        return isNodeAtPoint(this.root, x, y) ? this.root : null
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

        this.operations.add({ op: OPERATIONS.ADD })

        const parent_is_active = parent === this.root || this.nodes.includes(parent)
        child.parent = parent
        parent.children.splice(child_index, 0, child)
        if (parent_is_active) {
            this.updateNodePath(child, [...parent.path, child_index], true)
            for (let i = child_index + 1; i < parent.children.length; i++) {
                this.updateNodePath(parent.children[i], [...parent.path, i])
            }
        }
        this.renderer.addChild(parent, child, child_index)
    }

    private updateNodePath(node, path, activate = false) {
        node.path = path

        if (activate) {
            this.nodes.push(node)
        }

        for (let i = 0; i < node.children.length; i++) {
            this.updateNodePath(node.children[i], [...path, i], activate)
        }
    }

    private detachNode(node) {
        const parent = node.parent
        if (parent === null) {
            return
        }

        this.operations.add({ op: OPERATIONS.REMOVE })

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
        if (node === this.root) {
            this.destroy()
            return
        }

        this.detachNode(node)
        this.destroySubtree(node)
    }

    private destroySubtree(node) {
        for (const child of [...node.children]) {
            this.renderer.detachChild(node, child)
            child.parent = null
            this.destroySubtree(child)
        }

        this.defined_events.forEach((defined_event) => defined_event.destroyNode?.(node))
        node.destroyEvents()
        this.renderer.destroyNode(node)
        this.nodes_created.delete(node)
        this.releaseNode(node)
    }

    private releaseNode(node) {
        node.ui = null
        node.parent = null
        node.children.length = 0
        node.element = null
    }
}
