import Node from './Node'
import Operations from './Operations'
import { ComputedLayout, StyleUpdate } from '../style/types'

export default abstract class Renderer<TDrawOptions = unknown, TDrawResult = void, TElement = unknown, TInitResult = unknown> {
    init(): Promise<TInitResult>
    destroy(nodes?: Node<TElement>[]): void
    setDevicePixelRatio(device_pixel_ratio: number): void
    setViewport(width: number, height: number): void
    setRootSize(root_size: number): void
    addChild(parent: Node<TElement>, node: Node<TElement>, child_index?: number): void
    prepareLayout(nodes_created: Set<Node<TElement>>, operations: Operations<TElement>): boolean
    beforeUpdate(nodes: Node<TElement>[], operations: Operations<TElement>): void
    afterUpdate(nodes: Node<TElement>[], operations: Operations<TElement>): void
    update(nodes: Node<TElement>[], operations: Operations<TElement>): void
    draw(options?: TDrawOptions): TDrawResult
    initializeTextNode(node: Node<TElement>): void
    invalidateTextNode(node: Node<TElement>): void
    abstract createElement(node: Node<TElement>): TElement
    abstract getChildIndex(node: Node<TElement>): number
    abstract getLayout(node: Node<TElement>): ComputedLayout
    abstract detachChild(parent: Node<TElement>, node: Node<TElement>, release_subtree?: boolean): void
    abstract destroyNode(node: Node<TElement>): void
    abstract updateStyle(node: Node<TElement>, style: StyleUpdate): void
    protected abstract insertChild(parent: Node<TElement>, node: Node<TElement>, child_index: number): void
}
