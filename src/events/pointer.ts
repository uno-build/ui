import Events from '../core/Events'
import { EVENT } from './const'

export const POINTER_DOWN = Events.defineEvent(EVENT.POINTER_DOWN, pointerEvents)
export const POINTER_MOVE = Events.defineEvent(EVENT.POINTER_MOVE, pointerEvents)
export const POINTER_UP = Events.defineEvent(EVENT.POINTER_UP, pointerEvents)
export const POINTER_CANCEL = Events.defineEvent(EVENT.POINTER_CANCEL, pointerEvents)
export const POINTER_OVER = Events.defineEvent(EVENT.POINTER_OVER, pointerOverEvents)
export const POINTER_OUT = Events.defineEvent(EVENT.POINTER_OUT, pointerOverEvents)

function pointerEvents({ emit }) {
    const pointers = new Map()

    const normalize = ({ source_event, event_data, hit_target }) => {
        const pointer_id = source_event.pointerId
        const pointer = pointers.get(pointer_id)
        let target = hit_target

        if (source_event.type === EVENT.POINTER_DOWN.name) {
            if (target === null) {
                return
            }
            pointers.set(pointer_id, { target, event_data })
        } else if (pointer !== undefined) {
            target = pointer.target
            if (event_data === null) {
                event_data = pointer.event_data
            } else {
                pointer.event_data = event_data
            }
        } else if (source_event.type === EVENT.POINTER_UP.name || source_event.type === EVENT.POINTER_CANCEL.name) {
            return
        }

        if (target !== null && event_data !== null) {
            emit(source_event.type, {
                source_event,
                event_data,
                target,
            })
        }

        if (source_event.type === EVENT.POINTER_UP.name || source_event.type === EVENT.POINTER_CANCEL.name) {
            pointers.delete(pointer_id)
        }
    }

    return {
        main: {
            [EVENT.POINTER_DOWN.name]: normalize,
            [EVENT.POINTER_MOVE.name]: normalize,
            [EVENT.POINTER_UP.name]: normalize,
            [EVENT.POINTER_CANCEL.name]: normalize,
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
}

function pointerOverEvents({ emit }) {
    const pointers = new Map()

    const update = ({ source_event, event_data, hit_target }) => {
        const pointer_id = source_event.pointerId
        const pointer = pointers.get(pointer_id)
        const previous_target = pointer?.target ?? null

        if (previous_target === hit_target) {
            if (pointer !== undefined && event_data !== null) {
                pointer.event_data = event_data
            }
            return
        }

        if (previous_target !== null) {
            emit(EVENT.POINTER_OUT.name, {
                source_event,
                event_data: event_data ?? pointer.event_data,
                target: previous_target,
                related_target: hit_target,
            })
        }

        if (hit_target === null) {
            pointers.delete(pointer_id)
        } else {
            pointers.set(pointer_id, { target: hit_target, event_data })
            emit(EVENT.POINTER_OVER.name, {
                source_event,
                event_data,
                target: hit_target,
                related_target: previous_target,
            })
        }
    }

    const end = ({ source_event, event_data }) => {
        const pointer_id = source_event.pointerId
        const pointer = pointers.get(pointer_id)

        if (pointer !== undefined) {
            pointers.delete(pointer_id)
            emit(EVENT.POINTER_OUT.name, {
                source_event,
                event_data: event_data ?? pointer.event_data,
                target: pointer.target,
                related_target: null,
            })
        }
    }

    return {
        before: {
            [EVENT.POINTER_DOWN.name]: update,
            [EVENT.POINTER_MOVE.name]: update,
            [EVENT.POINTER_UP.name]: update,
        },
        after: {
            [EVENT.POINTER_UP.name]: (context) => {
                if (context.source_event.pointerType === 'touch') {
                    end(context)
                }
            },
            [EVENT.POINTER_CANCEL.name]: end,
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
}
