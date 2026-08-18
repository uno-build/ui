export default class DOMResources {
    private fonts = new Map()

    public static create() {
        return new DOMResources()
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
