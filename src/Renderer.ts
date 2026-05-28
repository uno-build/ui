export default abstract class Renderer {
    protected pending_styles = []

    public async init() {
        // optional hook
    }

    public addPendingStyle(node, style) {
        this.pending_styles.push({ node, style })
    }

    public addChild(parent, node) {
        this.insertChild(parent, node, this.getChildIndex(parent))
    }

    public removeChild(parent, node) {
        parent.element.removeChild(node.element)
    }

    public beforeUpdate(nodes) {
        for (const { node, style } of this.pending_styles) {
            this.updateStyle(node, style)
        }
    }

    public afterUpdate(nodes) {
        this.pending_styles.length = 0
    }

    public abstract createElement(node)
    public abstract getChildIndex(node)
    public abstract getLayout(node)

    protected abstract updateStyle(node, style)
    protected abstract insertChild(parent, node, childIndex)
}
