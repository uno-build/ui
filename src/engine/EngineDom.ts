export default class LayoutEngineDom {
    private canvas

    constructor({ canvas }) {
        this.canvas = canvas
    }

    public createElement(node) {
        if (node.id === 0) {
            return this.canvas
        }
        const element = document.createElement('div')
        Object.assign(element.style, DEFAULT_NODE_STYLE)
        return element
    }

    public insertChild(parent, node) {
        parent.element.appendChild(node.element)
    }

    public removeChild(parent, node) {
        parent.element.removeChild(node.element)
    }

    public getChildIndex(node) {
        return node.element.children.length
    }

    public updateStyle(node, { name, value }) {
        node.element.style[name] = value
    }

    // prettier-ignore
    public getLayout(node) {
        const parent = node.parent
        const parent_layout = getParentLayout(node)
        const node_rect = node.element.getBoundingClientRect()
        const parent_rect = (parent?.element ?? this.canvas).getBoundingClientRect()

        return calculateLayoutRect(
            {
                width: node_rect.width,
                height: node_rect.height,
                left: node_rect.left - parent_rect.left,
                top: node_rect.top - parent_rect.top,
            },
            {
                ...parent_layout,
                width: parent_rect.width,
                height: parent_rect.height,
            },
        )
    }
}

function getParentLayout(node) {
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

function calculateLayoutRect(node_rect, parent_rect) {
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

const DEFAULT_NODE_STYLE = {
    boxSizing: 'border-box',
    display: 'flex',
    minWidth: '0',
    minHeight: '0',
}
