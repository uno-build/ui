/**
 * @typedef {import('../core/UI').EventOptions<UIDom> & {
 *   resources: import('../renderer/dom/ResourcesDom').default
 * }} UIDomOptions
 */
export default class UIDom extends UI {
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
import UI from '../core/UI';
