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
import Node from './Node';
import EventEmitter from './EventEmitter';
import Operations from './Operations';
