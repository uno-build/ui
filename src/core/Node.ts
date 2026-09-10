import type UI from './UI'
import type { EventSource, EventPayload, UIEventMap } from '../events/types'
import type { NodeLayout, StyleName, ResolvedStyle, StyleUpdate } from '../style/types'

import { resolveStyle, validateStyle } from '#js/style/index'
import { EVENT } from '#js/events/constants'
import { OPERATIONS } from './constants'

export default class Node<TElement = unknown> {
    declare id: number
    ui: UI | null
    element: TElement | null = null
    parent: Node<TElement> | null = null
    children: Node<TElement>[] = []
    path: number[] = []
    layout: NodeLayout = {}
    text_content: string | undefined = undefined
    order = 0
    scroll_top = 0
    scroll_left = 0
    scrollHeight = 0
    scrollWidth = 0
    clientHeight = 0
    clientWidth = 0
    scrolling = false
    styles: Partial<Record<StyleName | (string & {}), ResolvedStyle>> = {}
    private styles_declared: Partial<Record<string, StyleUpdate>> = {}
    private listeners = new Map<string, { listeners: Set<(event: any) => void>, processEvent: (event: any) => void }>()

    constructor({ id, ui }: { id: number, ui: UI }) {
        this.id = id
        this.ui = ui
    }

    add(child: Node, before_node: Node | null = null) {
        if (this.ui === null) {
            return
        }

        if (this.isTextNode()) {
            throw new Error('Nodes with text cannot have children')
        }

        this.ui.addChild(this, child, before_node)
    }

    remove(child: Node) {
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

    focus(source_event: EventSource | null = null) {
        if (this.ui !== null) {
            this.ui.events_source.emit(EVENT.FOCUS.name, {
                source_event,
                event_data: null,
                node: this,
            })
        }
    }

    blur(source_event: EventSource | null = null) {
        if (this.ui !== null) {
            this.ui.events_source.emit(EVENT.BLUR.name, {
                source_event,
                event_data: null,
                node: this,
            })
        }
    }

    on<TName extends string>(type: TName, listener: (event: EventPayload<TName>) => void) {
        if (this.ui === null) {
            return
        }

        let node_event = this.listeners.get(type)

        if (node_event === undefined) {
            const processEvent = (event: any) => this.processEvent(type, event)
            node_event = {
                listeners: new Set(),
                processEvent,
            }
            this.listeners.set(type, node_event)
            this.ui.events.on(type, processEvent)
        }

        node_event.listeners.add(listener)
    }

    off<TName extends string>(type: TName, listener: (event: EventPayload<TName>) => void) {
        if (this.ui === null) {
            return
        }

        const node_event = this.listeners.get(type)

        if (node_event !== undefined) {
            node_event.listeners.delete(listener)

            if (node_event.listeners.size === 0) {
                this.ui.events.off(type, node_event.processEvent)
                this.listeners.delete(type)
            }
        }
    }

    destroyEvents() {
        for (const [type, node_event] of this.listeners) {
            this.ui!.events.off(type, node_event.processEvent)
        }

        this.listeners.clear()
    }

    private processEvent(type: string, event: UIEventMap[keyof UIEventMap]) {
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
        let current_target: Node | null = event.target

        while (current_target !== null) {
            propagated_event.current_target = current_target
            current_target.dispatchListeners(type, propagated_event)

            if (propagation_stopped) {
                break
            }

            current_target = current_target.parent
        }
    }

    private isEventDispatcher(type: string, target: Node) {
        let current_target: Node | null = target

        while (current_target !== null) {
            if (current_target.listeners.get(type)?.listeners.size! > 0) {
                return current_target === this
            }

            current_target = current_target.parent
        }

        return false
    }

    private dispatchListeners(type: string, event: EventPayload<string>) {
        const listeners = this.listeners.get(type)?.listeners

        if (listeners !== undefined) {
            listeners.forEach((listener) => listener(event))
        }
    }

    style(name: StyleName | (string & {}), value: string) {
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
            const resolved_style: StyleUpdate = resolveStyle(normalized_name, value)
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

    text(value: string) {
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
            this.ui.renderer!.invalidateTextNode(this)
            this.ui.operations.add({ op: OPERATIONS.TEXT, node: this, value })
            return
        }

        this.text_content = value
        this.ui.renderer!.initializeTextNode(this)
        this.ui.operations.add({ op: OPERATIONS.TEXT, node: this, value })
    }

    isTextNode() {
        return this.text_content !== undefined
    }

    hasTextContent() {
        return this.isTextNode() && this.text_content!.length > 0
    }

    get scrollTop() {
        return this.scroll_top
    }

    set scrollTop(value: number) {
        if (this.ui !== null && this.scroll_top !== value) {
            this.scroll_top = value
            this.ui.operations.add({ op: OPERATIONS.SCROLL, node: this })
        }
    }

    get scrollLeft() {
        return this.scroll_left
    }

    set scrollLeft(value: number) {
        if (this.ui !== null && this.scroll_left !== value) {
            this.scroll_left = value
            this.ui.operations.add({ op: OPERATIONS.SCROLL, node: this })
        }
    }
}
