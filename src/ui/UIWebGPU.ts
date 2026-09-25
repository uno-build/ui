import type { EventOptions } from '../core/UI'
import type { PlatformEvent } from '../events/types'
import type { RendererWebGPUOptions } from '../renderer/RendererWebGPU'
import type ResourcesWebGPU from '../renderer/webgpu/ResourcesWebGPU'
import UI from '../core/UI'
import { DEFINED_EVENTS } from '../events'
import RendererWebGPU from '../renderer/RendererWebGPU'

export type { DefinedEvent } from '../core/UI'

export type UIWebGPUOptions = RendererWebGPUOptions & EventOptions<UIWebGPU>

type PlatformEventCanvas = Pick<HTMLCanvasElement, 'addEventListener' | 'removeEventListener' | 'getBoundingClientRect'>

export default class UIWebGPU extends UI<RendererWebGPU, ResourcesWebGPU> {
    private platform_event_canvas: PlatformEventCanvas | null = null
    private platform_event_names = new Set<string>()

    protected constructor({ resources, defined_events = [], ...renderer_options }: UIWebGPUOptions) {
        const renderer = new RendererWebGPU({ resources, ...renderer_options })
        super({
            renderer,
            resources,
            defined_events: [...DEFINED_EVENTS, ...defined_events] as EventOptions<UI>['defined_events'],
        })
    }

    static async create(options: UIWebGPUOptions) {
        const ui = new UIWebGPU(options)
        await ui.initialize()
        return { ui }
    }

    registerPlatformEvents(): void {
        if (this.platform_event_canvas !== null) return

        const canvas = this.resources?.canvas as Partial<PlatformEventCanvas> | undefined
        if (
            typeof canvas?.addEventListener !== 'function' ||
            typeof canvas.removeEventListener !== 'function' ||
            typeof canvas.getBoundingClientRect !== 'function'
        ) {
            return
        }

        this.platform_event_canvas = canvas as PlatformEventCanvas
        this.platform_event_names = new Set(
            this.defined_events.flatMap(({ types }) => types.filter(({ platform }) => platform).map(({ name }) => name)),
        )
        for (const name of this.platform_event_names) {
            canvas.addEventListener(name, this.onPlatformEvent, { passive: false })
        }
    }

    removePlatformEvents(): void {
        if (this.platform_event_canvas === null) return

        for (const name of this.platform_event_names) {
            this.platform_event_canvas.removeEventListener(name, this.onPlatformEvent)
        }
        this.platform_event_canvas = null
        this.platform_event_names.clear()
    }

    dispatchPlatformEvent(source_event: PlatformEvent) {
        const rect = (source_event.currentTarget as Element).getBoundingClientRect()
        this.emitPlatformEvent(source_event, {
            x: ((source_event.clientX - rect.left) / rect.width) * this.root!.layout!.width!,
            y: ((source_event.clientY - rect.top) / rect.height) * this.root!.layout!.height!,
        })
    }

    destroy() {
        this.removePlatformEvents()
        return super.destroy()
    }

    private onPlatformEvent = (event: Event) => {
        const layout = this.root?.layout
        if (layout?.width === undefined || layout.height === undefined) return
        const dispatch_result = this.dispatchPlatformEvent(event as PlatformEvent) as void | Promise<void>
        dispatch_result?.catch(console.error)
    }
}
