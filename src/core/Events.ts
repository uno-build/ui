import { POINTER_EVENTS } from '../style/consts'

export const EVENT_TYPES = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']

export default class Events {
    private listeners = new WeakMap()
    private pointers = new Map()
    private hovered_pointers = new Map()

    public on(node, type, listener) {
        const node_listeners = this.listeners.get(node) ?? new Map()
        const event_listeners = node_listeners.get(type) ?? []
        event_listeners.push(listener)
        node_listeners.set(type, event_listeners)
        this.listeners.set(node, node_listeners)
    }

    public off(node, type, listener) {
        const node_listeners = this.listeners.get(node)
        const event_listeners = node_listeners?.get(type)
        const listener_index = event_listeners?.indexOf(listener) ?? -1

        if (listener_index !== -1) {
            event_listeners.splice(listener_index, 1)
            if (event_listeners.length === 0) {
                node_listeners.delete(type)
            }
            if (node_listeners.size === 0) {
                this.listeners.delete(node)
            }
        }
    }

    public dispatch(source_event, event_data, hit_targets) {
        const pointer_id = source_event.pointerId
        const pointer = this.pointers.get(pointer_id)
        const ends_hover =
            source_event.type === 'pointercancel' ||
            (source_event.type === 'pointerup' && source_event.pointerType === 'touch')
        const hit_target = this.getHitTarget(hit_targets)
        let target = hit_target

        if (source_event.type !== 'pointercancel') {
            this.updateHoveredPointer(source_event, event_data, hit_target)
        }

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
            if (ends_hover) {
                this.endHoveredPointer(source_event, event_data)
            }
            return
        }

        if (target !== null && event_data !== null) {
            this.dispatchAt(source_event.type, source_event, event_data, target)
        }

        if (source_event.type === 'pointerup' || source_event.type === 'pointercancel') {
            this.pointers.delete(pointer_id)

            if (ends_hover) {
                this.endHoveredPointer(source_event, event_data)
            }
        }
    }

    public destroyNode(node) {
        this.listeners.delete(node)

        for (const [pointer_id, pointer] of this.pointers) {
            if (pointer.target === node) {
                this.pointers.delete(pointer_id)
            }
        }

        for (const [pointer_id, pointer] of this.hovered_pointers) {
            if (pointer.target === node) {
                this.hovered_pointers.delete(pointer_id)
            }
        }
    }

    public destroy() {
        this.listeners = new WeakMap()
        this.pointers.clear()
        this.hovered_pointers.clear()
    }

    private getHitTarget(hit_targets) {
        for (const target of hit_targets) {
            const pointer_events = target.styles?.pointerEvents?.parsed.enum ?? POINTER_EVENTS.all

            if (pointer_events === POINTER_EVENTS.all) {
                return target
            }
        }

        return null
    }

    private updateHoveredPointer(source_event, event_data, target) {
        const pointer_id = source_event.pointerId
        const pointer = this.hovered_pointers.get(pointer_id)
        const previous_target = pointer?.target ?? null

        if (previous_target === target) {
            if (pointer !== undefined && event_data !== null) {
                pointer.event_data = event_data
            }
            return
        }

        if (previous_target !== null) {
            this.dispatchAt(
                'pointerout',
                source_event,
                event_data ?? pointer.event_data,
                previous_target,
                target,
            )
        }

        if (target === null) {
            this.hovered_pointers.delete(pointer_id)
        } else {
            this.hovered_pointers.set(pointer_id, { target, event_data })
            this.dispatchAt('pointerover', source_event, event_data, target, previous_target)
        }
    }

    private endHoveredPointer(source_event, event_data) {
        const pointer_id = source_event.pointerId
        const pointer = this.hovered_pointers.get(pointer_id)

        if (pointer !== undefined) {
            this.hovered_pointers.delete(pointer_id)
            this.dispatchAt(
                'pointerout',
                source_event,
                event_data ?? pointer.event_data,
                pointer.target,
                null,
            )
        }
    }

    private dispatchAt(type, source_event, event_data, target, related_target) {
        const event = {
            type,
            ...event_data,
            target,
            current_target: target,
            ...(related_target === undefined ? {} : { related_target }),
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
            const listeners = this.listeners.get(node)?.get(type) ?? []

            for (const listener of listeners) {
                listener(event)
            }
        }
    }
}
