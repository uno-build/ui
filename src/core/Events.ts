export default class Events {
    public readonly types = new Map()
    private listeners = new WeakMap()
    private event_handlers

    public static defineEvent(type, setup) {
        return { type, setup }
    }

    public constructor({ definitions = [] } = {}) {
        for (const definition of definitions) {
            const type = definition.type
            if (this.types.has(type.name)) {
                throw new Error(`Event type '${type.name}' is already defined.`)
            }
            this.types.set(type.name, type)
        }

        const setups = new Set(definitions.map(({ setup }) => setup))
        this.event_handlers = [...setups].map((setup) =>
            setup({
                emit: (type, { source_event, event_data, target, related_target }) => {
                    this.dispatchAt(type, source_event, event_data, target, related_target)
                },
            }),
        )
    }

    public on(node, type, listener) {
        const node_listeners = this.listeners.get(node) ?? new Map()
        const event_listeners = node_listeners.get(type) ?? []
        if (!event_listeners.some((event_listener) => event_listener.callback === listener)) {
            event_listeners.push({ callback: listener, removed: false })
        }
        node_listeners.set(type, event_listeners)
        this.listeners.set(node, node_listeners)
    }

    public off(node, type, listener) {
        const node_listeners = this.listeners.get(node)
        const event_listeners = node_listeners?.get(type)
        const listener_index =
            event_listeners?.findIndex((event_listener) => event_listener.callback === listener) ?? -1

        if (listener_index !== -1) {
            event_listeners[listener_index].removed = true
            event_listeners.splice(listener_index, 1)
            if (event_listeners.length === 0) {
                node_listeners.delete(type)
            }
            if (node_listeners.size === 0) {
                this.listeners.delete(node)
            }
        }
    }

    public dispatch(source_event, event_data, hit_target) {
        const context = {
            source_event,
            event_data,
            hit_target,
        }

        this.runEvents('before', context)
        this.runEvents('main', context)
        this.runEvents('after', context)
    }

    public destroyNode(node) {
        this.listeners.delete(node)

        for (const event_handler of this.event_handlers) {
            event_handler.destroyNode?.(node)
        }
    }

    public destroy() {
        this.listeners = new WeakMap()

        for (const event_handler of this.event_handlers) {
            event_handler.destroy?.()
        }
    }

    private runEvents(phase, context) {
        for (const event_handler of this.event_handlers) {
            event_handler[phase]?.[context.source_event.type]?.(context)
        }
    }

    private dispatchAt(type, source_event, event_data, target, related_target) {
        let propagation_stopped = false
        const event = {
            type,
            ...event_data,
            target,
            current_target: target,
            ...(related_target === undefined ? {} : { related_target }),
            source_event,
            stopPropagation: () => {
                propagation_stopped = true
            },
        }
        const path = []
        let current_target = target

        while (current_target !== null) {
            path.push(current_target)
            current_target = current_target.parent
        }

        for (const node of path) {
            event.current_target = node
            const event_listeners = [...(this.listeners.get(node)?.get(type) ?? [])]

            for (const event_listener of event_listeners) {
                if (!event_listener.removed) {
                    event_listener.callback(event)
                }
            }

            if (propagation_stopped) {
                break
            }
        }
    }
}
