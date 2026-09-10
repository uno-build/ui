import type Node from './Node'
import type Operations from './Operations'
import type { ComputedLayout, StyleUpdate } from '../style/types'

export default abstract class Renderer<TDrawOptions = unknown, TDrawResult = void, TElement = unknown, TInitResult = unknown> {
    init(): Promise<TInitResult>
    async init(): Promise<any> {}

    destroy(nodes?: Node<TElement>[]): void
    destroy() {}

    setDevicePixelRatio(device_pixel_ratio: number) {}

    setViewport(width: number, height: number) {}

    setRootSize(root_size: number) {}

    addChild(parent: Node<TElement>, node: Node<TElement>, child_index = this.getChildIndex(parent)) {
        this.insertChild(parent, node, child_index)
    }

    prepareLayout(_nodes_created: Set<Node<TElement>>, operations: Operations<TElement>) {
        return operations.needCheckLayout()
    }

    beforeUpdate(_nodes: Node<TElement>[], _operations: Operations<TElement>) {}

    afterUpdate(_nodes: Node<TElement>[], _operations: Operations<TElement>) {}

    update(_nodes: Node<TElement>[], _operations: Operations<TElement>) {}

    draw(options?: TDrawOptions): TDrawResult
    draw(options?: TDrawOptions): any {}

    initializeTextNode(node: Node<TElement>) {}
    invalidateTextNode(node: Node<TElement>) {}

    abstract createElement(node: Node<TElement>): TElement
    abstract getChildIndex(node: Node<TElement>): number
    abstract getLayout(node: Node<TElement>): ComputedLayout
    abstract detachChild(parent: Node<TElement>, node: Node<TElement>, release_subtree?: boolean): void
    abstract destroyNode(node: Node<TElement>): void
    abstract updateStyle(node: Node<TElement>, style: StyleUpdate): void
    protected abstract insertChild(parent: Node<TElement>, node: Node<TElement>, child_index: number): void
}
