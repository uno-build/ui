// @ts-check

import { EVENT } from './constants'
import { ROOT_SIZE } from '../style/constants'

const DELTA_MODE_LINE = 1

/**
 * @param {any} options
 */
export function defineWheel({ ui }) {
    const removeListener = ui.events_source.on(EVENT.WHEEL.name, /** @param {any} options */ ({ source_event, event_data, node }) => {
        if (node === null) {
            return
        }

        ui.events.emit(EVENT.WHEEL.name, {
            source_event,
            event_data: {
                ...event_data,
                delta_x: normalizeDelta(source_event.deltaX, source_event.deltaMode),
                delta_y: normalizeDelta(source_event.deltaY, source_event.deltaMode),
            },
            target: node,
        })
    })

    return {
        types: [EVENT.WHEEL],
        destroy() {
            removeListener()
        },
    }
}

/**
 * @param {any} delta
 * @param {any} delta_mode
 */
export function normalizeDelta(delta, delta_mode) {
    return delta_mode === DELTA_MODE_LINE ? delta * ROOT_SIZE : delta
}
