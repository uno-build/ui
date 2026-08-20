import Resources from '../../core/Resources'

export default class ResourcesDom extends Resources {
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
    }

    public disposeImage(src: string) {
        this.images.delete(src)
    }

    public getImage(src: string) {
        return this.images.get(src)
    }

    public registerFont(name: string, image: any, json: any) {
        if (this.fonts.has(name)) {
            throw new Error(`Font "${name}" is already registered.`)
        }

        this.fonts.set(name, json.metrics)
    }

    public disposeFont(name: string) {
        this.fonts.delete(name)
    }

    public getFont(name: string) {
        return this.fonts.get(name)
    }
}
