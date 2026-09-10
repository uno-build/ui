import type UI from '../core/UI'
import type { SourceEvent, WheelSource, EventCoordinates } from './types'

import { EVENT } from './constants'
import { ROOT_SIZE } from '../style/constants'

const DELTA_MODE_LINE = 1

export function defineWheel({ ui }: { ui: UI }) {
    const removeListener = ui.events_source.on(EVENT.WHEEL.name, ({ source_event, event_data, node }: SourceEvent<WheelSource, EventCoordinates>) => {
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

export function normalizeDelta(delta: number, delta_mode: number) {
    return delta_mode === DELTA_MODE_LINE ? delta * ROOT_SIZE : delta
}
