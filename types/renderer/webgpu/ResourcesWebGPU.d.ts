export default class ResourcesWebGPU extends Resources {
    static create(options: any): Promise<ResourcesWebGPU>;
    /**
     *
     * @param {any} options
     */
    protected constructor({ canvas, adapter, device, context, format, image_atlas_size, font_atlas_size, }: any);
    adapter: any;
    device: any;
    context: any;
    format: any;
    font_atlas_size: any;
    image_atlas_size: any;
    font_manager: any;
    image_manager: any;
    has_present: any;
    /** @protected */
    protected initialize(): Promise<void>;
    /**
     * @override
     * @param {string} src
     */
    override getImageSize(src: string): {
        width: any;
        height: any;
    } | undefined;
    /**
     * @returns {void}
     */
    dispose(): void;
    present(): void;
    /**
     * @override
     * @param {string} src
     * @param {any} image
     */
    registerImage(src: string, image: any): any;
    /**
     * @override
     * @param {string} src
     * @returns {void}
     */
    disposeImage(src: string): void;
    /**
     * @override
     * @param {string} name
     * @param {any} image
     * @param {any} json
     */
    registerFont(name: string, image: any, json: any): any;
    /**
     * @override
     * @param {string} name
     * @returns {void}
     */
    disposeFont(name: string): void;
}
import Resources from '../../core/Resources';
