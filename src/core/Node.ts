import { resolveStyle, validateStyle } from '../style'
import { EVENT } from '../events/constants'
import { OPERATIONS } from './constants'

export default class Node {
    public ui
    public element = null
    public parent = null
    public children = []
    public path = []
    public layout = {}
    public text_content = undefined
    public order = 0
    public scroll_top = 0
    public scroll_left = 0
    public scrollHeight = 0
    public scrollWidth = 0
    public clientHeight = 0
    public clientWidth = 0
    public scrolling = false
    public styles = {}
    private styles_declared = {}
    private listeners = new Map()

    constructor({ id, ui }) {
        this.id = id
        this.ui = ui
    }

    public add(child, before_node = null) {
        if (this.ui === null) {
            return
        }

        if (this.isTextNode()) {
            throw new Error('Nodes with text cannot have children')
        }

        this.ui.addChild(this, child, before_node)
    }

    public remove(child) {
        if (this.ui === null) {
            return
        }

        if (child.parent !== this) {
            throw new Error('child not found')
        }

        child.destroy()
    }

    public detach() {
        this.ui?.detachNode(this)
    }

    public destroy() {
        this.ui?.destroyNode(this)
    }

    public focus(source_event = null) {
        if (this.ui !== null) {
            this.ui.events_source.emit(EVENT.FOCUS.name, {
                source_event,
                event_data: null,
                node: this,
            })
        }
    }

    public blur(source_event = null) {
        if (this.ui !== null) {
            this.ui.events_source.emit(EVENT.BLUR.name, {
                source_event,
                event_data: null,
                node: this,
            })
        }
    }

    public on(type, listener) {
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

    public off(type, listener) {
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

    public destroyEvents() {
        for (const [type, node_event] of this.listeners) {
            this.ui.events.off(type, node_event.process_event)
        }

        this.listeners.clear()
    }

    private processEvent(type, event) {
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

    private isEventDispatcher(type, target) {
        let current_target = target

        while (current_target !== null) {
            if (current_target.listeners.get(type)?.listeners.size > 0) {
                return current_target === this
            }

            current_target = current_target.parent
        }

        return false
    }

    private dispatchListeners(type, event) {
        const listeners = this.listeners.get(type)?.listeners

        if (listeners !== undefined) {
            listeners.forEach((listener) => listener(event))
        }
    }

    public style(name, value) {
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

    public text(value: string) {
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

    public isTextNode() {
        return this.text_content !== undefined
    }

    public hasTextContent() {
        return this.isTextNode() && this.text_content.length > 0
    }

    public get scrollTop() {
        return this.scroll_top
    }

    public set scrollTop(value) {
        if (this.ui !== null && this.scroll_top !== value) {
            this.scroll_top = value
            this.ui.operations.add({ op: OPERATIONS.SCROLL, node: this, direction: 'top', value })
        }
    }

    public get scrollLeft() {
        return this.scroll_left
    }

    public set scrollLeft(value) {
        if (this.ui !== null && this.scroll_left !== value) {
            this.scroll_left = value
            this.ui.operations.add({ op: OPERATIONS.SCROLL, node: this, direction: 'left', value })
        }
    }
}
