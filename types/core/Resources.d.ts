import EventEmitter from './EventEmitter'

export type ResourceTypes = {
    image: unknown
    font_image: unknown
    font_data: unknown
    registered_image: unknown
    registered_font: unknown
}

export default abstract class Resources<TCanvas = unknown, TTypes extends ResourceTypes = ResourceTypes> {
    canvas: TCanvas
    events: EventEmitter
    protected constructor({ canvas }: {
        canvas: TCanvas
    })
    abstract registerImage(src: string, image: TTypes['image']): TTypes['registered_image']
    abstract disposeImage(src: string): void
    abstract getImageSize(src: string): {
        width: number
        height: number
    } | undefined
    abstract registerFont(name: string, image: TTypes['font_image'], json: TTypes['font_data']): TTypes['registered_font']
    abstract disposeFont(name: string): void
}
