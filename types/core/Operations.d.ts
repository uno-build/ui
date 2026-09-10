/**
 * @template [TElement=unknown]
 * @typedef {import('./Node').default<TElement>} OperationNode
 */
/**
 * @template [TElement=unknown]
 * @typedef {(
 *   { op: 'add', parent: OperationNode<TElement> | null, node: OperationNode<TElement>, child_index?: number } |
 *   { op: 'remove', parent: OperationNode<TElement>, node: OperationNode<TElement> } |
 *   { op: 'style', node: OperationNode<TElement>, style: import('../style/types').StyleUpdate } |
 *   { op: 'text', node: OperationNode<TElement>, value: string } |
 *   { op: 'scroll', node: OperationNode<TElement> } |
 *   { op: 'viewport', width: number, height: number } |
 *   { op: 'root_size' | 'pixel_ratio', value: number } |
 *   { op: 'resource_image' | 'resource_font' }
 * )} Operation
 */
/** @template [TElement=unknown] */
export default class Operations<TElement = unknown> {
    /** @type {Operation<TElement>[]} */
    items: Operation<TElement>[];
    /** @type {Set<OperationNode<TElement>>} */
    layout_nodes: Set<OperationNode<TElement>>;
    /** @type {Set<OperationNode<TElement>>} */
    scroll_nodes: Set<OperationNode<TElement>>;
    /** @private @type {Operation<TElement>[]} */
    private pending;
    /** @private @type {Set<Operation<TElement>>} */
    private captured;
    /** @private */
    private update_order;
    /** @private */
    private check_layout;
    /** @private */
    private update_layout;
    /** @private */
    private update_scroll_metrics;
    /** @private */
    private context_changed;
    /** @param {Operation<TElement>} operation */
    add(operation: Operation<TElement>): void;
    capture(): boolean;
    consume(): void;
    /** @param {OperationNode<TElement>} node */
    discardNode(node: OperationNode<TElement>): void;
    clear(): void;
    needUpdateOrder(): boolean;
    needCheckLayout(): boolean;
    /** @param {boolean} update_layout */
    setUpdateLayout(update_layout: boolean): void;
    needUpdateLayout(): boolean;
    needUpdateScrollMetrics(): boolean;
    hasContextChanges(): boolean;
    /** @private */
    private reset;
    /** @private */
    private compact;
}
export type OperationNode<TElement = unknown> = import("./Node").default<TElement>;
export type Operation<TElement = unknown> = ({
    op: "add";
    parent: OperationNode<TElement> | null;
    node: OperationNode<TElement>;
    child_index?: number;
} | {
    op: "remove";
    parent: OperationNode<TElement>;
    node: OperationNode<TElement>;
} | {
    op: "style";
    node: OperationNode<TElement>;
    style: import("../style/types").StyleUpdate;
} | {
    op: "text";
    node: OperationNode<TElement>;
    value: string;
} | {
    op: "scroll";
    node: OperationNode<TElement>;
} | {
    op: "viewport";
    width: number;
    height: number;
} | {
    op: "root_size" | "pixel_ratio";
    value: number;
} | {
    op: "resource_image" | "resource_font";
});
