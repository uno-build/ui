export default class Operations {
    items: any[];
    layout_nodes: Set<any>;
    scroll_nodes: Set<any>;
    /** @private */
    private pending;
    /** @private */
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
    add(operation: any): void;
    capture(): boolean;
    consume(): void;
    discardNode(node: any): void;
    clear(): void;
    needUpdateOrder(): boolean;
    needCheckLayout(): boolean;
    setUpdateLayout(update_layout: any): void;
    needUpdateLayout(): boolean;
    needUpdateScrollMetrics(): boolean;
    hasContextChanges(): boolean;
    /** @private */
    private reset;
    /** @private */
    private compact;
}
