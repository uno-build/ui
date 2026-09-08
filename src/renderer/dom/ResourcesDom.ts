import Resources from '../../core/Resources'
import { RESOURCE_EVENT } from '../../core/constants'

export default class ResourcesDom extends Resources {
    private images = new Map()
    private fonts = new Map()
    private font_observers = new Set()
    private onFontsLoaded = () => {
        this.events.emit(RESOURCE_EVENT.FONT)
    }

    protected constructor(options) {
        super(options)
    }

    public static create(options) {
        return new ResourcesDom(options)
    }

    public observeFonts() {
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

    public registerImage(src: string, image: any) {
        if (this.images.has(src)) {
            throw new Error(`Image "${src}" is already registered.`)
        }

        this.images.set(src, image)
        this.events.emit(RESOURCE_EVENT.IMAGE)
    }

    public disposeImage(src: string) {
        if (this.images.delete(src)) {
            this.events.emit(RESOURCE_EVENT.IMAGE)
        }
    }

    public getImage(src: string) {
        return this.images.get(src)
    }

    public getImageSize(src: string) {
        const image = this.getImage(src)
        return image === undefined ? undefined : { width: image.width, height: image.height }
    }

    public registerFont(name: string, image: any, json: any) {
        if (this.fonts.has(name)) {
            throw new Error(`Font "${name}" is already registered.`)
        }

        this.fonts.set(name, json.metrics)
        this.events.emit(RESOURCE_EVENT.FONT)
    }

    public disposeFont(name: string) {
        if (this.fonts.delete(name)) {
            this.events.emit(RESOURCE_EVENT.FONT)
        }
    }

    public getFont(name: string) {
        return this.fonts.get(name)
    }
}
