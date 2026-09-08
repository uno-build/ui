import { EVENT } from './constants'

const POINTER_TYPES = [EVENT.POINTERDOWN.name, EVENT.POINTERMOVE.name, EVENT.POINTERUP.name, EVENT.POINTERCANCEL.name]

export function definePointers({ ui }) {
    const pointers = new Map()
    const hovered_pointers = new Map()

    const normalizePointer = ({ source_event, event_data, node }) => {
        const pointer_id = source_event.pointerId
        const pointer = pointers.get(pointer_id)
        let target = node

        if (source_event.type === EVENT.POINTERDOWN.name) {
            if (target === null) {
                return
            }
            pointers.set(pointer_id, { target, event_data })
        } else if (pointer !== undefined) {
            target = pointer.target
            if (event_data === null) {
                event_data = pointer.event_data
            } else {
                pointer.event_data = event_data
            }
        } else if (source_event.type === EVENT.POINTERUP.name || source_event.type === EVENT.POINTERCANCEL.name) {
            return
        }

        if (target !== null && event_data !== null) {
            ui.events.emit(source_event.type, {
                source_event,
                event_data,
                target,
            })
        }

        if (source_event.type === EVENT.POINTERUP.name || source_event.type === EVENT.POINTERCANCEL.name) {
            pointers.delete(pointer_id)
        }
    }

    const updatePointerOver = ({ source_event, event_data, node }) => {
        const pointer_id = source_event.pointerId
        const pointer = hovered_pointers.get(pointer_id)
        const previous_target = pointer?.target ?? null

        if (previous_target === node) {
            if (pointer !== undefined && event_data !== null) {
                pointer.event_data = event_data
            }
            return
        }

        if (previous_target !== null) {
            ui.events.emit(EVENT.POINTEROUT.name, {
                source_event,
                event_data: event_data ?? pointer.event_data,
                target: previous_target,
                related_target: node,
            })
        }

        if (node === null) {
            hovered_pointers.delete(pointer_id)
        } else {
            hovered_pointers.set(pointer_id, { target: node, event_data })
            ui.events.emit(EVENT.POINTEROVER.name, {
                source_event,
                event_data,
                target: node,
                related_target: previous_target,
            })
        }
    }

    const endPointerOver = ({ source_event, event_data }) => {
        const pointer_id = source_event.pointerId
        const pointer = hovered_pointers.get(pointer_id)

        if (pointer !== undefined) {
            hovered_pointers.delete(pointer_id)
            ui.events.emit(EVENT.POINTEROUT.name, {
                source_event,
                event_data: event_data ?? pointer.event_data,
                target: pointer.target,
                related_target: null,
            })
        }
    }

    const processPointer = (event) => {
        const type = event.source_event.type

        if (type !== EVENT.POINTERCANCEL.name) {
            updatePointerOver(event)
        }

        normalizePointer(event)

        if (
            type === EVENT.POINTERCANCEL.name ||
            (type === EVENT.POINTERUP.name && event.source_event.pointerType === 'touch')
        ) {
            endPointerOver(event)
        }
    }

    const remove_listeners = POINTER_TYPES.map((type) => ui.events_source.on(type, processPointer))

    return {
        types: [
            EVENT.POINTERDOWN,
            EVENT.POINTERMOVE,
            EVENT.POINTERUP,
            EVENT.POINTERCANCEL,
            EVENT.POINTEROVER,
            EVENT.POINTEROUT,
        ],
        destroyNode(node) {
            for (const [pointer_id, pointer] of pointers) {
                if (pointer.target === node) {
                    pointers.delete(pointer_id)
                }
            }

            for (const [pointer_id, pointer] of hovered_pointers) {
                if (pointer.target === node) {
                    hovered_pointers.delete(pointer_id)
                }
            }
        },

        destroy() {
            remove_listeners.forEach((removeListener) => removeListener())
            pointers.clear()
            hovered_pointers.clear()
        },
    }
}
