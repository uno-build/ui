import EventEmitter from './EventEmitter'

export type ResourceTypes = {
    image: unknown
    font: unknown
    registered_image: unknown
    registered_font: unknown
}

export default abstract class Resources<TCanvas = unknown, TTypes extends ResourceTypes = ResourceTypes> {
    canvas: TCanvas
    events = new EventEmitter()

    protected constructor({ canvas }: { canvas: TCanvas }) {
        this.canvas = canvas
    }

    abstract registerImage(src: string, image: TTypes['image']): TTypes['registered_image']
    abstract disposeImage(src: string): void
    abstract getImageSize(src: string): {
        width: number
        height: number
    } | undefined
    abstract registerFont(name: string, font: TTypes['font']): TTypes['registered_font']
    abstract disposeFont(name: string): void
}
