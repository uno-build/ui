export default class Events {
    private listeners = new Map()

    public on(type, listener) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set())
        }
        this.listeners.get(type).add(listener)
        return () => this.off(type, listener)
    }

    public off(type, listener) {
        const listeners = this.listeners.get(type)
        if (listeners) {
            listeners.delete(listener)
        }
    }

    public emit(type, event_data) {
        const listeners = this.listeners.get(type)
        if (listeners) {
            listeners.forEach((listener) => listener(event_data))
        }
    }

    public destroy() {
        this.listeners.clear()
    }
}
