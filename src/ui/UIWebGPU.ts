import type { PlatformEvent } from '../events/types'
import UI from '../core/UI'
import { DEFINED_EVENTS } from '../events'
import RendererWebGPU from '../renderer/RendererWebGPU'

export type DefinedEvent = import('../core/UI').DefinedEvent

export type UIWebGPUOptions = import('../renderer/RendererWebGPU').RendererWebGPUOptions &
    import('../core/UI').EventOptions<UIWebGPU>

export default class UIWebGPU extends UI<RendererWebGPU, import('../renderer/webgpu/ResourcesWebGPU').default> {
    protected constructor({ resources, defined_events = [], ...renderer_options }: UIWebGPUOptions) {
        const renderer = new RendererWebGPU({ resources, ...renderer_options })
        super({
            renderer,
            resources,
            defined_events: [
                ...DEFINED_EVENTS,
                ...defined_events,
            ] as import('../core/UI').EventOptions<UI>['defined_events'],
        })
    }

    static async create(options: UIWebGPUOptions) {
        const ui = new UIWebGPU(options)
        await ui.initialize()
        return { ui }
    }

    dispatchPlatformEvent(source_event: PlatformEvent) {
        const rect = (source_event.currentTarget as Element).getBoundingClientRect()
        this.emitPlatformEvent(source_event, {
            x: ((source_event.clientX - rect.left) / rect.width) * this.root!.layout!.width!,
            y: ((source_event.clientY - rect.top) / rect.height) * this.root!.layout!.height!,
        })
    }
}
