export default class Node {
    constructor({ id, ui }: {
        id: any;
        ui: any;
    });
    /** @type {import('./UI').default | null} */
    ui: import("./UI").default | null;
    /** @type {any} */
    element: any;
    /** @type {Node | null} */
    parent: Node | null;
    /** @type {Node[]} */
    children: Node[];
    /** @type {number[]} */
    path: number[];
    /** @type {Record<string, any>} */
    layout: Record<string, any>;
    /** @type {string | undefined} */
    text_content: string | undefined;
    order: number;
    scroll_top: number;
    scroll_left: number;
    scrollHeight: number;
    scrollWidth: number;
    clientHeight: number;
    clientWidth: number;
    scrolling: boolean;
    /** @type {Record<string, any>} */
    styles: Record<string, any>;
    /** @private */
    private styles_declared;
    /** @private */
    private listeners;
    id: any;
    /**
     * @param {Node} child
     * @param {Node | null} [before_node]
     */
    add(child: Node, before_node?: Node | null): void;
    remove(child: any): void;
    detach(): void;
    destroy(): void;
    /** @param {any} [source_event] */
    focus(source_event?: any): void;
    /** @param {any} [source_event] */
    blur(source_event?: any): void;
    on(type: any, listener: any): void;
    off(type: any, listener: any): void;
    destroyEvents(): void;
    /** @private */
    private processEvent;
    /** @private */
    private isEventDispatcher;
    /** @private */
    private dispatchListeners;
    style(name: any, value: any): void;
    /**
     * @param {string} value
     */
    text(value: string): void;
    isTextNode(): boolean;
    hasTextContent(): boolean;
    set scrollTop(value: number);
    get scrollTop(): number;
    set scrollLeft(value: number);
    get scrollLeft(): number;
}
