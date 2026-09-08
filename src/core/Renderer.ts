export default abstract class Renderer {
    public async init() {}

    public destroy() {}

    public setDevicePixelRatio(device_pixel_ratio) {}

    public setViewport(width, height) {}

    public setRootSize(root_size) {}

    public addChild(parent, node, child_index = this.getChildIndex(parent)) {
        this.insertChild(parent, node, child_index)
    }

    public getPendingOperations() {
        return []
    }

    public prepareLayout(operations, _nodes_created) {
        operations.setUpdateLayout(operations.needCheckLayout())
    }

    public beforeUpdate(_nodes, _operations) {}

    public afterUpdate(_nodes, _operations) {}

    public update(_nodes, _operations) {}

    public draw(options?) {}

    public initializeTextNode(node) {}
    public invalidateTextNode(node) {}

    public abstract createElement(node)
    public abstract getChildIndex(node)
    public abstract getLayout(node)
    public abstract detachChild(parent, node)
    public abstract destroyNode(node)

    public abstract updateStyle(node, style)
    protected abstract insertChild(parent, node, child_index)
}
