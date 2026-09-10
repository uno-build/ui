/**
 * @typedef {object} DefinedEvent
 * @property {Array<typeof import('../events/constants').EVENT[keyof typeof import('../events/constants').EVENT]>} types
 * @property {() => void} destroy
 * @property {(node: Node) => void} [destroyNode]
 */
/**
 * @template {UI} TUI
 * @typedef {object} EventOptions
 * @property {Array<(options: { ui: TUI }) => DefinedEvent>} [defined_events]
 */
export default class UI {
    /**
     *
     * @param {any} options
     */
    protected constructor({ renderer, resources, defined_events }: any);
    /** @type {Node | null} */
    root: Node | null;
    /** @type {import('./Renderer').default | null} */
    renderer: import("./Renderer").default | null;
    /** @type {import('./Resources').default | null} */
    resources: import("./Resources").default | null;
    defined_events: any[];
    events: EventEmitter;
    events_source: EventEmitter;
    /** @protected */
    protected operations: Operations;
    /** @private */
    private nodes;
    /** @private */
    private nodes_created;
    /** @private */
    private next_node_id;
    /** @private */
    private destroyed;
    /** @private */
    private device_pixel_ratio;
    /** @private */
    private viewport_width;
    /** @private */
    private viewport_height;
    /** @private */
    private root_size;
    /** @private */
    private offImageResources;
    /** @private */
    private offFontResources;
    /** @protected */
    protected initialize(): Promise<any>;
    create(): Node | undefined;
    update(): void;
    /**
     * @param {any} [options]
     */
    draw(options?: any): void;
    setDevicePixelRatio(device_pixel_ratio: any): void;
    setViewport(width: any, height: any): void;
    setRootSize(root_size: any): void;
    /** @returns {boolean | void} */
    destroy(): boolean | void;
    /**
     * @protected
     * @param {any} source_event
     * @param {any} event_data
     */
    protected emitPlatformEvent(source_event: any, event_data: any): void;
    /** @private */
    private getNodeAtPoint;
    /** @private */
    private addChild;
    /** @private */
    private updateNodePath;
    /** @private */
    private detachNode;
    /** @private */
    private destroyNode;
    /** @private */
    private destroySubtree;
    /** @private */
    private releaseNode;
}
export type DefinedEvent = {
    types: Array<typeof import("../events/constants").EVENT[keyof typeof import("../events/constants").EVENT]>;
    destroy: () => void;
    destroyNode?: ((node: Node) => void) | undefined;
};
export type EventOptions<TUI extends UI> = {
    defined_events?: ((options: {
        ui: TUI;
    }) => DefinedEvent)[] | undefined;
};
import Node from './Node';
import EventEmitter from './EventEmitter';
import Operations from './Operations';
