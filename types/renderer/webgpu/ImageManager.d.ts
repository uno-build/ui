/** @typedef {import('../utils/atlas-allocator').AtlasRect} AtlasRect */
/** @typedef {import('../utils/atlas-allocator').SkylineNode} SkylineNode */
export const ATLAS_PADDING: 2;
/**
 * @typedef {{
 *     src: string
 *     layer: number
 *     uv_rect: [number, number, number, number]
 *     image_size: [number, number]
 * }} AtlasImage
 */
/**
 * @typedef {{
 *     layer: number
 *     skyline: SkylineNode[]
 *     free_rects: AtlasRect[]
 * }} AtlasLayer
 */
/**
 * @typedef {AtlasImage & {
 *     atlas_layer: AtlasLayer
 *     x: number
 *     y: number
 *     width: number
 *     height: number
 * }} ManagedAtlasImage
 */
export class ImageManager {
    constructor({ device, atlas_size }: {
        device: any;
        atlas_size: any;
    });
    images: Map<string, ManagedAtlasImage>;
    texture_version: number;
    /** @private */
    private device;
    /** @private */
    private atlas_size;
    /** @private */
    private atlas_texture;
    /** @private */
    private atlas_layer_count;
    /** @private */
    private atlas_texture_layer_count;
    /**
     * @private
     * @type {AtlasLayer[]}
     */
    private atlas_layers;
    /**
     * @returns {void}
     */
    dispose(): void;
    /**
     * @param {string} src
     * @returns {AtlasImage | undefined}
     */
    getImage(src: string): AtlasImage | undefined;
    getTextureView(): any;
    /**
     * @param {string} src
     * @param {any} image
     * @returns {ManagedAtlasImage}
     */
    imageUpload(src: string, image: any): ManagedAtlasImage;
    /**
     * @param {string} src
     * @returns {boolean}
     */
    imageDispose(src: string): boolean;
    /** @private */
    private allocateAtlasRect;
    /** @private */
    private tryAllocateAtlasRect;
    /**
     * @private
     * @returns {AtlasLayer}
     */
    private createAtlasLayer;
    /**
     * @private
     * @returns {AtlasLayer}
     */
    private growAtlasTexture;
    /** @private */
    private createAtlasTexture;
    /** @private */
    private getAtlasTexture;
    /** @private */
    private copyImagePadding;
    /**
     * @private
     * @returns {[number, number, number, number]}
     */
    private createAtlasUvRect;
}
export type AtlasRect = import("../utils/atlas-allocator").AtlasRect;
export type SkylineNode = import("../utils/atlas-allocator").SkylineNode;
export type AtlasImage = {
    src: string;
    layer: number;
    uv_rect: [number, number, number, number];
    image_size: [number, number];
};
export type AtlasLayer = {
    layer: number;
    skyline: SkylineNode[];
    free_rects: AtlasRect[];
};
export type ManagedAtlasImage = AtlasImage & {
    atlas_layer: AtlasLayer;
    x: number;
    y: number;
    width: number;
    height: number;
};
