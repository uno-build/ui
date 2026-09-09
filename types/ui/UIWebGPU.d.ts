/**
 * @typedef {object} DefinedEvent
 * @property {Array<typeof import('../events/constants').EVENT[keyof typeof import('../events/constants').EVENT]>} types
 * @property {() => void} destroy
 * @property {(node: import('../core/Node').default) => void} [destroyNode]
 */
/**
 * @typedef {import('../renderer/RendererWebGPU').RendererWebGPUOptions & {
 *   defined_events?: Array<(options: { ui: UIWebGPU }) => DefinedEvent>
 * }} UIWebGPUOptions
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
export type DefinedEvent = {
    types: Array<typeof import("../events/constants").EVENT[keyof typeof import("../events/constants").EVENT]>;
    destroy: () => void;
    destroyNode?: ((node: import("../core/Node").default) => void) | undefined;
};
export type UIWebGPUOptions = import("../renderer/RendererWebGPU").RendererWebGPUOptions & {
    defined_events?: Array<(options: {
        ui: UIWebGPU;
    }) => DefinedEvent>;
};
import UI from '../core/UI';
