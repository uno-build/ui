import EventEmitter from './EventEmitter'
export default abstract class Resources<TCanvas = any> {
    canvas: TCanvas
    events: EventEmitter
    protected constructor({ canvas }: {
        canvas: TCanvas
    })
    abstract registerImage(src: string, image: any): any
    abstract disposeImage(src: string): void
    abstract getImageSize(src: string): {
        width: number
        height: number
    } | undefined
    abstract registerFont(name: string, image: any, json: any): any
    abstract disposeFont(name: string): void
}
