import Node from './Node'
import EventEmitter from './EventEmitter'
import Operations from './Operations'
import { isNodeAtPoint, sortPaintingOrder } from '../utils/nodes'
import { OPERATIONS, RESOURCE_EVENT } from './constants'
import { isSameLayout } from '../layouter/utils'

/**
 * @typedef {object} DefinedEvent
 * @property {Array<{ platform: boolean, name: string, prop: string, priority: string }>} types
 * @property {() => void} destroy
 * @property {(node: Node) => void} [destroyNode]
 */

/**
 * @template {UI} TUI
 * @typedef {object} EventOptions
 * @property {Array<(options: { ui: TUI }) => DefinedEvent>} [defined_events]
 */

/**
 * @template {import('./Renderer').default<any, any>} [TRenderer=import('./Renderer').default<any, unknown>]
 * @template {import('./Resources').default} [TResources=import('./Resources').default]
 */
export default class UI {
    /** @type {Node<ReturnType<TRenderer['createElement']>> | null} */
    root = null
    /** @type {TRenderer | null} */
    renderer = null
    /** @type {TResources | null} */
    resources = null
    defined_events = []
    /** @type {EventEmitter<import('../events/types').UIEventMap>} */
    events
    events_source
    /** @protected */
    operations = new Operations()
    /** @private */
    nodes = []
    /** @private */
    nodes_created = new Set()
    /** @private */
    next_node_id = 0
    /** @private */
    destroyed = false
    /** @private */
    device_pixel_ratio
    /** @private */
    viewport_width
    /** @private */
    viewport_height
    /** @private */
    root_size
    /** @private */
    offImageResources
    /** @private */
    offFontResources

    /**
     * @protected
     * @param {any} options
     */
    constructor({ renderer, resources = null, defined_events = [] }) {
        this.renderer = renderer
        this.resources = resources
        this.events = new EventEmitter()
        this.events_source = new EventEmitter()
        this.offImageResources = resources?.events.on(RESOURCE_EVENT.IMAGE, () => {
            this.operations.add({ op: OPERATIONS.RESOURCE_IMAGE })
        })
        this.offFontResources = resources?.events.on(RESOURCE_EVENT.FONT, () => {
            this.operations.add({ op: OPERATIONS.RESOURCE_FONT })
        })
        this.defined_events = defined_events.map((definedEvent) => definedEvent({ ui: this }))
    }

    /** @protected */
    async initialize() {
        const output = await this.renderer.init()
        this.root = this.create()
        this.nodes.push(this.root)
        this.operations.add({ op: OPERATIONS.ADD, node: this.root, parent: null })
        return output
    }

