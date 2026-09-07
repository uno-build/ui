import Resources from '../../core/Resources'

export default class ResourcesDom extends Resources {
    private images = new Map()
    private fonts = new Map()

    protected constructor(options) {
        super(options)
        // Web fonts change the text metrics the DOM layout is read from.
        document.fonts.addEventListener('loadingdone', () => {
            this.registry_version++
        })
    }

    public static create(options) {
        return new ResourcesDom(options)
    }

    protected imageRegister(src: string, image: any) {
        if (this.images.has(src)) {
            throw new Error(`Image "${src}" is already registered.`)
        }

        this.images.set(src, image)
    }

    protected imageDispose(src: string) {
        this.images.delete(src)
    }

    public getImage(src: string) {
        return this.images.get(src)
    }

    public getImageSize(src: string) {
        const image = this.getImage(src)
        return image === undefined ? undefined : { width: image.width, height: image.height }
    }

    protected fontRegister(name: string, image: any, json: any) {
        if (this.fonts.has(name)) {
            throw new Error(`Font "${name}" is already registered.`)
        }

        this.fonts.set(name, json.metrics)
    }

    protected fontDispose(name: string) {
        this.fonts.delete(name)
    }

    public getFont(name: string) {
        return this.fonts.get(name)
    }
}
