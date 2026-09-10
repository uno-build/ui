/**
 * @extends {Resources<import('./contracts').WebGPUCanvas | undefined, {
 *   image: import('./contracts').WebGPUImage,
 *   font_image: import('./contracts').WebGPUImage,
 *   font_data: import('./contracts').FontData,
 *   registered_image: import('./ImageManager').ManagedAtlasImage,
 *   registered_font: import('./FontManager').ManagedFont
 * }>}
 */
export default class ResourcesWebGPU extends Resources<import("./contracts").WebGPUCanvas | undefined, {
    image: import("./contracts").WebGPUImage;
    font_image: import("./contracts").WebGPUImage;
    font_data: import("./contracts").FontData;
    registered_image: import("./ImageManager").ManagedAtlasImage;
    registered_font: import("./FontManager").ManagedFont;
}> {
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
     * @returns {void}
     */
    dispose(): void;
    present(): void;
    /**
     * @override
     * @param {string} src
     * @param {import('./contracts').WebGPUImage} image
     * @returns {import('./ImageManager').ManagedAtlasImage}
     */
    registerImage(src: string, image: import("./contracts").WebGPUImage): import("./ImageManager").ManagedAtlasImage;
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
     * @param {import('./contracts').WebGPUImage} image
     * @param {import('./contracts').FontData} json
     * @returns {import('./FontManager').ManagedFont}
     */
    registerFont(name: string, image: import("./contracts").WebGPUImage, json: import("./contracts").FontData): import("./FontManager").ManagedFont;
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
