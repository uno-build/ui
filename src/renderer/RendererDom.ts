export default class RendererDom {
    private pending_styles = []
    private canvas

    constructor({ canvas }) {
        this.canvas = canvas
    }

    public async init() {
        // nothing to do
    }

    public createElement(node) {
        if (node.id === 0) {
            return this.canvas
        }
        const element = document.createElement('div')
        Object.assign(element.style, DEFAULT_NODE_STYLE)
        return element
    }

    public addPendingStyle(node, style) {
        this.pending_styles.push({ node, style })
    }

    public addChild(parent, node) {
        parent.element.appendChild(node.element)
    }

    public removeChild(parent, node) {
        parent.element.removeChild(node.element)
    }

    public update(nodes) {
        for (const { node, style } of this.pending_styles) {
            this.updateStyle(node, style)
        }
        this.pending_styles.length = 0

        for (const node of nodes) {
            node.layout = this.getLayout(node)
        }
    }

    public getChildIndex(node) {
        return node.element.children.length
    }

    private updateStyle(node, { name, value }) {
        node.element.style[name] = value
    }

    // prettier-ignore
    private getLayout(node) {
        const parent = node.parent
        const parent_layout = parent.parent === null
                ? { x: 0, y: 0 }
                : parent.layout
        const node_rect = node.element.getBoundingClientRect()
        const parent_rect = (parent?.element ?? this.canvas).getBoundingClientRect()

        const width = Math.round(node_rect.width)
        const height = Math.round(node_rect.height)
        const parentWidth = Math.round(parent_rect.width)
        const parentHeight = Math.round(parent_rect.height)
        const left = Math.round(node_rect.left - parent_rect.left)
        const top = Math.round(node_rect.top - parent_rect.top)
        const x = Math.round(parent_layout.x + left)
        const y = Math.round(parent_layout.y + top)
        const centerX = Math.round(left + width / 2 - parentWidth / 2)
        const centerY = Math.round(-(top + height / 2 - parentHeight / 2))

        return {
            width, height,
            left, top,
            x, y,
            centerX, centerY,
        }
    }
}

const DEFAULT_NODE_STYLE = {
    boxSizing: 'border-box',
    display: 'flex',
    minWidth: '0',
    minHeight: '0',
}
