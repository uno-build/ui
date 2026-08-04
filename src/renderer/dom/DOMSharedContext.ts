export default class DOMResources {
    private fonts = new Map()

    public static create() {
        return new DOMResources()
    }

    public registerFont(name: string, image: any, json: any) {
        this.fonts.set(name, json.metrics)
    }

    public getFont(name: string) {
        return this.fonts.get(name)
    }
}
