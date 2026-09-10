/**
 * @typedef {{ canvas: HTMLElement }} ResourcesDomOptions
 * @typedef {{ width: number, height: number, src?: string }} DomImage
 * @typedef {Pick<import('../webgpu/contracts').FontMetrics, 'lineHeight'> & Partial<import('../webgpu/contracts').FontMetrics>} FontMetrics
 */
/** @extends {Resources<HTMLElement>} */
export default class ResourcesDom extends Resources<HTMLElement> {
    /** @param {ResourcesDomOptions} options */
    static create(options: ResourcesDomOptions): ResourcesDom;
    /**
     *
     * @param {ResourcesDomOptions} options
     */
    protected constructor(options: ResourcesDomOptions);
    /** @private @type {Map<string, DomImage>} */
    private images;
    /** @private @type {Map<string, FontMetrics>} */
    private fonts;
    /** @private */
    private font_observers;
    /** @private */
    private onFontsLoaded;
    observeFonts(): () => void;
    /**
     * @override
     * @param {string} src
     * @param {DomImage} image
     */
    override registerImage(src: string, image: DomImage): void;
    /**
     * @param {string} src
     */
    getImage(src: string): DomImage | undefined;
    /**
     * @override
     * @param {string} name
     * @param {unknown} image
     * @param {{ metrics: FontMetrics }} json
     */
    override registerFont(name: string, image: unknown, json: {
        metrics: FontMetrics;
    }): void;
    /**
     * @param {string} name
     */
    getFont(name: string): FontMetrics | undefined;
    /**
     * @override
     * @param {string} src
     */
    disposeImage(src: string): void;
    /**
     * @override
     * @param {string} src
     */
    getImageSize(src: string): { width: number; height: number; } | undefined;
    /**
     * @override
     * @param {string} name
     */
    disposeFont(name: string): void;
}
export type ResourcesDomOptions = {
    canvas: HTMLElement;
};
export type DomImage = {
    width: number;
    height: number;
    src?: string;
};
export type FontMetrics = Pick<import("../webgpu/contracts").FontMetrics, "lineHeight"> & Partial<import("../webgpu/contracts").FontMetrics>;
import Resources from '../../core/Resources';
