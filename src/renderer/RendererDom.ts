export default class RendererDom {
    pending_styles = []

    constructor({ canvas }) {
        this.canvas = canvas
    }

    async init() {
        // nothing to do
    }

    createElement(node) {
        if (node.id === 0) {
            return this.canvas
        }

        const element = document.createElement('div')
        Object.assign(element.style, DEFAULT_NODE_STYLE)
        return element
    }

    addPendingStyle(node, style) {
        this.pending_styles.push({ node, style })
    }

    updateStyle(node, name, value) {
        node.element.style[name] = value
    }

    addChild(parent, child) {
        parent.element.appendChild(child.element)
    }

    removeChild(parent, child) {
        parent.element.removeChild(child.element)
    }

    getChildIndex(node) {
        return node.element.children.length
    }

    update(nodes) {
        for (const { node, style } of this.pending_styles) {
            this.updateStyle(node, style.name, style.value)
        }
        this.pending_styles.length = 0

        for (const node of nodes) {
            node.layout = this.getLayout(node)
        }
    }

    getLayout(node) {
        const parent = node.parent
        const parentLayout =
            parent == null || parent.parent == null
                ? { x: 0, y: 0 }
                : (parent.layout ?? { x: 0, y: 0 })

        const rect = node.element.getBoundingClientRect()
        const parentRect = (
            parent?.element ?? this.canvas
        ).getBoundingClientRect()
        const width = Math.round(rect.width)
        const height = Math.round(rect.height)
        const parentWidth = Math.round(parentRect.width)
        const parentHeight = Math.round(parentRect.height)
        const left = Math.round(rect.left - parentRect.left)
        const top = Math.round(rect.top - parentRect.top)
        const x = Math.round(parentLayout.x + left)
        const y = Math.round(parentLayout.y + top)
        const centerX = Math.round(left + width / 2 - parentWidth / 2)
        const centerY = Math.round(-(top + height / 2 - parentHeight / 2))

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
}

const DEFAULT_NODE_STYLE = {
    boxSizing: 'border-box',
    display: 'flex',
    minWidth: '0',
    minHeight: '0',
}
