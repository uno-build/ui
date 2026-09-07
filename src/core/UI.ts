import Node from './Node'
import EventEmitter from './EventEmitter'
import { isNodeAtPoint, sortPaintingOrder } from '../utils/nodes'
import { isSameLayout } from '../layouter/utils'
import { OPERATIONS } from './operations'

export { OPERATIONS } from './operations'

export default class UI {
    public root = null
    public renderer = null
    public resources = null
    public defined_events = []
    public events
    public events_source
    protected operations = []
    private nodes = []
    private nodes_created = new Set()
    private next_node_id = 0
    private destroyed = false
    private device_pixel_ratio
    private viewport_width
    private viewport_height
    private root_size

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
        if (!this.destroyed) {
            const operation_count = this.operations.length
            const operations = [...this.operations, ...this.renderer.getPendingOperations()]
            if (operations.length === 0) {
                return
            }
            const compacted_operations = this.compactOperations(operations)

            const update_plan = this.createUpdatePlan(compacted_operations)
            if (update_plan.painting_order) {
                this.nodes.sort(sortPaintingOrder)
            }

            this.renderer.beforeUpdate(this.nodes, update_plan)
            if (update_plan.layout) {
                const root_layout = this.renderer.getLayout(this.root)
                if (!isSameLayout(this.root.layout, root_layout)) {
                    update_plan.layout_nodes.add(this.root)
                }
                this.root.layout = root_layout

                for (let i = 0; i < this.nodes.length; i++) {
                    const node = this.nodes[i]
                    const layout = this.renderer.getLayout(node)
                    if (!isSameLayout(node.layout, layout)) {
                        update_plan.layout_nodes.add(node)
                    }
                    node.layout = layout
                    node.order = i
                }
            } else if (update_plan.painting_order) {
                for (let i = 0; i < this.nodes.length; i++) {
                    this.nodes[i].order = i
                }
            }

            this.renderer.afterUpdate(this.nodes, update_plan)
            const output = this.renderer.update(this.nodes, update_plan)
            this.operations.splice(0, operation_count)

            return output
        }
    }

    public draw(options?) {
        if (!this.destroyed) {
            return this.renderer.draw(options)
        }
    }

    public setDevicePixelRatio(device_pixel_ratio) {
        if (!this.destroyed && this.device_pixel_ratio !== device_pixel_ratio) {
            const changed = this.renderer.setDevicePixelRatio(device_pixel_ratio)
            this.device_pixel_ratio = device_pixel_ratio
            if (changed !== false) {
                this.operations.push({ op: OPERATIONS.PIXEL_RATIO, value: device_pixel_ratio })
            }
        }
    }

    public setViewport(width, height) {
        if (!this.destroyed && (this.viewport_width !== width || this.viewport_height !== height)) {
            const changed = this.renderer.setViewport(width, height)
            this.viewport_width = width
            this.viewport_height = height
            if (changed !== false) {
                this.operations.push({ op: OPERATIONS.VIEWPORT, width, height })
            }
        }
    }

    public setRootSize(root_size) {
        if (!this.destroyed && this.root_size !== root_size) {
            const changed = this.renderer.setRootSize(root_size)
            this.root_size = root_size
            if (changed !== false) {
                this.operations.push({ op: OPERATIONS.ROOT_SIZE, value: root_size })
            }
        }
    }

    private createUpdatePlan(operations) {
        for (const { op, node, style } of operations) {
            if (op === OPERATIONS.STYLE && node.ui !== null) {
                this.renderer.updateStyle(node, style)
            }
        }

        return {
            operations,
            layout: this.renderer.prepareLayout(operations, this.nodes_created),
            layout_nodes: new Set(),
            scroll_nodes: new Set(),
            painting_order: operations.some(
                ({ op, style }) =>
                    op === OPERATIONS.ADD ||
                    op === OPERATIONS.REMOVE ||
                    (op === OPERATIONS.STYLE && style.expanded.some(({ name }) => name === 'zIndex')),
            ),
        }
    }

    private compactOperations(operations) {
        const compacted_operations = []
        const style_names_by_node = new Map()
        const text_nodes = new Set()
        const scroll_directions_by_node = new Map()
        const global_operations = new Set()
        let resources_operation

        for (let i = operations.length - 1; i >= 0; i--) {
            const operation = operations[i]

            if (operation.op === OPERATIONS.STYLE) {
                let style_names = style_names_by_node.get(operation.node)
                if (style_names === undefined) {
                    style_names = new Set()
                    style_names_by_node.set(operation.node, style_names)
                }
                if (operation.style.expanded.every(({ name }) => style_names.has(name))) {
                    continue
                }
                for (const { name } of operation.style.expanded) {
                    style_names.add(name)
                }
            } else if (operation.op === OPERATIONS.TEXT) {
                if (text_nodes.has(operation.node)) {
                    continue
                }
                text_nodes.add(operation.node)
            } else if (operation.op === OPERATIONS.SCROLL) {
                let directions = scroll_directions_by_node.get(operation.node)
                if (directions === undefined) {
                    directions = new Set()
                    scroll_directions_by_node.set(operation.node, directions)
                }
                if (directions.has(operation.direction)) {
                    continue
                }
                directions.add(operation.direction)
            } else if (operation.op === OPERATIONS.RESOURCES) {
                if (resources_operation === undefined) {
                    resources_operation = { ...operation }
                    compacted_operations.push(resources_operation)
                } else {
                    resources_operation.image ||= operation.image
                    resources_operation.font ||= operation.font
                }
                continue
            } else if (
                operation.op === OPERATIONS.VIEWPORT ||
                operation.op === OPERATIONS.PIXEL_RATIO ||
                operation.op === OPERATIONS.ROOT_SIZE
            ) {
                if (global_operations.has(operation.op)) {
                    continue
                }
                global_operations.add(operation.op)
            }

            compacted_operations.push(operation)
        }

        return compacted_operations.reverse()
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

            this.operations.length = 0
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
        this.operations.push({ op: OPERATIONS.ADD, parent, node: child, child_index })
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
        this.operations.push({ op: OPERATIONS.REMOVE, parent, node })
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

        for (let i = this.operations.length - 1; i >= 0; i--) {
            const operation = this.operations[i]
            if (
                operation.node === node &&
                operation.op !== OPERATIONS.ADD &&
                operation.op !== OPERATIONS.REMOVE
            ) {
                this.operations.splice(i, 1)
            }
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
