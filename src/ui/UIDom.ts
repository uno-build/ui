import type { EventOptions } from '../core/UI'
import type ResourcesDom from '../renderer/dom/ResourcesDom'
import UI from '../core/UI'
import { EVENT } from '../events/constants'
import { defineFocus } from '../events/focus'
import { normalizeDelta } from '../events/wheel'
import RendererDom from '../renderer/RendererDom'

export type UIDomOptions = EventOptions<UIDom> & {
    resources: ResourcesDom
}

const DOM_POINTER_EVENTS = [
    EVENT.POINTERDOWN,
    EVENT.POINTERMOVE,
    EVENT.POINTERUP,
    EVENT.POINTERCANCEL,
    EVENT.POINTEROVER,
    EVENT.POINTEROUT,
]
const DOM_EVENTS = [defineDomPointer, defineDomWheel, defineDomScroll, defineDomClick, defineFocus]

export default class UIDom extends UI<RendererDom, ResourcesDom> {
    protected constructor({ resources, defined_events = [] }: UIDomOptions) {
        const renderer = new RendererDom({ resources })
        super({ renderer, resources, defined_events: [...DOM_EVENTS, ...defined_events] })
    }

    static async create(options: UIDomOptions) {
        const ui = new UIDom(options)
        await ui.initialize()
        return { ui }
    }
}

function defineDomPointer({ ui }: { ui: UIDom }) {
    const canvas = ui.resources!.canvas
    const listener = (source_event: PointerEvent) => {
        const target = ui.renderer!.getEventNode(source_event.target as globalThis.Node | null)

        if (target !== null) {
            ui.events.emit(source_event.type, {
                source_event,
                event_data: getDomEventData(ui, source_event),
                target,
                ...(source_event.type === EVENT.POINTEROVER.name || source_event.type === EVENT.POINTEROUT.name
                    ? {
                          related_target: ui.renderer!.getEventNode(
                              source_event.relatedTarget as globalThis.Node | null,
                          ),
                      }
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

function defineDomWheel({ ui }: { ui: UIDom }) {
    const canvas = ui.resources!.canvas
    const listener = (source_event: WheelEvent) => {
        const target = ui.renderer!.getEventNode(source_event.target as globalThis.Node | null)

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

function defineDomScroll({ ui }: { ui: UIDom }) {
    const canvas = ui.resources!.canvas
    const listener = (source_event: Event) => {
        const node = ui.renderer!.syncScroll(source_event.target as HTMLElement)

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

function defineDomClick({ ui }: { ui: UIDom }) {
    const canvas = ui.resources!.canvas
    const listener = (source_event: MouseEvent) => {
        const target = ui.renderer!.getEventNode(source_event.target as globalThis.Node | null)

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

function getDomEventData(ui: UIDom, source_event: Pick<MouseEvent, 'clientX' | 'clientY'>) {
    const rect = ui.resources!.canvas.getBoundingClientRect()
    return {
        x: ((source_event.clientX - rect.left) / rect.width) * ui.root!.layout!.width!,
        y: ((source_event.clientY - rect.top) / rect.height) * ui.root!.layout!.height!,
    }
}
