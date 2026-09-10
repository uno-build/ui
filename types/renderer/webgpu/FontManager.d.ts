/**
 * @typedef {{
 *     name: string
 *     image: import('./contracts').WebGPUImage
 *     json: import('./contracts').FontData
 *     layer: number
 *     uv_rect: [number, number, number, number]
 *     image_size: [number, number]
 *     metrics: import('./contracts').FontMetrics
 *     glyphs_by_unicode: Map<number, ManagedGlyph>
 * }} ManagedFont
 */
/**
 * @typedef {{
 *     unicode: number
 *     advance: number
 *     plane_bounds?: [number, number, number, number]
 *     uv_rect?: [number, number, number, number]
 * }} ManagedGlyph
 */
export class FontManager {
    /** @param {{ device: GPUDevice, atlas_size: number }} options */
    constructor({ device, atlas_size }: {
        device: GPUDevice;
        atlas_size: number;
    });
    fonts: Map<string, ManagedFont>;
    texture_version: number;
    /** @private @type {GPUDevice} */
    private device;
    /** @private */
    private atlas_size;
    /** @private @type {GPUTexture | null} */
    private font_texture;
    /** @private */
    private font_layer_count;
    /** @private */
    private font_texture_layer_count;
    /**
     * @private
     * @type {number[]}
     */
    private free_font_layers;
    /** @private */
    private default_font_name;
    /**
     * @returns {void}
     */
    dispose(): void;
    /**
     * @param {string} name
     * @returns {boolean}
     */
    fontDispose(name: string): boolean;
    /**
     * @param {string} name
     * @param {import('./contracts').WebGPUImage} image
     * @param {import('./contracts').FontData} json
     * @returns {ManagedFont}
     */
    fontRegister(name: string, image: import("./contracts").WebGPUImage, json: import("./contracts").FontData): ManagedFont;
    /**
     * @returns {ManagedFont | undefined}
     */
    getDefaultFont(): ManagedFont | undefined;
    /**
     * @param {string} name
     * @returns {ManagedFont | undefined}
     */
    getFont(name: string): ManagedFont | undefined;
    getTextureView(): GPUTextureView;
    /**
     * @private
     * @returns {number}
     */
    private allocateFontLayer;
    /** @private */
    private growFontTexture;
    /** @private */
    private createFontTexture;
    /** @private @returns {GPUTexture} */
    private getFontTexture;
    /**
     * @private
     * @returns {Map<number, ManagedGlyph>}
     */
    private createGlyphsByUnicode;
}
export type ManagedFont = {
    name: string;
    image: import("./contracts").WebGPUImage;
    json: import("./contracts").FontData;
    layer: number;
    uv_rect: [number, number, number, number];
    image_size: [number, number];
    metrics: import("./contracts").FontMetrics;
    glyphs_by_unicode: Map<number, ManagedGlyph>;
};
export type ManagedGlyph = {
    unicode: number;
    advance: number;
    plane_bounds?: [number, number, number, number];
    uv_rect?: [number, number, number, number];
};
