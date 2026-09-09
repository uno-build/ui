// @ts-check

import { OVERFLOW } from '../style/constants'
import { EVENT } from './constants'
import { normalizeDelta } from './wheel'

const SCROLL_SLOP = 10 // The minimum drag distance in pixels to mark the node as scrolling
const WHEEL_FACTOR = 1 // The factor to scale the wheel scroll delta

/**
 * @param {any} options
 */
export function defineScroll({ ui }) {
    const pointers = new Map()

    const scrollTo = /** @param {any} node @param {any} scroll_left @param {any} scroll_top @param {any} source_event */ (node, scroll_left, scroll_top, source_event) => {
        const previous_left = Math.round(node.scrollLeft)
        const previous_top = Math.round(node.scrollTop)

        node.scrollLeft = Math.round(Math.max(0, Math.min(scroll_left, node.scrollWidth - node.clientWidth)))
        node.scrollTop = Math.round(Math.max(0, Math.min(scroll_top, node.scrollHeight - node.clientHeight)))

        if (node.scrollLeft !== previous_left || node.scrollTop !== previous_top) {
            ui.events.emit(EVENT.SCROLL.name, {
                source_event,
                event_data: {
                    scroll_left: node.scrollLeft,
                    scroll_top: node.scrollTop,
                },
                target: node,
            })
            ui.update()
        }
    }

    const processPointerDown = /** @param {any} options */ ({ source_event, event_data, node: target }) => {
        if (source_event.pointerType === 'mouse' || pointers.size > 0 || target === null || event_data === null) {
            return
        }

        const node = findDragNode(target)
        if (node === null) {
            return
        }

        pointers.set(source_event.pointerId, {
            node,
            x: event_data.x,
            y: event_data.y,
            scroll_left: node.scrollLeft,
            scroll_top: node.scrollTop,
        })
    }

    const processPointerMove = /** @param {any} options */ ({ source_event, event_data }) => {
        const pointer = pointers.get(source_event.pointerId)
        if (pointer === undefined || event_data === null) {
            return
        }

        const node = pointer.node
        const delta_x = event_data.x - pointer.x
        const delta_y = event_data.y - pointer.y

        if (Math.abs(delta_x) > SCROLL_SLOP || Math.abs(delta_y) > SCROLL_SLOP) {
            node.scrolling = true
        }

        scrollTo(
            node,
            canScrollX(node) ? pointer.scroll_left - delta_x : node.scrollLeft,
            canScrollY(node) ? pointer.scroll_top - delta_y : node.scrollTop,
            source_event,
        )
    }

    const processPointerEnd = /** @param {any} options */ ({ source_event }) => {
        pointers.delete(source_event.pointerId)
    }

    const processWheel = /** @param {any} options */ ({ source_event, node: target }) => {
        if (target === null) {
            return
        }

        const wheel = findWheelScroll(
            target,
            normalizeDelta(source_event.deltaX, source_event.deltaMode),
            normalizeDelta(source_event.deltaY, source_event.deltaMode),
        )
        if (wheel === null) {
            return
        }

        const node = wheel.node
        const client_size = wheel.horizontal ? node.clientWidth : node.clientHeight
        const scroll_max = (wheel.horizontal ? node.scrollWidth : node.scrollHeight) - client_size
        const step = (wheel.delta * WHEEL_FACTOR * scroll_max) / client_size

        if (wheel.horizontal) {
            scrollTo(node, node.scrollLeft + step, node.scrollTop, source_event)
        } else {
            scrollTo(node, node.scrollLeft, node.scrollTop + step, source_event)
        }
    }

    const remove_listeners = [
        ui.events_source.on(EVENT.POINTERDOWN.name, processPointerDown),
        ui.events_source.on(EVENT.POINTERMOVE.name, processPointerMove),
        ui.events_source.on(EVENT.POINTERUP.name, processPointerEnd),
        ui.events_source.on(EVENT.POINTERCANCEL.name, processPointerEnd),
        ui.events_source.on(EVENT.WHEEL.name, processWheel),
    ]

    return {
        types: [EVENT.SCROLL],
        /**
         * @param {any} node
         */
        destroyNode(node) {
            for (const [pointer_id, pointer] of pointers) {
                if (pointer.node === node) {
                    pointers.delete(pointer_id)
                }
            }
        },

        destroy() {
            remove_listeners.forEach(/** @param {any} removeListener */ (removeListener) => removeListener())
            pointers.clear()
        },
    }
}

/**
 * @param {any} node
 */
function findDragNode(node) {
    let current_node = node

    while (current_node !== null) {
        if (canScrollX(current_node) || canScrollY(current_node)) {
            return current_node
        }
        current_node = current_node.parent
    }

    return null
}

/**
 * @param {any} node
 * @param {any} delta_x
 * @param {any} delta_y
 */
function findWheelScroll(node, delta_x, delta_y) {
    let current_node = node

    while (current_node !== null) {
        const scroll_max_y = current_node.scrollHeight - current_node.clientHeight
        if (canScrollY(current_node) && canMove(current_node.scrollTop, delta_y, scroll_max_y)) {
            return { node: current_node, horizontal: false, delta: delta_y }
        }

        const delta = Math.abs(delta_x) > Math.abs(delta_y) ? delta_x : delta_y
        const scroll_max_x = current_node.scrollWidth - current_node.clientWidth
        if (canScrollX(current_node) && canMove(current_node.scrollLeft, delta, scroll_max_x)) {
            return { node: current_node, horizontal: true, delta }
        }

        current_node = current_node.parent
    }

    return null
}

/**
 * @param {any} offset
 * @param {any} delta
 * @param {any} scroll_max
 */
function canMove(offset, delta, scroll_max) {
    return delta !== 0 && (delta < 0 ? offset > 0 : offset < scroll_max)
}

/**
 * @param {any} node
 */
function canScrollX(node) {
    return node.styles.overflowX?.parsed.enum === OVERFLOW.scroll && node.scrollWidth > node.clientWidth
}

/**
 * @param {any} node
 */
function canScrollY(node) {
    return node.styles.overflowY?.parsed.enum === OVERFLOW.scroll && node.scrollHeight > node.clientHeight
}
