/**
 * @typedef {import('../core/UI').DefinedEvent} DefinedEvent
 */
/**
 * @typedef {import('../renderer/RendererWebGPU').RendererWebGPUOptions & import('../core/UI').EventOptions<UIWebGPU>} UIWebGPUOptions
 */
/** @extends {UI<RendererWebGPU, import('../renderer/webgpu/ResourcesWebGPU').default>} */
export default class UIWebGPU extends UI<RendererWebGPU, import("../../src/renderer/webgpu/ResourcesWebGPU").default> {
    /** @param {UIWebGPUOptions} options */
    static create(options: UIWebGPUOptions): Promise<{
        ui: UIWebGPU;
    }>;
    /**
     *
     * @param {UIWebGPUOptions} options
     */
    protected constructor({ resources, defined_events, ...renderer_options }: UIWebGPUOptions);
    /** @param {import('../events/types').PlatformEvent} source_event */
    dispatchPlatformEvent(source_event: import("../../src/events/types").PlatformEvent): void;
}
export type DefinedEvent = import("../../src/core/UI").DefinedEvent;
export type UIWebGPUOptions = import("../../src/renderer/RendererWebGPU").RendererWebGPUOptions & import("../../src/core/UI").EventOptions<UIWebGPU>;
import RendererWebGPU from '../../src/renderer/RendererWebGPU';
import UI from '../../src/core/UI';
