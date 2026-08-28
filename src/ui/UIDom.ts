import UI from '../core/UI'
import { DEFAULT_EVENTS } from '../events'
import { EVENT } from '../events/const'
import RendererDom from '../renderer/RendererDom'

const SOURCE_EVENT_TYPES = [
    EVENT.POINTER_DOWN.name,
    EVENT.POINTER_MOVE.name,
    EVENT.POINTER_UP.name,
    EVENT.POINTER_CANCEL.name,
    EVENT.WHEEL.name,
]

export default class UIDom extends UI {
    private remove_event_listeners = []

    protected constructor({ resources, defined_events = [] }) {
        const renderer = new RendererDom({ resources })
        super({ renderer, resources, defined_events: [...DEFAULT_EVENTS, ...defined_events] })

        this.remove_event_listeners = SOURCE_EVENT_TYPES.map((type) => {
            const listener = (source_event) => this.dispatchEvent(source_event)
            resources.canvas.addEventListener(type, listener)
            return () => resources.canvas.removeEventListener(type, listener)
        })
    }

    public static async create(options) {
        const ui = new UIDom(options)
        await ui.initialize()
        return { ui }
    }

    public dispatchEvent(source_event) {
        const rect = this.resources.canvas.getBoundingClientRect()
        this.dispatchEventAt(source_event, {
            x: ((source_event.clientX - rect.left) / rect.width) * this.root.layout.width,
            y: ((source_event.clientY - rect.top) / rect.height) * this.root.layout.height,
        })
    }

    public destroy() {
        const destroyed = super.destroy()

        if (destroyed) {
            this.remove_event_listeners.forEach((removeListener) => removeListener())
            this.remove_event_listeners.length = 0
        }

        return destroyed
    }
}
