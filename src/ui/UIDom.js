import UI from '../core/UI'
import { EVENT } from '../events/constants'
import { defineFocus } from '../events/focus'
import { normalizeDelta } from '../events/wheel'
import RendererDom from '../renderer/RendererDom'

const DOM_POINTER_EVENTS = [
    EVENT.POINTERDOWN,
    EVENT.POINTERMOVE,
    EVENT.POINTERUP,
    EVENT.POINTERCANCEL,
    EVENT.POINTEROVER,
    EVENT.POINTEROUT,
]
const DOM_EVENTS = [defineDomPointer, defineDomWheel, defineDomScroll, defineDomClick, defineFocus]

/**
 * @typedef {import('../core/UI').EventOptions<UIDom> & {
 *   resources: import('../renderer/dom/ResourcesDom').default
 * }} UIDomOptions
 */

/** @extends {UI<RendererDom, import('../renderer/dom/ResourcesDom').default>} */
export default class UIDom extends UI {
    /**
     * @protected
     * @param {UIDomOptions} options
     */
    constructor({ resources, defined_events = [] }) {
        const renderer = new RendererDom({ resources })
        super({ renderer, resources, defined_events: [...DOM_EVENTS, ...defined_events] })
    }

    /** @param {UIDomOptions} options */
    static async create(options) {
        const ui = new UIDom(options)
        await ui.initialize()
        return { ui }
    }
}

function defineDomPointer({ ui }) {
    const canvas = ui.resources.canvas
    const listener = (source_event) => {
        const target = ui.renderer.getEventNode(source_event.target)

        if (target !== null) {
            ui.events.emit(source_event.type, {
                source_event,
                event_data: getDomEventData(ui, source_event),
                target,
                ...(source_event.type === EVENT.POINTEROVER.name || source_event.type === EVENT.POINTEROUT.name
                    ? { related_target: ui.renderer.getEventNode(source_event.relatedTarget) }
                    : {}),
            })
        }
    }

    for (const type of DOM_POINTER_EVENTS) {
        canvas.addEventListener(type.name, listener)
    }

    return {
        types: DOM_POINTER_EVENTS,
        destroy() {
            for (const type of DOM_POINTER_EVENTS) {
                canvas.removeEventListener(type.name, listener)
            }
        },
    }
}

function defineDomWheel({ ui }) {
    const canvas = ui.resources.canvas
    const listener = (source_event) => {
        const target = ui.renderer.getEventNode(source_event.target)

        if (target !== null) {
            ui.events.emit(EVENT.WHEEL.name, {
                source_event,
                event_data: {
                    ...getDomEventData(ui, source_event),
                    delta_x: normalizeDelta(source_event.deltaX, source_event.deltaMode),
                    delta_y: normalizeDelta(source_event.deltaY, source_event.deltaMode),
                },
                target,
            })
        }
    }

    canvas.addEventListener(EVENT.WHEEL.name, listener)

    return {
        types: [EVENT.WHEEL],
        destroy() {
            canvas.removeEventListener(EVENT.WHEEL.name, listener)
        },
    }
}

function defineDomScroll({ ui }) {
    const canvas = ui.resources.canvas
    const listener = (source_event) => {
        const node = ui.renderer.syncScroll(source_event.target)

        if (node !== undefined) {
            ui.events.emit(EVENT.SCROLL.name, {
                source_event,
                event_data: {
                    scroll_left: node.scrollLeft,
                    scroll_top: node.scrollTop,
                },
                target: node,
            })
        }
    }

    canvas.addEventListener(EVENT.SCROLL.name, listener, true)

    return {
        types: [EVENT.SCROLL],
        destroy() {
            canvas.removeEventListener(EVENT.SCROLL.name, listener, true)
        },
    }
}

function defineDomClick({ ui }) {
    const canvas = ui.resources.canvas
    const listener = (source_event) => {
        const target = ui.renderer.getEventNode(source_event.target)

        if (target !== null) {
            ui.events.emit(EVENT.CLICK.name, {
                source_event,
                event_data: getDomEventData(ui, source_event),
                target,
            })
        }
    }

    canvas.addEventListener(EVENT.CLICK.name, listener)

    return {
        types: [EVENT.CLICK],
        destroy() {
            canvas.removeEventListener(EVENT.CLICK.name, listener)
        },
    }
}

function getDomEventData(ui, source_event) {
    const rect = ui.resources.canvas.getBoundingClientRect()
    return {
        x: ((source_event.clientX - rect.left) / rect.width) * ui.root.layout.width,
        y: ((source_event.clientY - rect.top) / rect.height) * ui.root.layout.height,
    }
}
