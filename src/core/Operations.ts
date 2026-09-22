import type Node from './Node'
import type { StyleUpdate } from '../style/types'
import type { EventSource } from '../events/types'
import { OPERATIONS } from './constants'
import { isPaintStyle, STYLE } from '../style'
import { OVERFLOW } from '../style/constants'

type ScrollState = Pick<Node, 'scroll_left' | 'scroll_top' | 'scrollWidth' | 'scrollHeight' | 'clientWidth' | 'clientHeight'> & {
    is_scroll_container: boolean
}

export type OperationNode<TElement = unknown> = Node<TElement>

export type Operation<TElement = unknown> =
    { op: 'add', parent: Node<TElement> | null, node: Node<TElement>, child_index?: number } |
    { op: 'remove', parent: Node<TElement>, node: Node<TElement> } |
    { op: 'style', node: Node<TElement>, style: StyleUpdate } |
    { op: 'text', node: Node<TElement>, value: string } |
    { op: 'scroll', node: Node<TElement>, source_event?: EventSource | null } |
    { op: 'viewport', width: number, height: number } |
    { op: 'root_size' | 'pixel_ratio', value: number } |
    { op: 'resource_image' | 'resource_font' }

export default class Operations<TElement = unknown> {
    items: Operation<TElement>[] = []
    layout_nodes = new Set<Node<TElement>>()
    scroll_nodes = new Set<Node<TElement>>()
    scroll_changed_nodes = new Set<Node<TElement>>()
    private confirmed_scroll_states = new WeakMap<Node<TElement>, ScrollState>()
    // Retained until consumption: a failed render may retry without recalculating layout.
    private pending_scroll_states = new Map<Node<TElement>, ScrollState>()
    private pending_scroll_nodes = new Set<Node<TElement>>()
    private pending: Operation<TElement>[] = []
    private captured = new Set<Operation<TElement>>()
    private update_order = false
    private check_layout = false
    private update_layout = false
    private update_scroll_metrics = false
    private context_changed = false

    add(operation: Operation<TElement>) {
        this.pending.push(operation)
    }

    capture() {
        this.reset()
        this.captured = new Set(this.pending)
        this.items = this.compact(this.pending)

        for (const operation of this.items) {
            if (operation.op === OPERATIONS.ADD || operation.op === OPERATIONS.REMOVE) {
                this.update_order = true
                this.check_layout = true
            } else if (operation.op === OPERATIONS.STYLE) {
                for (const { name } of operation.style.expanded) {
                    this.check_layout ||= !isPaintStyle(name)
                    this.update_order ||= name === STYLE.ZINDEX.name
                    this.update_scroll_metrics ||= name === STYLE.OVERFLOWX.name || name === STYLE.OVERFLOWY.name
                }
            } else if (operation.op === OPERATIONS.TEXT) {
                this.check_layout = true
            } else if (operation.op === OPERATIONS.SCROLL) {
                this.scroll_nodes.add(operation.node)
            } else if (operation.op === OPERATIONS.VIEWPORT || operation.op === OPERATIONS.ROOT_SIZE) {
                this.context_changed = true
                this.check_layout = true
            } else if (operation.op === OPERATIONS.RESOURCE_FONT) {
                this.check_layout = true
            }
        }

        return this.captured.size > 0
    }

    consume() {
        this.pending = this.pending.filter((operation) => !this.captured.has(operation))
        this.captured.clear()
        for (const [node, state] of this.pending_scroll_states) {
            this.confirmed_scroll_states.set(node, state)
        }
        this.pending_scroll_states.clear()
        this.scroll_changed_nodes = this.pending_scroll_nodes
        this.pending_scroll_nodes = new Set()
    }

    discardNode(node: Node<TElement>) {
        this.confirmed_scroll_states.delete(node)
        this.pending_scroll_states.delete(node)
        this.pending_scroll_nodes.delete(node)
        this.scroll_changed_nodes.delete(node)
        this.pending = this.pending.filter(
            (operation) =>
                (operation as { node?: Node<TElement> }).node !== node || operation.op === OPERATIONS.ADD || operation.op === OPERATIONS.REMOVE,
        )
    }

