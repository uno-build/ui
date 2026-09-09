// @ts-check

import { EVENT } from './constants'

/**
 * @param {any} options
 */
export function defineFocus({ ui }) {
    /** @type {any} */
    let focused_node = null

    const emit = /** @param {any} type @param {any} target @param {any} related_target @param {any} source_event */ (type, target, related_target, source_event) => {
        ui.events.emit(type, {
            source_event,
            event_data: {},
            target,
            related_target,
        })
    }

    const processFocus = /** @param {any} options */ ({ source_event, node }) => {
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

    const processBlur = /** @param {any} options */ ({ source_event, node }) => {
        if (node !== focused_node) {
            return
        }

        focused_node = null
        emit(EVENT.BLUR.name, node, null, source_event)
    }

    const processPointerDown = /** @param {any} options */ ({ source_event, target }) => {
        processFocus({ source_event, node: target })
    }

    const remove_listeners = [
        ui.events_source.on(EVENT.FOCUS.name, processFocus),
        ui.events_source.on(EVENT.BLUR.name, processBlur),
        ui.events.on(EVENT.POINTERDOWN.name, processPointerDown),
    ]

    return {
        types: [EVENT.FOCUS, EVENT.BLUR],

        /**
         * @param {any} node
         */
        destroyNode(node) {
            if (focused_node === node) {
                focused_node = null
            }
        },

        destroy() {
            remove_listeners.forEach(/** @param {any} remove_listener */ (remove_listener) => remove_listener())
            focused_node = null
        },
    }
}
