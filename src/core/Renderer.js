export default class Renderer {
    async init() {}

    destroy() {}

    setDevicePixelRatio(device_pixel_ratio) {}

    setViewport(width, height) {}

    setRootSize(root_size) {}

    addChild(parent, node, child_index = this.getChildIndex(parent)) {
        this.insertChild(parent, node, child_index)
    }

    prepareLayout(_nodes_created, operations) {
        return operations.needCheckLayout()
    }

    beforeUpdate(_nodes, _operations) {}

    afterUpdate(_nodes, _operations) {}

    update(_nodes, _operations) {}

    draw(options) {}

    initializeTextNode(node) {}
    invalidateTextNode(node) {}
}
