export default abstract class Renderer {
    protected pending_styles = []

    public async init() {}

    public setDevicePixelRatio(device_pixel_ratio) {}

    public setViewport(width, height) {}

    public setRootSize(root_size) {}

    public addPendingStyle(node, style) {
        this.pending_styles.push({ node, style })
    }

    public discardPendingStyles(node, names?) {
        this.pending_styles = this.pending_styles.filter(
            (pending_style) =>
                pending_style.node !== node ||
                (names !== undefined && names.includes(pending_style.style.name) === false),
        )
    }

    public addChild(parent, node) {
        this.insertChild(parent, node, this.getChildIndex(parent))
    }

    public beforeUpdate(nodes) {
        for (const { node, style } of this.pending_styles) {
            this.updateStyle(node, style)
        }
    }

    public afterUpdate(nodes) {
        this.pending_styles.length = 0
    }

    public update(nodes) {}

    public draw(options?) {}

    public initializeTextNode(node) {}
    public invalidateTextNode(node) {}

    public abstract createElement(node)
    public abstract getChildIndex(node)
    public abstract getLayout(node)
    public abstract removeChild(parent, node)

    protected abstract updateStyle(node, style)
    protected abstract insertChild(parent, node, childIndex)
}
