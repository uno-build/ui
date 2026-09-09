export default class EventEmitter {
    /** @private */
    private listeners;
    /**
     * @param {any} type
     * @param {(event_data: any) => void} listener
     */
    on(type: any, listener: (event_data: any) => void): () => void;
    /**
     * @param {any} type
     * @param {(event_data: any) => void} listener
     */
    off(type: any, listener: (event_data: any) => void): void;
    /**
     * @param {any} type
     * @param {any} [event_data]
     */
    emit(type: any, event_data?: any): void;
    destroy(): void;
}
