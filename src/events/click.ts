import { EVENT } from './const'

export function defineClick({ ui }) {
    const pointers = new Map()

    const processPointerDown = ({ raw, source_event, event_data, node }) => {
        if (!raw || node === null) {
            return
        }

        clearScrollingNodes(node)
        pointers.set(source_event.pointerId, {
            target: node,
            event_data,
        })
    }

    const processPointerCancel = ({ raw, source_event }) => {
        if (raw) {
            pointers.delete(source_event.pointerId)
        }
    }

    const processPointerUp = ({ raw, source_event, event_data, node }) => {
        if (!raw) {
            return
        }

        const pointer = pointers.get(source_event.pointerId)
        pointers.delete(source_event.pointerId)

        if (pointer?.target === node && !isScrollingNode(node)) {
            ui.events.emit(EVENT.CLICK.name, {
                raw: false,
                source_event,
                event_data: event_data ?? pointer.event_data,
                target: node,
            })
        }
    }

    const remove_listeners = [
        ui.events.on(EVENT.POINTER_DOWN.name, processPointerDown),
        ui.events.on(EVENT.POINTER_CANCEL.name, processPointerCancel),
        ui.events.on(EVENT.POINTER_UP.name, processPointerUp),
    ]

    return {
        types: [EVENT.CLICK],
        destroyNode(node) {
            for (const [pointer_id, pointer] of pointers) {
                if (pointer.target === node) {
                    pointers.delete(pointer_id)
                }
            }
        },

        destroy() {
            remove_listeners.forEach((removeListener) => removeListener())
            pointers.clear()
        },
    }
}

function clearScrollingNodes(node) {
    let current_node = node

    while (current_node !== null) {
        current_node.scrolling = false
        current_node = current_node.parent
    }
}

function isScrollingNode(node) {
    let current_node = node

    while (current_node !== null) {
        if (current_node.scrolling) {
            return true
        }
        current_node = current_node.parent
    }

    return false
}
