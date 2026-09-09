// @ts-check

import { EVENT } from './constants'

/**
 * @param {any} options
 */
export function defineClick({ ui }) {
    const pointers = new Map()

    const processPointerDown = /** @param {any} options */ ({ source_event, event_data, node }) => {
        if (node === null) {
            return
        }

        clearScrollingNodes(node)
        pointers.set(source_event.pointerId, {
            target: node,
            event_data,
        })
    }

    const processPointerCancel = /** @param {any} options */ ({ source_event }) => {
        pointers.delete(source_event.pointerId)
    }

    const processPointerUp = /** @param {any} options */ ({ source_event, event_data, node }) => {
        const pointer = pointers.get(source_event.pointerId)
        pointers.delete(source_event.pointerId)

        if (pointer?.target === node && !isScrollingNode(node)) {
            ui.events.emit(EVENT.CLICK.name, {
                source_event,
                event_data: event_data ?? pointer.event_data,
                target: node,
            })
        }
    }

    const remove_listeners = [
        ui.events_source.on(EVENT.POINTERDOWN.name, processPointerDown),
        ui.events_source.on(EVENT.POINTERCANCEL.name, processPointerCancel),
        ui.events_source.on(EVENT.POINTERUP.name, processPointerUp),
    ]

    return {
        types: [EVENT.CLICK],
        /**
         * @param {any} node
         */
        destroyNode(node) {
            for (const [pointer_id, pointer] of pointers) {
                if (pointer.target === node) {
                    pointers.delete(pointer_id)
                }
            }
        },

        destroy() {
            remove_listeners.forEach(/** @param {any} removeListener */ (removeListener) => removeListener())
            pointers.clear()
        },
    }
}

/**
 * @param {any} node
 */
function clearScrollingNodes(node) {
    let current_node = node

    while (current_node !== null) {
        current_node.scrolling = false
        current_node = current_node.parent
    }
}

/**
 * @param {any} node
 */
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
