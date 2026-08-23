export const EVENT_TYPES = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']

export default class Events {
    private listeners = new WeakMap()
    private pointers = new Map()

    public on(node, type, listener) {
        const node_listeners = this.listeners.get(node) ?? new Map()
        const event_listeners = node_listeners.get(type) ?? []
        event_listeners.push(listener)
        node_listeners.set(type, event_listeners)
        this.listeners.set(node, node_listeners)
    }

    public dispatch(source_event, event_data, hit_target) {
        const pointer_id = source_event.pointerId
        const pointer = this.pointers.get(pointer_id)
        let target = hit_target

        if (source_event.type === 'pointerdown') {
            if (target === null) {
                return
            }
            this.pointers.set(pointer_id, { target, event_data })
        } else if (pointer !== undefined) {
            target = pointer.target
            if (event_data === null) {
                event_data = pointer.event_data
            } else {
                pointer.event_data = event_data
            }
        } else if (source_event.type === 'pointerup' || source_event.type === 'pointercancel') {
            return
        }

        if (target !== null && event_data !== null) {
            this.dispatchAt(source_event, event_data, target)
        }

        if (source_event.type === 'pointerup' || source_event.type === 'pointercancel') {
            this.pointers.delete(pointer_id)
        }
    }

    public destroyNode(node) {
        this.listeners.delete(node)

        for (const [pointer_id, pointer] of this.pointers) {
            if (pointer.target === node) {
                this.pointers.delete(pointer_id)
            }
        }
    }

    public destroy() {
        this.listeners = new WeakMap()
        this.pointers.clear()
    }

    private dispatchAt(source_event, event_data, target) {
        const event = {
            type: source_event.type,
            ...event_data,
            target,
            current_target: target,
            source_event,
        }
        const path = []
        let current_target = target

        while (current_target !== null) {
            path.push(current_target)
            current_target = current_target.parent
        }

        for (const node of path) {
            event.current_target = node
            const listeners = this.listeners.get(node)?.get(source_event.type) ?? []

            for (const listener of listeners) {
                listener(event)
            }
        }
    }
}
