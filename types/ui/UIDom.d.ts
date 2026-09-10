/**
 * @typedef {import('../core/UI').EventOptions<UIDom> & {
 *   resources: import('../renderer/dom/ResourcesDom').default
 * }} UIDomOptions
 */
/** @extends {UI<RendererDom, import('../renderer/dom/ResourcesDom').default>} */
export default class UIDom extends UI<RendererDom, import("../../src/renderer/dom/ResourcesDom").default> {
    /** @param {UIDomOptions} options */
    static create(options: UIDomOptions): Promise<{
        ui: UIDom;
    }>;
    /**
     *
     * @param {UIDomOptions} options
     */
    protected constructor({ resources, defined_events }: UIDomOptions);
}
export type UIDomOptions = import("../../src/core/UI").EventOptions<UIDom> & {
    resources: import("../../src/renderer/dom/ResourcesDom").default;
};
import RendererDom from '../../src/renderer/RendererDom';
import UI from '../../src/core/UI';
