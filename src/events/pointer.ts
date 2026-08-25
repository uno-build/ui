import Events, { EVENT } from '../core/Events'

export const POINTER_EVENTS = Events.defineEvent(
    [EVENT.POINTER_DOWN, EVENT.POINTER_MOVE, EVENT.POINTER_UP, EVENT.POINTER_CANCEL],
    ({ emit }) => {
        const pointers = new Map()

        const normalize = ({ source_event, event_data, hit_target }) => {
            const pointer_id = source_event.pointerId
            const pointer = pointers.get(pointer_id)
            let target = hit_target

            if (source_event.type === EVENT.POINTER_DOWN) {
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
            } else if (source_event.type === EVENT.POINTER_UP || source_event.type === EVENT.POINTER_CANCEL) {
                return
            }

            if (target !== null && event_data !== null) {
                emit(source_event.type, {
                    source_event,
                    event_data,
                    target,
                })
            }

            if (source_event.type === EVENT.POINTER_UP || source_event.type === EVENT.POINTER_CANCEL) {
                pointers.delete(pointer_id)
            }
        }

        return {
            main: {
                [EVENT.POINTER_DOWN]: normalize,
                [EVENT.POINTER_MOVE]: normalize,
                [EVENT.POINTER_UP]: normalize,
                [EVENT.POINTER_CANCEL]: normalize,
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
    },
)

export const POINTER_HOVER_EVENTS = Events.defineEvent([EVENT.POINTER_OVER, EVENT.POINTER_OUT], ({ emit }) => {
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
            emit(EVENT.POINTER_OUT, {
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
            emit(EVENT.POINTER_OVER, {
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
            emit(EVENT.POINTER_OUT, {
                source_event,
                event_data: event_data ?? pointer.event_data,
                target: pointer.target,
                related_target: null,
            })
        }
    }

    return {
        before: {
            [EVENT.POINTER_DOWN]: update,
            [EVENT.POINTER_MOVE]: update,
            [EVENT.POINTER_UP]: update,
        },
        after: {
            [EVENT.POINTER_UP]: (context) => {
                if (context.source_event.pointerType === 'touch') {
                    end(context)
                }
            },
            [EVENT.POINTER_CANCEL]: end,
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

export const CLICK_EVENT = Events.defineEvent(EVENT.CLICK, ({ emit }) => {
    const pointers = new Map()

    return {
        before: {
            [EVENT.POINTER_DOWN]: ({ source_event, event_data, hit_target }) => {
                if (hit_target !== null) {
                    pointers.set(source_event.pointerId, {
                        target: hit_target,
                        event_data,
                    })
                }
            },
            [EVENT.POINTER_CANCEL]: ({ source_event }) => {
                pointers.delete(source_event.pointerId)
            },
        },
        after: {
            [EVENT.POINTER_UP]: ({ source_event, event_data, hit_target }) => {
                const pointer = pointers.get(source_event.pointerId)
                pointers.delete(source_event.pointerId)

                if (pointer?.target === hit_target) {
                    emit(EVENT.CLICK, {
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

export const DEFAULT_EVENTS = [POINTER_EVENTS, POINTER_HOVER_EVENTS, CLICK_EVENT]
