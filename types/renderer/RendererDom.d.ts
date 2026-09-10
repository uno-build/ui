/**
 * @typedef {import('../core/Node').default<HTMLElement>} DomNode
 * @typedef {import('../core/Operations').default<HTMLElement>} DomOperations
 */
/** @extends {Renderer<unknown, void, HTMLElement, void>} */
export default class RendererDom extends Renderer<unknown, void, HTMLElement, void> {
    /** @param {{ resources: import('./dom/ResourcesDom').default }} options */
    constructor({ resources }: {
        resources: import("./dom/ResourcesDom").default;
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
    /** @param {DomNode[]} nodes */
    destroy(nodes: DomNode[]): void;
    /** @override @param {DomNode} parent @param {DomNode} node */
    override detachChild(parent: DomNode, node: DomNode): void;
    /** @private */
    private updateBackgroundImage;
    /** @private */
    private updateTextLineHeight;
    /** @private */
    private applyNodeScroll;
    /** @private */
    private readNodeScroll;
    /** @param {HTMLElement} element @returns {DomNode | undefined} */
    syncScroll(element: HTMLElement): DomNode | undefined;
    /** @param {globalThis.Node | null} element @returns {DomNode | null} */
    getEventNode(element: globalThis.Node | null): DomNode | null;
    /** @override @param {DomNode} node @returns {HTMLElement} */
    createElement(node: DomNode): HTMLElement;
    protected insertChild(parent: DomNode, node: DomNode, child_index: number): void;
    /** @override @param {DomNode} node */
    destroyNode(node: DomNode): void;
    /** @override @param {DomNode} node @returns {number} */
    getChildIndex(node: DomNode): number;
    /** @override @param {DomNode} node @param {import('../style/types').StyleUpdate} resolved_style */
    updateStyle(node: DomNode, resolved_style: import("../style/types").StyleUpdate): void;
    /** @override @param {DomNode} node @returns {import('../style/types').ComputedLayout} */
    getLayout(node: DomNode): import("../style/types").ComputedLayout;
}
export type DomNode = import("../../src/core/Node").default<HTMLElement>;
export type DomOperations = import("../../src/core/Operations").default<HTMLElement>;
import Renderer from '../../src/core/Renderer';
