import EventEmitter from './EventEmitter'

export default abstract class Resources {
    public canvas
    public events = new EventEmitter()

    protected constructor({ canvas }) {
        this.canvas = canvas
    }

    public abstract registerImage(src: string, image: any): any

    public abstract disposeImage(src: string): void

    public abstract getImageSize(src: string): { width: number; height: number } | undefined

    public abstract registerFont(name: string, image: any, json: any): any

    public abstract disposeFont(name: string): void
}
