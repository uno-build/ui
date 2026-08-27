import Events from '../core/Events'

export const EVENT = {
    POINTER_DOWN: { name: 'pointerdown', component: 'onPointerDown', priority: 'discrete' },
    POINTER_MOVE: { name: 'pointermove', component: 'onPointerMove', priority: 'continuous' },
    POINTER_UP: { name: 'pointerup', component: 'onPointerUp', priority: 'discrete' },
    POINTER_CANCEL: { name: 'pointercancel', component: 'onPointerCancel', priority: 'discrete' },
    POINTER_OVER: { name: 'pointerover', component: 'onPointerOver', priority: 'continuous' },
    POINTER_OUT: { name: 'pointerout', component: 'onPointerOut', priority: 'continuous' },
    CLICK: { name: 'click', component: 'onClick', priority: 'discrete' },
}

export const POINTER_EVENTS = Events.defineEvent(
    [EVENT.POINTER_DOWN, EVENT.POINTER_MOVE, EVENT.POINTER_UP, EVENT.POINTER_CANCEL],
    ({ emit }) => {
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
    },
)

export const POINTER_HOVER_EVENTS = Events.defineEvent(
    [EVENT.POINTER_OVER, EVENT.POINTER_OUT],
    ({ emit }) => {
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
    },
)

export const CLICK_EVENT = Events.defineEvent(EVENT.CLICK, ({ emit }) => {
    const pointers = new Map()

    return {
        before: {
            [EVENT.POINTER_DOWN.name]: ({ source_event, event_data, hit_target }) => {
                if (hit_target !== null) {
                    clearScrollingNodes(hit_target)
                    pointers.set(source_event.pointerId, {
                        target: hit_target,
                        event_data,
                    })
                }
            },
            [EVENT.POINTER_CANCEL.name]: ({ source_event }) => {
                pointers.delete(source_event.pointerId)
            },
        },
        after: {
            [EVENT.POINTER_UP.name]: ({ source_event, event_data, hit_target }) => {
                const pointer = pointers.get(source_event.pointerId)
                pointers.delete(source_event.pointerId)

                if (pointer?.target === hit_target && !isScrollingNode(hit_target)) {
                    emit(EVENT.CLICK.name, {
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

function clearScrollingNodes(node) {
    let current_node = node

    while (current_node !== null) {
        current_node.scrolling = false
        current_node = current_node.parent
    }
}

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

export const DEFAULT_EVENTS = [POINTER_EVENTS, POINTER_HOVER_EVENTS, CLICK_EVENT]
