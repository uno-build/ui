/**
 * @typedef {import('../core/UI').EventOptions<UIDom> & {
 *   resources: import('../renderer/dom/ResourcesDom').default
 * }} UIDomOptions
 */
/** @extends {UI<RendererDom>} */
export default class UIDom extends UI<RendererDom> {
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
export type UIDomOptions = import("../core/UI").EventOptions<UIDom> & {
    resources: import("../renderer/dom/ResourcesDom").default;
};
import RendererDom from '../renderer/RendererDom';
import UI from '../core/UI';
