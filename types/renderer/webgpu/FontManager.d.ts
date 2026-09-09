/**
 * @typedef {{
 *     name: string
 *     image: any
 *     json: any
 *     layer: number
 *     uv_rect: [number, number, number, number]
 *     image_size: [number, number]
 *     metrics: any
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
    constructor({ device, atlas_size }: {
        device: any;
        atlas_size: any;
    });
    fonts: Map<string, ManagedFont>;
    texture_version: number;
    /** @private */
    private device;
    /** @private */
    private atlas_size;
    /** @private */
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
     * @param {any} image
     * @param {any} json
     * @returns {ManagedFont}
     */
    fontRegister(name: string, image: any, json: any): ManagedFont;
    /**
     * @returns {ManagedFont | undefined}
     */
    getDefaultFont(): ManagedFont | undefined;
    /**
     * @param {string} name
     * @returns {ManagedFont | undefined}
     */
    getFont(name: string): ManagedFont | undefined;
    getTextureView(): any;
    /**
     * @private
     * @returns {number}
     */
    private allocateFontLayer;
    /** @private */
    private growFontTexture;
    /** @private */
    private createFontTexture;
    /** @private */
    private getFontTexture;
    /**
     * @private
     * @returns {Map<number, ManagedGlyph>}
     */
    private createGlyphsByUnicode;
}
export type ManagedFont = {
    name: string;
    image: any;
    json: any;
    layer: number;
    uv_rect: [number, number, number, number];
    image_size: [number, number];
    metrics: any;
    glyphs_by_unicode: Map<number, ManagedGlyph>;
};
export type ManagedGlyph = {
    unicode: number;
    advance: number;
    plane_bounds?: [number, number, number, number];
    uv_rect?: [number, number, number, number];
};
