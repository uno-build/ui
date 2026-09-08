import { OPERATIONS } from './constants'
import { isPaintStyle, STYLE } from '../style'

export default class Operations {
    public items = []
    public layout_nodes = new Set()
    public scroll_nodes = new Set()
    private pending = []
    private captured = new Set()
    private update_order = false
    private check_layout = false
    private update_layout = false
    private update_scroll_metrics = false
    private context_changed = false

    public add(operation) {
        this.pending.push(operation)
    }

    public capture(getPendingOperations) {
        this.reset()
        this.captured = new Set(this.pending)
        const operations = [...this.captured, ...getPendingOperations()]
        this.items = this.compact(operations)

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
            } else if (operation.op === OPERATIONS.RESOURCES && operation.font) {
                this.check_layout = true
            }
        }

        return operations.length > 0
    }

    public consume() {
        this.pending = this.pending.filter((operation) => !this.captured.has(operation))
        this.captured.clear()
    }

    public discardNode(node) {
        this.pending = this.pending.filter(
            (operation) =>
                operation.node !== node || operation.op === OPERATIONS.ADD || operation.op === OPERATIONS.REMOVE,
        )
    }

    public clear() {
        this.pending.length = 0
        this.captured.clear()
        this.reset()
    }

    public needUpdateOrder() {
        return this.update_order
    }

    public needCheckLayout() {
        return this.check_layout
    }

    public setUpdateLayout(update_layout) {
        this.update_layout = update_layout
    }

    public needUpdateLayout() {
        return this.update_layout
    }

    public needUpdateScrollMetrics() {
        return this.update_scroll_metrics
    }

    public hasContextChanges() {
        return this.context_changed
    }

    private reset() {
        this.items = []
        this.layout_nodes.clear()
        this.scroll_nodes.clear()
        this.update_order = false
        this.check_layout = false
        this.update_layout = false
        this.update_scroll_metrics = false
        this.context_changed = false
    }

    private compact(operations) {
        const compacted_operations = []
        const style_names_by_node = new Map()
        const text_nodes = new Set()
        const scroll_directions_by_node = new Map()
        const global_operations = new Set()
        let resources_operation

        for (let i = operations.length - 1; i >= 0; i--) {
            const operation = operations[i]

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
                operation.op === OPERATIONS.ROOT_SIZE ||
                operation.op === OPERATIONS.PIXEL_RATIO
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
