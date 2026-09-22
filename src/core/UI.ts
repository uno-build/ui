import type Renderer from './Renderer'
import type Resources from './Resources'
import type { CoreEventMap, UIEventMap } from '../events/types'
import type { Operation } from './Operations'
import type { StyleUpdate } from '../style/types'

import Node from './Node'
import EventEmitter from './EventEmitter'
import Operations from './Operations'
import { isNodeAtPoint, sortPaintingOrder } from '../utils/nodes'
import { CORE_EVENT, OPERATIONS, RESOURCE_EVENT } from './constants'
import { isSameLayout } from '../layouter/utils'

export type DefinedEvent = {
    types: Array<{ platform: boolean, name: string, prop: string, priority: string }>
    destroy(): void
}

export type EventOptions<TUI extends UI> = {
    defined_events?: Array<(options: { ui: TUI }) => DefinedEvent>
}

type RendererNode<TRenderer extends Renderer<unknown, unknown, unknown, unknown>> = Node<ReturnType<TRenderer['createElement']>>

export default class UI<
    TRenderer extends Renderer<unknown, unknown, unknown, unknown> = Renderer<unknown, unknown, unknown, unknown>,
    TResources extends Resources<unknown> = Resources<unknown>,
> {
    root: RendererNode<TRenderer> | null = null
    renderer: TRenderer | null = null
    resources: TResources | null = null
    defined_events: DefinedEvent[] = []
    events: EventEmitter<UIEventMap>
    events_source: EventEmitter<CoreEventMap>
    operations = new Operations<ReturnType<TRenderer['createElement']>>()
    private nodes: RendererNode<TRenderer>[] = []
    private nodes_created = new Set<RendererNode<TRenderer>>()
    private next_node_id = 0
    private destroyed = false
    private device_pixel_ratio: number | undefined
    private viewport_width: number | undefined
    private viewport_height: number | undefined
    private root_size: number | undefined
    private offImageResources: (() => void) | null | undefined
    private offFontResources: (() => void) | null | undefined

    protected constructor({ renderer, resources = null, defined_events = [] }: { renderer: TRenderer, resources?: TResources | null, defined_events?: Array<(options: { ui: UI<TRenderer, TResources> }) => DefinedEvent> }) {
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

    protected async initialize() {
        const output = await this.renderer!.init()
        this.root = this.create()!
        this.nodes.push(this.root)
        this.operations.add({ op: OPERATIONS.ADD, node: this.root, parent: null })
        return output
    }

    create(): RendererNode<TRenderer> | undefined {
        if (!this.destroyed) {
            const node = new Node<ReturnType<TRenderer['createElement']>>({
                id: this.next_node_id++,
                ui: this,
            })

            node.element = this.renderer!.createElement(node) as ReturnType<TRenderer['createElement']>
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
                    this.nodes[i]!.order = i
                }
            }

            // Update styles
            for (const { op, node, style } of operations.items as Array<Operation<ReturnType<TRenderer['createElement']>> & { node?: RendererNode<TRenderer>, style?: StyleUpdate }>) {
                if (op === OPERATIONS.STYLE && node.ui !== null) {
                    this.renderer!.updateStyle(node, style)
                }
            }

            operations.setUpdateLayout(this.renderer!.prepareLayout(this.nodes_created, operations))
            this.renderer!.beforeUpdate(this.nodes, operations)

            // Update Layout
            if (operations.needUpdateLayout()) {
                const updateLayout = (node: RendererNode<TRenderer>) => {
                    const layout = this.renderer!.getLayout(node)
                    if (!isSameLayout(node.layout, layout)) {
                        operations.layout_nodes.add(node)
                    }
                    node.layout = layout
                }
                this.nodes.forEach(updateLayout)
            }

            // Update
            this.renderer!.afterUpdate(this.nodes, operations)
            const output = this.renderer!.update(this.nodes, operations)
            operations.consume()
            this.events_source.emit(CORE_EVENT.UPDATED, { operations })

            return output
        }
    }

    draw(options?: Parameters<TRenderer['draw']>[0]): ReturnType<TRenderer['draw']> | undefined {
        if (!this.destroyed) {
            return this.renderer!.draw(options) as ReturnType<TRenderer['draw']>
        }
    }

    setDevicePixelRatio(device_pixel_ratio: number) {
        if (!this.destroyed && this.device_pixel_ratio !== device_pixel_ratio) {
            this.renderer!.setDevicePixelRatio(device_pixel_ratio)
            this.device_pixel_ratio = device_pixel_ratio
            this.operations.add({ op: OPERATIONS.PIXEL_RATIO, value: device_pixel_ratio })
        }
    }

    setViewport(width: number, height: number) {
        if (!this.destroyed && (this.viewport_width !== width || this.viewport_height !== height)) {
            this.renderer!.setViewport(width, height)
            this.viewport_width = width
            this.viewport_height = height
            this.operations.add({ op: OPERATIONS.VIEWPORT, width, height })
        }
    }

    setRootSize(root_size: number) {
        if (!this.destroyed && this.root_size !== root_size) {
            this.renderer!.setRootSize(root_size)
            this.root_size = root_size
            this.operations.add({ op: OPERATIONS.ROOT_SIZE, value: root_size })
        }
    }

    destroy(): boolean | void {
        if (!this.destroyed) {
            this.destroyed = true
            const nodes = [...this.nodes_created]

            this.offImageResources?.()
            this.offFontResources?.()
            this.offImageResources = null
            this.offFontResources = null
            this.renderer!.destroy(nodes)
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

    protected emitPlatformEvent(source_event: any, event_data: any) {
        const node = event_data === null ? null : this.getNodeAtPoint(event_data.x, event_data.y)
        this.events_source.emit(source_event.type, {
            source_event,
            event_data,
            node,
        })
    }

    private getNodeAtPoint(x: number, y: number) {
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            if (isNodeAtPoint(this.nodes[i]!, x, y)) {
                return this.nodes[i]!
            }
        }
        return null
    }

    addChild(parent: RendererNode<TRenderer>, child: RendererNode<TRenderer>, before_node: RendererNode<TRenderer> | null) {
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

        let ancestor: RendererNode<TRenderer> | null = parent
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
                this.updateNodePath(parent.children[i]!, [...parent.path, i])
            }
        }
        this.renderer!.addChild(parent, child, child_index)
        this.operations.add({ op: OPERATIONS.ADD, parent, node: child, child_index })
    }

    private updateNodePath(node: RendererNode<TRenderer>, path: number[], activate = false) {
        node.path = path

        if (activate) {
            this.nodes.push(node)
        }

        for (let i = 0; i < node.children.length; i++) {
            this.updateNodePath(node.children[i]!, [...path, i], activate)
        }
    }

    detachNode(node: RendererNode<TRenderer>) {
        const parent = node.parent
        if (parent === null) {
            return
        }

        const detached_nodes: RendererNode<TRenderer>[] = []
        const collectNodes = (current: RendererNode<TRenderer>) => {
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
            this.updateNodePath(parent.children[i]!, [...parent.path, i])
        }
        this.renderer!.detachChild(parent, node)
        node.parent = null
        this.operations.add({ op: OPERATIONS.REMOVE, parent, node })
    }

    destroyNode(node: RendererNode<TRenderer>) {
        if (node === this.root) {
            this.destroy()
            return
        }

        this.detachNode(node)
        this.destroySubtree(node)
    }

    private destroySubtree(node: RendererNode<TRenderer>) {
        for (const child of [...node.children]) {
            this.renderer!.detachChild(node, child, false)
            child.parent = null
            this.destroySubtree(child)
        }

        this.operations.discardNode(node)
        this.events_source.emit(CORE_EVENT.NODE_DESTROY, { node })
        node.destroyEvents()
        this.renderer!.destroyNode(node)
        this.nodes_created.delete(node)
        this.releaseNode(node)
    }

    private releaseNode(node: RendererNode<TRenderer>) {
        node.ui = null
        node.parent = null
        node.children.length = 0
        node.element = null
    }
}
