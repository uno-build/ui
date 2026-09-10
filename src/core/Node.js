import { resolveStyle, validateStyle } from '../style'
import { EVENT } from '../events/constants'
import { OPERATIONS } from './constants'

/** @template [TElement=unknown] */
export default class Node {
    /** @type {import('./UI').default | null} */
    ui
    /** @type {TElement | null} */
    element = null
    /** @type {Node<TElement> | null} */
    parent = null
    /** @type {Node<TElement>[]} */
    children = []
    /** @type {number[]} */
    path = []
    /** @type {import('../style/types').NodeLayout} */
    layout = {}
    /** @type {string | undefined} */
    text_content = undefined
    order = 0
    scroll_top = 0
    scroll_left = 0
    scrollHeight = 0
    scrollWidth = 0
    clientHeight = 0
    clientWidth = 0
    scrolling = false
    /** @type {Partial<Record<import('../style/types').StyleName, import('../style/types').ResolvedStyle>>} */
    styles = {}
    /** @private */
    styles_declared = {}
    /** @private */
    listeners = new Map()

    /** @param {{ id: number, ui: import('./UI').default }} options */
    constructor({ id, ui }) {
        this.id = id
        this.ui = ui
    }

    /**
     * @param {Node} child
     * @param {Node | null} [before_node]
     */
    add(child, before_node = null) {
        if (this.ui === null) {
            return
        }

        if (this.isTextNode()) {
            throw new Error('Nodes with text cannot have children')
        }

        this.ui.addChild(this, child, before_node)
    }

    /** @param {Node} child */
    remove(child) {
        if (this.ui === null) {
            return
        }

        if (child.parent !== this) {
            throw new Error('child not found')
        }

        child.destroy()
    }

    detach() {
        this.ui?.detachNode(this)
    }

    destroy() {
        this.ui?.destroyNode(this)
    }

    /** @param {import('../events/types').EventSource | null} [source_event] */
    focus(source_event = null) {
        if (this.ui !== null) {
            this.ui.events_source.emit(EVENT.FOCUS.name, {
                source_event,
                event_data: null,
                node: this,
            })
        }
    }

    /** @param {import('../events/types').EventSource | null} [source_event] */
    blur(source_event = null) {
        if (this.ui !== null) {
            this.ui.events_source.emit(EVENT.BLUR.name, {
                source_event,
                event_data: null,
                node: this,
            })
        }
    }

    /**
     * @template {string} TName
     * @param {TName} type
     * @param {(event: import('../events/types').EventPayload<TName>) => void} listener
     */
    on(type, listener) {
        if (this.ui === null) {
            return
        }

        let node_event = this.listeners.get(type)

        if (node_event === undefined) {
            const process_event = (event) => this.processEvent(type, event)
            node_event = {
                listeners: new Set(),
                process_event,
            }
            this.listeners.set(type, node_event)
            this.ui.events.on(type, process_event)
        }

        node_event.listeners.add(listener)
    }

    /**
     * @template {string} TName
     * @param {TName} type
     * @param {(event: import('../events/types').EventPayload<TName>) => void} listener
     */
    off(type, listener) {
        if (this.ui === null) {
            return
        }

        const node_event = this.listeners.get(type)

        if (node_event !== undefined) {
            node_event.listeners.delete(listener)

            if (node_event.listeners.size === 0) {
                this.ui.events.off(type, node_event.process_event)
                this.listeners.delete(type)
            }
        }
    }

    destroyEvents() {
        for (const [type, node_event] of this.listeners) {
            this.ui.events.off(type, node_event.process_event)
        }

        this.listeners.clear()
    }

    /** @private */
    processEvent(type, event) {
        if (!this.isEventDispatcher(type, event.target)) {
            return
        }

        let propagation_stopped = false
        const propagated_event = {
            type,
            ...event.event_data,
            source_event: event.source_event,
            target: event.target,
            current_target: event.target,
            ...(event.related_target === undefined ? {} : { related_target: event.related_target }),
            stopPropagation: () => {
                propagation_stopped = true
            },
        }
        let current_target = event.target

        while (current_target !== null) {
            propagated_event.current_target = current_target
            current_target.dispatchListeners(type, propagated_event)

            if (propagation_stopped) {
                break
            }

            current_target = current_target.parent
        }
    }

    /** @private */
    isEventDispatcher(type, target) {
        let current_target = target

        while (current_target !== null) {
            if (current_target.listeners.get(type)?.listeners.size > 0) {
                return current_target === this
            }

            current_target = current_target.parent
        }

        return false
    }

    /** @private */
    dispatchListeners(type, event) {
        const listeners = this.listeners.get(type)?.listeners

        if (listeners !== undefined) {
            listeners.forEach((listener) => listener(event))
        }
    }

    /** @param {import('../style/types').StyleName | (string & {})} name @param {string} value */
    style(name, value) {
        if (this.ui === null) {
            return
        }

        const normalized_name = validateStyle(name, value)
        const previous_resolved = this.styles_declared[normalized_name]

        if (
            previous_resolved === undefined ||
            previous_resolved.value !== value ||
            previous_resolved.expanded.some((style) => this.styles[style.name]?.value !== style.value)
        ) {
            const resolved_style = resolveStyle(normalized_name, value)
            const has_changes = resolved_style.expanded.some((style) => this.styles[style.name]?.value !== style.value)

            this.styles_declared[normalized_name] = resolved_style

            if (has_changes) {
                for (const style of resolved_style.expanded) {
                    this.styles[style.name] = {
                        value: style.value,
                        parsed: style.parsed,
                    }
                }
                this.ui.operations.add({ op: OPERATIONS.STYLE, node: this, style: resolved_style })
            }
        }
    }

    /**
     * @param {string} value
     */
    text(value) {
        if (this.ui === null) {
            return
        }

        if (this.children.length > 0) {
            throw new Error('Nodes with text cannot have children')
        }

        if (this.isTextNode()) {
            if (this.text_content === value) {
                return
            }

            this.text_content = value
            this.ui.renderer.invalidateTextNode(this)
            this.ui.operations.add({ op: OPERATIONS.TEXT, node: this, value })
            return
        }

        this.text_content = value
        this.ui.renderer.initializeTextNode(this)
        this.ui.operations.add({ op: OPERATIONS.TEXT, node: this, value })
    }

    isTextNode() {
        return this.text_content !== undefined
    }

    hasTextContent() {
        return this.isTextNode() && this.text_content.length > 0
    }

    get scrollTop() {
        return this.scroll_top
    }

    set scrollTop(value) {
        if (this.ui !== null && this.scroll_top !== value) {
            this.scroll_top = value
            this.ui.operations.add({ op: OPERATIONS.SCROLL, node: this })
        }
    }

    get scrollLeft() {
        return this.scroll_left
    }

    set scrollLeft(value) {
        if (this.ui !== null && this.scroll_left !== value) {
            this.scroll_left = value
            this.ui.operations.add({ op: OPERATIONS.SCROLL, node: this })
        }
    }
}
