export type ResourcesDomOptions = {
    canvas: HTMLElement;
};

export type DomImage = {
    width: number;
    height: number;
    src?: string;
};

export type FontMetrics = Pick<import("../webgpu/contracts").FontMetrics, "lineHeight"> & Partial<import("../webgpu/contracts").FontMetrics>;

import Resources from '../../core/Resources'
import { RESOURCE_EVENT } from '../../core/constants'

export default class ResourcesDom extends Resources<HTMLElement, {
    image: DomImage;
    font_image: unknown;
    font_data: {
        metrics: FontMetrics;
    };
    registered_image: void;
    registered_font: void;
}> {

    private images: Map<string, DomImage> = new Map()

    private fonts: Map<string, FontMetrics> = new Map()

    private font_observers: Set<any> = new Set()

    private onFontsLoaded = () => {
        this.events.emit(RESOURCE_EVENT.FONT)
    }

    protected constructor(options: ResourcesDomOptions) {
        super(options)
    }

    static create(options: ResourcesDomOptions) {
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

    registerImage(src: string, image: DomImage) {
        if (this.images.has(src)) {
            throw new Error(`Image "${src}" is already registered.`)
        }

        this.images.set(src, image)
        this.events.emit(RESOURCE_EVENT.IMAGE)
    }

    disposeImage(src: string) {
        if (this.images.delete(src)) {
            this.events.emit(RESOURCE_EVENT.IMAGE)
        }
    }

    getImage(src: string) {
        return this.images.get(src)
    }

    getImageSize(src: string) {
        const image = this.getImage(src)
        return image === undefined ? undefined : { width: image.width, height: image.height }
    }

    registerFont(name: string, image: unknown, json: { metrics: FontMetrics; }) {
        if (this.fonts.has(name)) {
            throw new Error(`Font "${name}" is already registered.`)
        }

        this.fonts.set(name, json.metrics)
        this.events.emit(RESOURCE_EVENT.FONT)
    }

    disposeFont(name: string) {
        if (this.fonts.delete(name)) {
            this.events.emit(RESOURCE_EVENT.FONT)
        }
    }

    getFont(name: string) {
        return this.fonts.get(name)
    }
}