    clear() {
        this.confirmed_scroll_states = new WeakMap()
        this.pending_scroll_states.clear()
        this.pending_scroll_nodes.clear()
        this.pending.length = 0
        this.captured.clear()
        this.items = []
        this.reset()
    }

    recordScrollMetrics(node: Node<TElement>) {
        const previous = this.confirmed_scroll_states.get(node)
        const is_scroll_container =
            (node.styles.overflowX as { parsed: { enum: number } } | undefined)?.parsed.enum === OVERFLOW.scroll ||
            (node.styles.overflowY as { parsed: { enum: number } } | undefined)?.parsed.enum === OVERFLOW.scroll
        const position_changed =
            node.scrollLeft !== (previous?.scroll_left ?? 0) || node.scrollTop !== (previous?.scroll_top ?? 0)
        const metrics_changed = is_scroll_container && (
            previous?.is_scroll_container !== true ||
            node.scrollWidth !== previous.scrollWidth || node.scrollHeight !== previous.scrollHeight ||
            node.clientWidth !== previous.clientWidth || node.clientHeight !== previous.clientHeight
        )

        if (!position_changed && !metrics_changed && is_scroll_container === (previous?.is_scroll_container ?? false)) {
            this.pending_scroll_states.delete(node)
            this.pending_scroll_nodes.delete(node)
            return
        }

        this.pending_scroll_states.set(node, {
            scroll_left: node.scrollLeft,
            scroll_top: node.scrollTop,
            scrollWidth: node.scrollWidth,
            scrollHeight: node.scrollHeight,
            clientWidth: node.clientWidth,
            clientHeight: node.clientHeight,
            is_scroll_container,
        })
        if (position_changed || metrics_changed) {
            this.pending_scroll_nodes.add(node)
        } else {
            this.pending_scroll_nodes.delete(node)
        }
    }

    syncScrollMetrics(node: Node<TElement>) {
        this.recordScrollMetrics(node)
        const state = this.pending_scroll_states.get(node)
        if (state !== undefined) {
            this.confirmed_scroll_states.set(node, state)
            this.pending_scroll_states.delete(node)
        }
        return this.pending_scroll_nodes.delete(node)
    }

    needUpdateOrder() {
        return this.update_order
    }

    needCheckLayout() {
        return this.check_layout
    }

    setUpdateLayout(update_layout: boolean) {
        this.update_layout = update_layout
    }

    needUpdateLayout() {
        return this.update_layout
    }

    needUpdateScrollMetrics() {
        return this.update_scroll_metrics
    }

    hasContextChanges() {
        return this.context_changed
    }

    private reset() {
        this.layout_nodes.clear()
        this.scroll_nodes.clear()
        this.scroll_changed_nodes.clear()
        this.update_order = false
        this.check_layout = false
        this.update_layout = false
        this.update_scroll_metrics = false
        this.context_changed = false
    }

    private compact(operations: Operation<TElement>[]) {
        const compacted_operations = []
        const style_names_by_node = new Map<Node<TElement>, Set<string>>()
        const text_nodes = new Set()
        const scroll_nodes = new Set()
        const global_operations = new Set()

        for (let i = operations.length - 1; i >= 0; i--) {
            const operation = operations[i]!

            if (
                (operation.op === OPERATIONS.STYLE ||
                    operation.op === OPERATIONS.TEXT ||
                    operation.op === OPERATIONS.SCROLL) &&
                operation.node.ui === null
            ) {
                continue
            }

            if (operation.op === OPERATIONS.STYLE) {
                let style_names = style_names_by_node.get(operation.node)
                if (style_names === undefined) {
                    style_names = new Set()
                    style_names_by_node.set(operation.node, style_names)
                }
                if (operation.style.expanded.every(({ name }) => style_names!.has(name))) {
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
                if (scroll_nodes.has(operation.node)) {
                    continue
                }
                scroll_nodes.add(operation.node)
            } else if (
                operation.op === OPERATIONS.VIEWPORT ||
                operation.op === OPERATIONS.ROOT_SIZE ||
                operation.op === OPERATIONS.PIXEL_RATIO ||
                operation.op === OPERATIONS.RESOURCE_IMAGE ||
                operation.op === OPERATIONS.RESOURCE_FONT
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
}
