/**
 * @typedef {import('../core/UI').DefinedEvent} DefinedEvent
 */
/**
 * @typedef {import('../renderer/RendererWebGPU').RendererWebGPUOptions & import('../core/UI').EventOptions<UIWebGPU>} UIWebGPUOptions
 */
export default class UIWebGPU extends UI {
    /** @param {UIWebGPUOptions} options */
    static create(options: UIWebGPUOptions): Promise<{
        ui: UIWebGPU;
    }>;
    /**
     *
     * @param {UIWebGPUOptions} options
     */
    protected constructor({ resources, defined_events, ...renderer_options }: UIWebGPUOptions);
    dispatchPlatformEvent(source_event: any): void;
}
export type DefinedEvent = import("../core/UI").DefinedEvent;
export type UIWebGPUOptions = import("../renderer/RendererWebGPU").RendererWebGPUOptions & import("../core/UI").EventOptions<UIWebGPU>;
import UI from '../core/UI';
