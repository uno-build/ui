export default abstract class Engine {
    public async init() {}

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
    public abstract insertChild(parent, node, childIndex)
    public abstract removeChild(parent, node)
    public abstract updateStyle(node, style)
    public abstract getLayout(node)
}
