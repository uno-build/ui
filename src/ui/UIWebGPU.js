import UI from '../core/UI'
import { DEFINED_EVENTS } from '../events'
import RendererWebGPU from '../renderer/RendererWebGPU'

/**
 * @typedef {import('../core/UI').DefinedEvent} DefinedEvent
 */

/**
 * @typedef {import('../renderer/RendererWebGPU').RendererWebGPUOptions & import('../core/UI').EventOptions<UIWebGPU>} UIWebGPUOptions
 */

export default class UIWebGPU extends UI {
    /**
     * @protected
     * @param {UIWebGPUOptions} options
     */
    constructor({ resources, defined_events = [], ...renderer_options }) {
        const renderer = new RendererWebGPU({ resources, ...renderer_options })
        super({ renderer, resources, defined_events: [...DEFINED_EVENTS, ...defined_events] })
    }

    /** @param {UIWebGPUOptions} options */
    static async create(options) {
        const ui = new UIWebGPU(options)
        await ui.initialize()
        return { ui }
    }

    dispatchPlatformEvent(source_event) {
        const rect = source_event.currentTarget.getBoundingClientRect()
        this.emitPlatformEvent(source_event, {
            x: ((source_event.clientX - rect.left) / rect.width) * this.root.layout.width,
            y: ((source_event.clientY - rect.top) / rect.height) * this.root.layout.height,
        })
    }
}
