export default class EventsDom {
    private nodes = new Map()
    private event_nodes = new WeakMap()
    private dispatched_events = new WeakMap()
    private root_node = null

    public createNode(node, element) {
        this.nodes.set(node, {
            element,
            listeners: new Map(),
        })
        this.event_nodes.set(element, node)

        if (node.id === 0) {
            this.root_node = node
        }
    }

    public on(node, type, listener) {
        const node_events = this.nodes.get(node)
        const event_listeners = node_events.listeners.get(type) ?? new Map()

        if (!event_listeners.has(listener)) {
            const native_listener = (source_event) => {
                const event = this.getEvent(source_event)
                event.current_target = node
                listener(event)
            }

            event_listeners.set(listener, native_listener)
            node_events.listeners.set(type, event_listeners)
            node_events.element.addEventListener(type, native_listener)
        }
    }

    public off(node, type, listener) {
        const node_events = this.nodes.get(node)
        const event_listeners = node_events?.listeners.get(type)
        const native_listener = event_listeners?.get(listener)

        if (native_listener !== undefined) {
            node_events.element.removeEventListener(type, native_listener)
            event_listeners.delete(listener)

            if (event_listeners.size === 0) {
                node_events.listeners.delete(type)
            }
        }
    }

    public destroyNode(node) {
        const node_events = this.nodes.get(node)

        if (node_events !== undefined) {
            for (const [type, event_listeners] of node_events.listeners) {
                for (const native_listener of event_listeners.values()) {
                    node_events.element.removeEventListener(type, native_listener)
                }
            }

            this.nodes.delete(node)
            this.event_nodes.delete(node_events.element)
        }

        if (node === this.root_node) {
            this.root_node = null
        }
    }

    public destroy() {
        for (const node of [...this.nodes.keys()]) {
            this.destroyNode(node)
        }

        this.dispatched_events = new WeakMap()
    }

    private getEvent(source_event) {
        let event = this.dispatched_events.get(source_event)

        if (event === undefined) {
            const root_events = this.nodes.get(this.root_node)
            const root_rect = root_events.element.getBoundingClientRect()

            event = {
                type: source_event.type,
                x: ((source_event.clientX - root_rect.left) / root_rect.width) * this.root_node.layout.width,
                y: ((source_event.clientY - root_rect.top) / root_rect.height) * this.root_node.layout.height,
                target: this.getNode(source_event.target),
                current_target: null,
                ...(source_event.type === 'pointerover' || source_event.type === 'pointerout'
                    ? { related_target: this.getNode(source_event.relatedTarget) }
                    : {}),
                source_event,
            }
            this.dispatched_events.set(source_event, event)
        }

        return event
    }

    private getNode(event_target) {
        let element = event_target

        while (element != null) {
            const node = this.event_nodes.get(element)

            if (node !== undefined) {
                return node
            }

            element = element.parentNode
        }

        return null
    }
}
