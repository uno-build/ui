export default abstract class Resources {
    public canvas
    public registry_version = 0

    protected constructor({ canvas }) {
        this.canvas = canvas
    }

    public registerImage(src: string, image: any) {
        const registered_image = this.imageRegister(src, image)
        this.registry_version++
        return registered_image
    }

    public disposeImage(src: string): void {
        this.imageDispose(src)
        this.registry_version++
    }

    public registerFont(name: string, image: any, json: any) {
        const registered_font = this.fontRegister(name, image, json)
        this.registry_version++
        return registered_font
    }

    public disposeFont(name: string): void {
        this.fontDispose(name)
        this.registry_version++
    }

    public abstract getImageSize(src: string): { width: number; height: number } | undefined

    protected abstract imageRegister(src: string, image: any): any

    protected abstract imageDispose(src: string): void

    protected abstract fontRegister(name: string, image: any, json: any): any

    protected abstract fontDispose(name: string): void
}
