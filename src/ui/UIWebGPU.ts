import UI from '../core/UI'
import { DEFAULT_EVENTS } from '../events'
import RendererWebGPU from '../renderer/RendererWebGPU'

export default class UIWebGPU extends UI {
    protected constructor({ resources, defined_events = [], onPlatformEvent: on_platform_event, ...renderer_options }) {
        const renderer = new RendererWebGPU({ resources, ...renderer_options })
        super({
            renderer,
            resources,
            defined_events: [...DEFAULT_EVENTS, ...defined_events],
            onPlatformEvent: on_platform_event,
        })
    }

    public static async create(options) {
        const ui = new UIWebGPU(options)
        await ui.initialize()
        ui.listenPlatformEvents(ui.dispatchPlatformEvent)
        return { ui }
    }

    public dispatchPlatformEvent(source_event) {
        const rect = source_event.currentTarget.getBoundingClientRect()
        this.emitPlatformEvent(source_event, {
            x: ((source_event.clientX - rect.left) / rect.width) * this.root.layout.width,
            y: ((source_event.clientY - rect.top) / rect.height) * this.root.layout.height,
        })
    }
}
