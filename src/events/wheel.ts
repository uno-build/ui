import Events from '../core/Events'
import { EVENT } from './const'
import { ROOT_SIZE } from '../style/consts'

const DELTA_MODE_LINE = 1

export const WHEEL = Events.defineEvent(EVENT.WHEEL, ({ emit }) => ({
    main: {
        [EVENT.WHEEL.name]: ({ source_event, event_data, hit_target }) => {
            if (hit_target === null) {
                return
            }

            emit(EVENT.WHEEL.name, {
                source_event,
                event_data: {
                    ...event_data,
                    delta_x: normalizeDelta(source_event.deltaX, source_event.deltaMode),
                    delta_y: normalizeDelta(source_event.deltaY, source_event.deltaMode),
                },
                target: hit_target,
            })
        },
    },
}))

function normalizeDelta(delta, delta_mode) {
    return delta_mode === DELTA_MODE_LINE ? delta * ROOT_SIZE : delta
}
