type EventName = PropertyKey | object | null | undefined | boolean | bigint

export default class EventEmitter<TEvents = Record<string, any>> {
    private listeners = new Map<unknown, Set<(event_data: any) => void>>()

    on<TName extends EventName>(type: TName, listener: (event_data: TName extends keyof TEvents ? TEvents[TName] : any) => void) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set())
        }
        this.listeners.get(type)!.add(listener)
        return () => this.off(type, listener)
    }

    off<TName extends EventName>(type: TName, listener: (event_data: TName extends keyof TEvents ? TEvents[TName] : any) => void) {
        const listeners = this.listeners.get(type)
        if (listeners) {
            listeners.delete(listener)
        }
    }

    emit<TName extends EventName>(type: TName, event_data: TName extends keyof TEvents ? TEvents[TName] : any): void
    emit<TName extends EventName>(type: TName & (TName extends keyof TEvents ? undefined extends TEvents[TName] ? unknown : never : unknown)): void
    emit(type: unknown, event_data?: any) {
        const listeners = this.listeners.get(type)
        if (listeners) {
            listeners.forEach((listener) => listener(event_data))
        }
    }

    destroy() {
        this.listeners.clear()
    }
}
