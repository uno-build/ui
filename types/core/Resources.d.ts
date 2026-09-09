import EventEmitter from './EventEmitter'
export default abstract class Resources {
    canvas: any
    events: EventEmitter
    protected constructor({ canvas }: {
        canvas: any
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
