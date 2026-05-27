import Renderer from '../Renderer.ts'

export default class RendererDom extends Renderer {
    private canvas

    constructor({ canvas }) {
        super()
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

    protected insertChild(parent, node) {
        parent.element.appendChild(node.element)
    }

    public getChildIndex(node) {
        return node.element.children.length
    }

    protected updateStyle(node, { name, value }) {
        node.element.style[name] = value
    }

    // public beforeUpdate(nodes) {
    //     super.beforeUpdate(nodes)
    // }

    // public afterUpdate(nodes) {
    //     super.afterUpdate(nodes)
    // }

    // prettier-ignore
    public getLayout(node) {
        const parent = node.parent
        const parent_layout = this.getParentLayout(node)
        const node_rect = node.element.getBoundingClientRect()
        const parent_rect = (parent?.element ?? this.canvas).getBoundingClientRect()

        return this.calculateLayoutRect(
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

const DEFAULT_NODE_STYLE = {
    boxSizing: 'border-box',
    display: 'flex',
    minWidth: '0',
    minHeight: '0',
}
