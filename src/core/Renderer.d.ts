export default abstract class Renderer<TDrawOptions = any, TDrawResult = void> {
    init(): Promise<any>
    destroy(nodes?: any): void
    setDevicePixelRatio(device_pixel_ratio: number): void
    setViewport(width: number, height: number): void
    setRootSize(root_size: number): void
    addChild(parent: any, node: any, child_index?: any): void
    prepareLayout(_nodes_created: any, operations: any): any
    beforeUpdate(_nodes: any, _operations: any): void
    afterUpdate(_nodes: any, _operations: any): void
    update(_nodes: any, _operations: any): void
    draw(options?: TDrawOptions): TDrawResult
    initializeTextNode(node: any): void
    invalidateTextNode(node: any): void
    abstract createElement(node: any): any
    abstract getChildIndex(node: any): any
    abstract getLayout(node: any): any
    abstract detachChild(parent: any, node: any, release_subtree?: boolean): any
    abstract destroyNode(node: any): any
    abstract updateStyle(node: any, style: any): any
    protected abstract insertChild(parent: any, node: any, child_index: any): any
}
