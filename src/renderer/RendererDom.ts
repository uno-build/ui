import Renderer from '../Renderer.ts'
import EngineDom from '../engine/EngineDom.ts'

export default class RendererDom extends Renderer {
    private canvas
    private engine

    constructor({ canvas }) {
        super()
        this.canvas = canvas
        this.engine = new EngineDom({ canvas })
    }

    public createElement(node) {
        if (node.id === 0) {
            return this.canvas
        }
        const element = document.createElement('div')
        element.id = `node-${node.id}`
        Object.assign(element.style, DEFAULT_NODE_STYLE)
        return element
    }

    protected insertChild(parent, node, childIndex) {
        this.engine.insertChild(parent, node, childIndex)
    }

    public removeChild(parent, node) {
        this.engine.removeChild(parent, node)
    }

    public getChildIndex(node) {
        return this.engine.getChildIndex(node)
    }

    protected updateStyle(node, { name, value }) {
        node.element.style[name] = value
    }

    public getLayout(node) {
        return this.engine.getLayout(node)
    }
}

const DEFAULT_NODE_STYLE = {
    boxSizing: 'border-box',
    display: 'flex',
    minWidth: '0',
    minHeight: '0',
    zIndex: '0',
}
