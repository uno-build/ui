export default class ResourcesDom extends Resources {
    static create(options: any): ResourcesDom;
    /**
     *
     * @param {any} options
     */
    protected constructor(options: any);
    /** @private */
    private images;
    /** @private */
    private fonts;
    /** @private */
    private font_observers;
    /** @private */
    private onFontsLoaded;
    observeFonts(): () => void;
    /**
     * @override
     * @param {string} src
     * @param {any} image
     */
    override registerImage(src: string, image: any): void;
    /**
     * @param {string} src
     */
    getImage(src: string): any;
    /**
     * @override
     * @param {string} src
     */
    override getImageSize(src: string): {
        width: any;
        height: any;
    } | undefined;
    /**
     * @override
     * @param {string} name
     * @param {any} image
     * @param {any} json
     */
    override registerFont(name: string, image: any, json: any): void;
    /**
     * @param {string} name
     */
    getFont(name: string): any;
    /**
     * @override
     * @param {string} src
     */
    disposeImage(src: string): void;
    /**
     * @override
     * @param {string} name
     */
    disposeFont(name: string): void;
}
import Resources from '../../core/Resources';
