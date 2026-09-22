import type UI from '../core/UI'
import type Node from '../core/Node'
import type { EventSource, UIEventMap } from './types'

import { CORE_EVENT } from '../core/constants'
import { EVENT } from './constants'

export function defineFocus({ ui }: { ui: UI }) {
    let focused_node: Node | null = null

    const emit = (type: 'focus' | 'blur', target: Node, related_target: Node | null, source_event: EventSource | null) => {
        ui.events.emit(type, {
            source_event,
            event_data: {},
            target,
            related_target,
        })
    }

    const processFocus = ({ source_event, node }: { source_event: EventSource | null, node: Node }) => {
        if (node === focused_node) {
            return
        }

        const previous_node = focused_node
        focused_node = node

        if (previous_node !== null) {
            emit(EVENT.BLUR.name, previous_node, node, source_event)
        }

        emit(EVENT.FOCUS.name, node, previous_node, source_event)
    }

    const processBlur = ({ source_event, node }: { source_event: EventSource | null, node: Node }) => {
        if (node !== focused_node) {
            return
        }

        focused_node = null
        emit(EVENT.BLUR.name, node, null, source_event)
    }

    const processPointerDown = ({ source_event, target }: UIEventMap['pointerdown']) => {
        processFocus({ source_event, node: target })
    }

    const remove_listeners = [
        ui.events_source.on(EVENT.FOCUS.name, processFocus),
        ui.events_source.on(EVENT.BLUR.name, processBlur),
        ui.events.on(EVENT.POINTERDOWN.name, processPointerDown),
        ui.events_source.on(CORE_EVENT.NODE_DESTROY, ({ node }) => {
            if (focused_node === node) {
                focused_node = null
            }
        }),
    ]

    return {
        types: [EVENT.FOCUS, EVENT.BLUR],

        destroy() {
            remove_listeners.forEach((removeListener) => removeListener())
            focused_node = null
        },
    }
}
