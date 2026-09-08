import Resources from '../../core/Resources'

export default class ResourcesDom extends Resources {
    public image_registry_version = 0
    public font_registry_version = 0
    private images = new Map()
    private fonts = new Map()

    protected constructor(options) {
        super(options)
    }

    public static create(options) {
        return new ResourcesDom(options)
    }

    public registerImage(src: string, image: any) {
        if (this.images.has(src)) {
            throw new Error(`Image "${src}" is already registered.`)
        }

        this.images.set(src, image)
        this.image_registry_version++
    }

    public disposeImage(src: string) {
        if (this.images.delete(src)) {
            this.image_registry_version++
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
        this.font_registry_version++
    }

    public disposeFont(name: string) {
        if (this.fonts.delete(name)) {
            this.font_registry_version++
        }
    }

    public getFont(name: string) {
        return this.fonts.get(name)
    }
}
