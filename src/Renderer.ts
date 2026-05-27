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

    protected getParentLayout(node) {
        const parent = node.parent

        if (parent === null || parent.parent === null) {
            return {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            }
        }

        return parent.layout
    }

    protected calculateLayoutRect(node_rect, parent_rect) {
        const width = Math.round(node_rect.width)
        const height = Math.round(node_rect.height)
        const left = Math.round(node_rect.left)
        const top = Math.round(node_rect.top)
        const x = Math.round(parent_rect.x + left)
        const y = Math.round(parent_rect.y + top)
        const centerX = Math.round(left + width / 2 - parent_rect.width / 2)
        const centerY = Math.round(-(top + height / 2 - parent_rect.height / 2))

        return {
            width,
            height,
            left,
            top,
            x,
            y,
            centerX,
            centerY,
        }
    }

    public abstract createElement(node)
    public abstract getChildIndex(node)
    public abstract getLayout(node)
    public abstract afterUpdate(nodes)

    protected abstract updateStyle(node, style)
    protected abstract insertChild(parent, node, childIndex)
}
