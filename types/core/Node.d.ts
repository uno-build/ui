export default class Node {
    /** @param {{ id: number, ui: import('./UI').default }} options */
    constructor({ id, ui }: {
        id: number;
        ui: import("./UI").default;
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
    /** @type {import('../style/types').NodeLayout} */
    layout: import("../style/types").NodeLayout;
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
    /** @type {Partial<Record<import('../style/types').StyleName, import('../style/types').ResolvedStyle>>} */
    styles: Partial<Record<import("../style/types").StyleName, import("../style/types").ResolvedStyle>>;
    /** @private */
    private styles_declared;
    /** @private */
    private listeners;
    id: number;
    /**
     * @param {Node} child
     * @param {Node | null} [before_node]
     */
    add(child: Node, before_node?: Node | null): void;
    /** @param {Node} child */
    remove(child: Node): void;
    detach(): void;
    destroy(): void;
    /** @param {import('../events/types').EventSource | null} [source_event] */
    focus(source_event?: import("../events/types").EventSource | null): void;
    /** @param {import('../events/types').EventSource | null} [source_event] */
    blur(source_event?: import("../events/types").EventSource | null): void;
    /**
     * @template {string} TName
     * @param {TName} type
     * @param {(event: import('../events/types').EventPayload<TName>) => void} listener
     */
    on<TName extends string>(type: TName, listener: (event: import("../events/types").EventPayload<TName>) => void): void;
    /**
     * @template {string} TName
     * @param {TName} type
     * @param {(event: import('../events/types').EventPayload<TName>) => void} listener
     */
    off<TName extends string>(type: TName, listener: (event: import("../events/types").EventPayload<TName>) => void): void;
    destroyEvents(): void;
    /** @private */
    private processEvent;
    /** @private */
    private isEventDispatcher;
    /** @private */
    private dispatchListeners;
    /** @param {import('../style/types').StyleName | (string & {})} name @param {string} value */
    style(name: import("../style/types").StyleName | (string & {}), value: string): void;
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
