/** @extends {Resources<import('./contracts').WebGPUCanvas | undefined>} */
export default class ResourcesWebGPU extends Resources<import("./contracts").WebGPUCanvas | undefined> {
    /** @param {import('./contracts').ResourcesWebGPUOptions} options */
    static create(options: import("./contracts").ResourcesWebGPUOptions): Promise<ResourcesWebGPU>;
    /**
     *
     * @param {import('./contracts').ResourcesWebGPUOptions} options
     */
    protected constructor({ canvas, adapter, device, context, format, image_atlas_size, font_atlas_size, }: import("./contracts").ResourcesWebGPUOptions);
    /** @type {GPUAdapter | null | undefined} */
    adapter: GPUAdapter | null | undefined;
    /** @type {GPUDevice} */
    device: GPUDevice;
    /** @type {import('./contracts').WebGPUContext} */
    context: import("./contracts").WebGPUContext;
    /** @type {GPUTextureFormat} */
    format: GPUTextureFormat;
    /** @type {number} */
    font_atlas_size: number;
    /** @type {number} */
    image_atlas_size: number;
    /** @type {FontManager} */
    font_manager: FontManager;
    /** @type {ImageManager} */
    image_manager: ImageManager;
    /** @type {boolean} */
    has_present: boolean;
    /** @protected */
    protected initialize(): Promise<void>;
    /**
     * @override
     * @param {string} src
     * @param {import('./contracts').WebGPUImage} image
     */
    override registerImage(src: string, image: import("./contracts").WebGPUImage): import("./ImageManager").ManagedAtlasImage;
    /**
     * @override
     * @param {string} name
     * @param {import('./contracts').WebGPUImage} image
     * @param {import('./contracts').FontData} json
     */
    override registerFont(name: string, image: import("./contracts").WebGPUImage, json: import("./contracts").FontData): import("./FontManager").ManagedFont;
    /**
     * @returns {void}
     */
    dispose(): void;
    present(): void;
    /**
     * @override
     * @param {string} src
     * @returns {void}
     */
    disposeImage(src: string): void;
    /**
     * @override
     * @param {string} src
     * @returns {{ width: number, height: number } | undefined}
     */
    getImageSize(src: string): { width: number; height: number; } | undefined;
    /**
     * @override
     * @param {string} name
     * @returns {void}
     */
    disposeFont(name: string): void;
}
import Resources from '../../core/Resources';
import { FontManager } from './FontManager';
import { ImageManager } from './ImageManager';
