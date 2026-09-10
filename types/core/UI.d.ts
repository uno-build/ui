/**
 * @typedef {object} DefinedEvent
 * @property {Array<{ platform: boolean, name: string, prop: string, priority: string }>} types
 * @property {() => void} destroy
 * @property {(node: Node) => void} [destroyNode]
 */
/**
 * @template {UI} TUI
 * @typedef {object} EventOptions
 * @property {Array<(options: { ui: TUI }) => DefinedEvent>} [defined_events]
 */
/**
 * @template {import('./Renderer').default<unknown, unknown, unknown, unknown>} [TRenderer=import('./Renderer').default<unknown, unknown, unknown, unknown>]
 * @template {import('./Resources').default<unknown>} [TResources=import('./Resources').default<unknown>]
 */
export default class UI<TRenderer extends import("./Renderer").default<unknown, unknown, unknown, unknown> = import("./Renderer").default<unknown, unknown, unknown, unknown>, TResources extends import("./Resources").default<unknown> = import("./Resources").default<unknown, import("./Resources").ResourceTypes>> {
    /**
     *
     * @param {any} options
     */
    protected constructor({ renderer, resources, defined_events }: any);
    /** @type {Node<ReturnType<TRenderer['createElement']>> | null} */
    root: Node<ReturnType<TRenderer["createElement"]>> | null;
    /** @type {TRenderer | null} */
    renderer: TRenderer | null;
    /** @type {TResources | null} */
    resources: TResources | null;
    defined_events: any[];
    /** @type {EventEmitter<import('../events/types').UIEventMap>} */
    events: EventEmitter<import("../events/types").UIEventMap>;
    events_source: EventEmitter<Record<string, any>>;
    /** @protected @type {Operations<ReturnType<TRenderer['createElement']>>} */
    protected operations: Operations<ReturnType<TRenderer["createElement"]>>;
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
    protected initialize(): Promise<unknown>;
    /** @returns {Node<ReturnType<TRenderer['createElement']>> | undefined} */
    create(): Node<ReturnType<TRenderer["createElement"]>> | undefined;
    update(): void;
    /**
     * @param {Parameters<TRenderer['draw']>[0]} [options]
     * @returns {ReturnType<TRenderer['draw']> | undefined}
     */
    draw(options?: Parameters<TRenderer["draw"]>[0]): ReturnType<TRenderer["draw"]> | undefined;
    /** @param {number} device_pixel_ratio */
    setDevicePixelRatio(device_pixel_ratio: number): void;
    /** @param {number} width @param {number} height */
    setViewport(width: number, height: number): void;
    /** @param {number} root_size */
    setRootSize(root_size: number): void;
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
    types: Array<{
        platform: boolean;
        name: string;
        prop: string;
        priority: string;
    }>;
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
