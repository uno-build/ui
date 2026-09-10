// @ts-check

/** @template [TEvents=Record<string, any>] */
export default class EventEmitter {
    /** @private */
    listeners = new Map()

    /**
     * @template {PropertyKey | object | null | undefined | boolean | bigint} TName
     * @param {TName} type
     * @param {(event_data: TName extends keyof TEvents ? TEvents[TName] : any) => void} listener
     */
    on(type, listener) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set())
        }
        this.listeners.get(type).add(listener)
        return () => this.off(type, listener)
    }

    /**
     * @template {PropertyKey | object | null | undefined | boolean | bigint} TName
     * @param {TName} type
     * @param {(event_data: TName extends keyof TEvents ? TEvents[TName] : any) => void} listener
     */
    off(type, listener) {
        const listeners = this.listeners.get(type)
        if (listeners) {
            listeners.delete(listener)
        }
    }

    /**
     * @template {PropertyKey | object | null | undefined | boolean | bigint} TName
     * @overload
     * @param {TName} type
     * @param {TName extends keyof TEvents ? TEvents[TName] : any} event_data
     * @returns {void}
     */
    /**
     * @template {PropertyKey | object | null | undefined | boolean | bigint} TName
     * @overload
     * @param {TName & (TName extends keyof TEvents ? undefined extends TEvents[TName] ? unknown : never : unknown)} type
     * @returns {void}
     */
    /** @param {any} type @param {any} [event_data] */
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
