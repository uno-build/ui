import type UI from '../core/UI'
import type Node from '../core/Node'
import type { SourceEvent, PointerSource, EventCoordinates } from './types'

import { CORE_EVENT } from '../core/constants'
import { EVENT } from './constants'

export function defineClick({ ui }: { ui: UI }) {
    const pointers = new Map<number, { target: Node, event_data: EventCoordinates | null }>()

    const processPointerDown = ({ source_event, event_data, node }: SourceEvent<PointerSource>) => {
        if (node === null) {
            return
        }

        clearScrollingNodes(node)
        pointers.set(source_event.pointerId, {
            target: node,
            event_data,
        })
    }

    const processPointerCancel = ({ source_event }: SourceEvent<PointerSource>) => {
        pointers.delete(source_event.pointerId)
    }

    const processPointerUp = ({ source_event, event_data, node }: SourceEvent<PointerSource>) => {
        const pointer = pointers.get(source_event.pointerId)
        pointers.delete(source_event.pointerId)

        if (pointer?.target === node && !isScrollingNode(node)) {
            ui.events.emit(EVENT.CLICK.name, {
                source_event,
                event_data: (event_data ?? pointer.event_data)!,
                target: node,
            })
        }
    }

    const remove_listeners = [
        ui.events_source.on(EVENT.POINTERDOWN.name, processPointerDown),
        ui.events_source.on(EVENT.POINTERCANCEL.name, processPointerCancel),
        ui.events_source.on(EVENT.POINTERUP.name, processPointerUp),
        ui.events_source.on(CORE_EVENT.NODE_DESTROY, ({ node }) => {
            for (const [pointer_id, pointer] of pointers) {
                if (pointer.target === node) {
                    pointers.delete(pointer_id)
                }
            }
        }),
    ]

    return {
        types: [EVENT.CLICK],

        destroy() {
            remove_listeners.forEach((removeListener) => removeListener())
            pointers.clear()
        },
    }
}

function clearScrollingNodes(node: Node) {
    let current_node: Node | null = node

    while (current_node !== null) {
        current_node.scrolling = false
        current_node = current_node.parent
    }
}

function isScrollingNode(node: Node) {
    let current_node: Node | null = node

    while (current_node !== null) {
        if (current_node.scrolling) {
            return true
        }
        current_node = current_node.parent
    }

    return false
}
