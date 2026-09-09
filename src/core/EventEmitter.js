// @ts-check

export default class EventEmitter {
    /** @private */
    listeners = new Map()

    /**
     * @param {any} type
     * @param {(event_data: any) => void} listener
     */
    on(type, listener) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set())
        }
        this.listeners.get(type).add(listener)
        return () => this.off(type, listener)
    }

    /**
     * @param {any} type
     * @param {(event_data: any) => void} listener
     */
    off(type, listener) {
        const listeners = this.listeners.get(type)
        if (listeners) {
            listeners.delete(listener)
        }
    }

    /**
     * @param {any} type
     * @param {any} [event_data]
     */
    emit(type, event_data) {
        const listeners = this.listeners.get(type)
        if (listeners) {
            listeners.forEach(/** @param {(event_data: any) => void} listener */ (listener) => listener(event_data))
        }
    }

    destroy() {
        this.listeners.clear()
    }
}
