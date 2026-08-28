import { EVENT } from './const'
import { ROOT_SIZE } from '../style/consts'

const DELTA_MODE_LINE = 1

export function defineWheel({ ui }) {
    const removeListener = ui.events.on(EVENT.WHEEL.name, ({ raw, source_event, event_data, node }) => {
        if (!raw || node === null) {
            return
        }

        ui.events.emit(EVENT.WHEEL.name, {
            raw: false,
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
        destroy() {
            removeListener()
        },
    }
}

export function normalizeDelta(delta, delta_mode) {
    return delta_mode === DELTA_MODE_LINE ? delta * ROOT_SIZE : delta
}
