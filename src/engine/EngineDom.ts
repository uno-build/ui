import Engine from '../Engine.ts'

export default class EngineDom extends Engine {
    private canvas

    constructor({ canvas }) {
        super()
        this.canvas = canvas
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
