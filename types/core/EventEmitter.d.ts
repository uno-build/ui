/** @template [TEvents=Record<string, any>] */
export default class EventEmitter<TEvents = Record<string, any>> {
    /** @private */
    private listeners;
    /**
     * @template {PropertyKey | object | null | undefined | boolean | bigint} TName
     * @param {TName} type
     * @param {(event_data: TName extends keyof TEvents ? TEvents[TName] : any) => void} listener
     */
    on<TName extends PropertyKey | object | null | undefined | boolean | bigint>(type: TName, listener: (event_data: TName extends keyof TEvents ? TEvents[TName] : any) => void): () => void;
    /**
     * @template {PropertyKey | object | null | undefined | boolean | bigint} TName
     * @param {TName} type
     * @param {(event_data: TName extends keyof TEvents ? TEvents[TName] : any) => void} listener
     */
    off<TName extends PropertyKey | object | null | undefined | boolean | bigint>(type: TName, listener: (event_data: TName extends keyof TEvents ? TEvents[TName] : any) => void): void;
    /**
     * @template {PropertyKey | object | null | undefined | boolean | bigint} TName
     * @overload
     * @param {TName} type
     * @param {TName extends keyof TEvents ? TEvents[TName] : any} event_data
     * @returns {void}
     */
    emit<TName extends PropertyKey | object | null | undefined | boolean | bigint>(type: TName, event_data: TName extends keyof TEvents ? TEvents[TName] : any): void;
    /**
     * @template {PropertyKey | object | null | undefined | boolean | bigint} TName
     * @overload
     * @param {TName & (TName extends keyof TEvents ? undefined extends TEvents[TName] ? unknown : never : unknown)} type
     * @returns {void}
     */
    emit<TName extends PropertyKey | object | null | undefined | boolean | bigint>(type: TName & (TName extends keyof TEvents ? undefined extends TEvents[TName] ? unknown : never : unknown)): void;
    destroy(): void;
}
