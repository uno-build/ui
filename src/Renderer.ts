export default abstract class Renderer {
    protected pending_styles = []

    public async init() {
        // optional hook
    }

    public addPendingStyle(node, style) {
        this.pending_styles.push({ node, style })
    }

    public discardPendingStyles(node) {
        this.pending_styles = this.pending_styles.filter((pending_style) => pending_style.node !== node)
    }

    public imageUpload(src: string, image: any): void {}

    public imageDispose(src: string): void {}

    public imageList(): any[] {
        return []
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

    public update(nodes) {}

    public draw() {}

    public abstract createElement(node)
    public abstract getChildIndex(node)
    public abstract getLayout(node)

    protected abstract updateStyle(node, style)
    protected abstract insertChild(parent, node, childIndex)
}
