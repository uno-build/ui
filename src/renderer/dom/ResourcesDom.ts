import Resources from '../../core/Resources'

export default class ResourcesDom extends Resources {
    private fonts = new Map()

    protected constructor(options) {
        super(options)
    }

    public static create(options) {
        return new ResourcesDom(options)
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
