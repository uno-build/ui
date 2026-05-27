import Renderer from '../Renderer.ts'
import EngineDom from '../engine/EngineDom.ts'

export default class RendererDom extends Renderer {
    private engine

    constructor({ canvas }) {
        super()
        this.engine = new EngineDom({ canvas })
    }

    public createElement(node) {
        return this.engine.createElement(node)
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

    protected updateStyle(node, style) {
        this.engine.updateStyle(node, style)
    }

    public getLayout(node) {
        return this.engine.getLayout(node)
    }
}
