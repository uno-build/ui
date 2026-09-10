import Resources from '../../core/Resources'
import { RESOURCE_EVENT } from '../../core/constants'

/**
 * @typedef {{ canvas: HTMLElement }} ResourcesDomOptions
 * @typedef {{ width: number, height: number, src?: string }} DomImage
 * @typedef {Pick<import('../webgpu/contracts').FontMetrics, 'lineHeight'> & Partial<import('../webgpu/contracts').FontMetrics>} FontMetrics
 */

/** @extends {Resources<HTMLElement>} */
export default class ResourcesDom extends Resources {
    /** @private @type {Map<string, DomImage>} */
    images = new Map()
    /** @private @type {Map<string, FontMetrics>} */
    fonts = new Map()
    /** @private */
    font_observers = new Set()
    /** @private */
    onFontsLoaded = () => {
        this.events.emit(RESOURCE_EVENT.FONT)
    }

    /**
     * @protected
     * @param {ResourcesDomOptions} options
     */
    constructor(options) {
        super(options)
    }

    /** @param {ResourcesDomOptions} options */
    static create(options) {
        return new ResourcesDom(options)
    }

    observeFonts() {
        if (this.font_observers.size === 0) {
            document.fonts.addEventListener('loadingdone', this.onFontsLoaded)
        }

        const stopObserving = () => {
            this.font_observers.delete(stopObserving)
            if (this.font_observers.size === 0) {
                document.fonts.removeEventListener('loadingdone', this.onFontsLoaded)
            }
        }
        this.font_observers.add(stopObserving)
        return stopObserving
    }

    /**
     * @override
     * @param {string} src
     * @param {DomImage} image
     */
    registerImage(src, image) {
        if (this.images.has(src)) {
            throw new Error(`Image "${src}" is already registered.`)
        }

        this.images.set(src, image)
        this.events.emit(RESOURCE_EVENT.IMAGE)
    }

    /**
     * @override
     * @param {string} src
     */
    disposeImage(src) {
        if (this.images.delete(src)) {
            this.events.emit(RESOURCE_EVENT.IMAGE)
        }
    }

    /**
     * @param {string} src
     */
    getImage(src) {
        return this.images.get(src)
    }

    /**
     * @override
     * @param {string} src
     */
    getImageSize(src) {
        const image = this.getImage(src)
        return image === undefined ? undefined : { width: image.width, height: image.height }
    }

    /**
     * @override
     * @param {string} name
     * @param {unknown} image
     * @param {{ metrics: FontMetrics }} json
     */
    registerFont(name, image, json) {
        if (this.fonts.has(name)) {
            throw new Error(`Font "${name}" is already registered.`)
        }

        this.fonts.set(name, json.metrics)
        this.events.emit(RESOURCE_EVENT.FONT)
    }

    /**
     * @override
     * @param {string} name
     */
    disposeFont(name) {
        if (this.fonts.delete(name)) {
            this.events.emit(RESOURCE_EVENT.FONT)
        }
    }

    /**
     * @param {string} name
     */
    getFont(name) {
        return this.fonts.get(name)
    }
}
