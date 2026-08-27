import Events from '../core/Events'
import { EVENT } from './const'

export const CLICK = Events.defineEvent(EVENT.CLICK, ({ emit }) => {
    const pointers = new Map()

    return {
        before: {
            [EVENT.POINTER_DOWN.name]: ({ source_event, event_data, hit_target }) => {
                if (hit_target !== null) {
                    clearScrollingNodes(hit_target)
                    pointers.set(source_event.pointerId, {
                        target: hit_target,
                        event_data,
                    })
                }
            },
            [EVENT.POINTER_CANCEL.name]: ({ source_event }) => {
                pointers.delete(source_event.pointerId)
            },
        },
        after: {
            [EVENT.POINTER_UP.name]: ({ source_event, event_data, hit_target }) => {
                const pointer = pointers.get(source_event.pointerId)
                pointers.delete(source_event.pointerId)

                if (pointer?.target === hit_target && !isScrollingNode(hit_target)) {
                    emit(EVENT.CLICK.name, {
                        source_event,
                        event_data: event_data ?? pointer.event_data,
                        target: hit_target,
                    })
                }
            },
        },
        destroyNode(node) {
            for (const [pointer_id, pointer] of pointers) {
                if (pointer.target === node) {
                    pointers.delete(pointer_id)
                }
            }
        },
        destroy() {
            pointers.clear()
        },
    }
})

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