    /** @returns {Node<ReturnType<TRenderer['createElement']>> | undefined} */
    create() {
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

    update() {
        if (!this.destroyed) {
            const operations = this.operations
            if (!operations.capture()) {
                return
            }

            // Update Order
            if (operations.needUpdateOrder()) {
                this.nodes.sort(sortPaintingOrder)
                for (let i = 0; i < this.nodes.length; i++) {
                    this.nodes[i].order = i
                }
            }

            // Update styles
            for (const { op, node, style } of operations.items) {
                if (op === OPERATIONS.STYLE && node.ui !== null) {
                    this.renderer.updateStyle(node, style)
                }
            }

            operations.setUpdateLayout(this.renderer.prepareLayout(this.nodes_created, operations))
            this.renderer.beforeUpdate(this.nodes, operations)

            // Update Layout
            if (operations.needUpdateLayout()) {
                const updateLayout = (node) => {
                    const layout = this.renderer.getLayout(node)
                    if (!isSameLayout(node.layout, layout)) {
                        operations.layout_nodes.add(node)
                    }
                    node.layout = layout
                }
                this.nodes.forEach(updateLayout)
            }

            // Update
            this.renderer.afterUpdate(this.nodes, operations)
            const output = this.renderer.update(this.nodes, operations)
            operations.consume()

            return output
        }
    }

    /**
     * @param {Parameters<TRenderer['draw']>[0]} [options]
     * @returns {ReturnType<TRenderer['draw']> | undefined}
     */
    draw(options) {
        if (!this.destroyed) {
            return this.renderer.draw(options)
        }
    }

    /** @param {number} device_pixel_ratio */
    setDevicePixelRatio(device_pixel_ratio) {
        if (!this.destroyed && this.device_pixel_ratio !== device_pixel_ratio) {
            this.renderer.setDevicePixelRatio(device_pixel_ratio)
            this.device_pixel_ratio = device_pixel_ratio
            this.operations.add({ op: OPERATIONS.PIXEL_RATIO, value: device_pixel_ratio })
        }
    }

    /** @param {number} width @param {number} height */
    setViewport(width, height) {
        if (!this.destroyed && (this.viewport_width !== width || this.viewport_height !== height)) {
            this.renderer.setViewport(width, height)
            this.viewport_width = width
            this.viewport_height = height
            this.operations.add({ op: OPERATIONS.VIEWPORT, width, height })
        }
    }

    /** @param {number} root_size */
    setRootSize(root_size) {
        if (!this.destroyed && this.root_size !== root_size) {
            this.renderer.setRootSize(root_size)
            this.root_size = root_size
            this.operations.add({ op: OPERATIONS.ROOT_SIZE, value: root_size })
        }
    }

    /** @returns {boolean | void} */
    destroy() {
        if (!this.destroyed) {
            this.destroyed = true
            const nodes = [...this.nodes_created]

            this.offImageResources?.()
            this.offFontResources?.()
            this.offImageResources = null
            this.offFontResources = null
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

    /**
     * @protected
     * @param {any} source_event
     * @param {any} event_data
     */
    emitPlatformEvent(source_event, event_data) {
        const node = event_data === null ? null : this.getNodeAtPoint(event_data.x, event_data.y)
        this.events_source.emit(source_event.type, {
            source_event,
            event_data,
            node,
        })
    }

    /** @private */
    getNodeAtPoint(x, y) {
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            if (isNodeAtPoint(this.nodes[i], x, y)) {
                return this.nodes[i]
            }
        }
        return null
    }

    /** @private */
    addChild(parent, child, before_node) {
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

        const parent_is_active = this.nodes.includes(parent)
        child.parent = parent
        parent.children.splice(child_index, 0, child)
        if (parent_is_active) {
            this.updateNodePath(child, [...parent.path, child_index], true)
            for (let i = child_index + 1; i < parent.children.length; i++) {
                this.updateNodePath(parent.children[i], [...parent.path, i])
            }
        }
        this.renderer.addChild(parent, child, child_index)
        this.operations.add({ op: OPERATIONS.ADD, parent, node: child, child_index })
    }

    /** @private */
    updateNodePath(node, path, activate = false) {
        node.path = path

        if (activate) {
            this.nodes.push(node)
        }

        for (let i = 0; i < node.children.length; i++) {
            this.updateNodePath(node.children[i], [...path, i], activate)
        }
    }

    /** @private */
    detachNode(node) {
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
        this.operations.add({ op: OPERATIONS.REMOVE, parent, node })
    }

    /** @private */
    destroyNode(node) {
        if (node === this.root) {
            this.destroy()
            return
        }

        this.detachNode(node)
        this.destroySubtree(node)
    }

    /** @private */
    destroySubtree(node) {
        for (const child of [...node.children]) {
            this.renderer.detachChild(node, child, false)
            child.parent = null
            this.destroySubtree(child)
        }

        this.operations.discardNode(node)
        this.defined_events.forEach((defined_event) => defined_event.destroyNode?.(node))
        node.destroyEvents()
        this.renderer.destroyNode(node)
        this.nodes_created.delete(node)
        this.releaseNode(node)
    }

    /** @private */
    releaseNode(node) {
        node.ui = null
        node.parent = null
        node.children.length = 0
        node.element = null
    }
}
