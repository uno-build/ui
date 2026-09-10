export default class RendererDom extends Renderer<any, void> {
    constructor({ resources }: {
        resources: any;
    });
    /** @private */
    private resources;
    /** @private */
    private elements;
    /** @private */
    private element_nodes;
    /** @private */
    private root_node;
    /** @private */
    private stopObservingFonts;
    init(): Promise<void>;
    prepareLayout(nodes_created: any, operations: any): any;
    setRootSize(root_size: any): void;
    createElement(node: any): any;
    /**
     * @protected
     * @param {any} parent
     * @param {any} node
     * @param {any} child_index
     */
    protected insertChild(parent: any, node: any, child_index: any): void;
    detachChild(parent: any, node: any): void;
    destroyNode(node: any): void;
    getChildIndex(node: any): any;
    initializeTextNode(node: any): void;
    updateStyle(node: any, resolved_style: any): void;
    /** @private */
    private updateBackgroundImage;
    /** @private */
    private updateTextLineHeight;
    beforeUpdate(nodes: any, operations: any): void;
    afterUpdate(nodes: any, operations: any): void;
    /** @private */
    private applyNodeScroll;
    /** @private */
    private readNodeScroll;
    syncScroll(element: any): any;
    getEventNode(element: any): any;
    getLayout(node: any): {
        border: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        width: any;
        height: any;
        left: any;
        top: any;
        x: any;
        y: any;
        centerX: number;
        centerY: number;
    };
}
import Renderer from '../core/Renderer';
