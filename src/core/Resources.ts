import EventEmitter from './EventEmitter'
import { EVENT } from '../events/const'

export default abstract class Resources {
    public canvas
    public events
    public events_platform

    protected constructor({ canvas }) {
        this.events = new EventEmitter()
        this.canvas = canvas
        this.onPlatformEvent = this.onPlatformEvent.bind(this)
        this.events_platform = Object.values(EVENT)
            .filter((event) => event.platform)
            .map((event) => event.name)

        if (this.canvas?.addEventListener !== undefined) {
            for (const event_name of this.events_platform) {
                this.canvas.addEventListener(event_name, this.onPlatformEvent)
            }
        }
    }

    public dispose() {
        if (this.canvas?.removeEventListener !== undefined) {
            for (const event_name of this.events_platform) {
                this.canvas.removeEventListener(event_name, this.onPlatformEvent)
            }
        }
        this.events.destroy()
    }

    public onPlatformEvent(event) {
        this.events.emit('platformevent', event)
    }

    public abstract registerImage(src: string, image: any): any

    public abstract disposeImage(src: string): void

    public abstract getImageSize(src: string): { width: number; height: number } | undefined

    public abstract registerFont(name: string, image: any, json: any): any

    public abstract disposeFont(name: string): void
}
