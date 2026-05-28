import Renderer from '../Renderer.ts'
import EngineYoga from '../engine/EngineYoga.ts'

export default class RendererDivs extends Renderer {
    private canvas
    private engine
    private divs = new WeakMap()

    constructor({ canvas, createDiv = createDivFactory }) {
        super()
        this.canvas = canvas
        this.engine = new EngineYoga()
        this.createDiv = createDiv
    }

    public async init() {
        await this.engine.init()
    }

    public createElement(node) {
        const element = this.engine.createElement(node)

        let div
        if (node.id === 0) {
            div = this.canvas
        } else {
            div = this.createDiv()
            div.id = `node-${node.id}`
            this.canvas.appendChild(div)
            Object.assign(div.style, DEFAULT_NODE_STYLE)
        }

        this.divs.set(node, div)

        return element
    }

    public getChildIndex(node) {
        return this.engine.getChildIndex(node)
    }

    protected insertChild(parent, node, childIndex) {
        this.engine.insertChild(parent, node, childIndex)
    }

    public removeChild(parent, node) {
        this.engine.removeChild(parent, node)
    }

    protected updateStyle(node, style) {
        const div = this.divs.get(node)

        if (this.engine.updateStyle(node, style) === false) {
            div.style[style.name] = style.value
        }
    }

    public beforeUpdate(nodes) {
        super.beforeUpdate(nodes)
        this.engine.beforeUpdate(nodes)
    }

    public afterUpdate(nodes) {
        super.afterUpdate(nodes)
        for (const node of nodes) {
            const { layout } = node
            const div = this.divs.get(node)
            div.style.left = `${layout.x}px`
            div.style.top = `${layout.y}px`
            div.style.width = `${layout.width}px`
            div.style.height = `${layout.height}px`
        }
    }

    public getLayout(node) {
        return this.engine.getLayout(node)
    }
}

const DEFAULT_NODE_STYLE = {
    boxSizing: 'border-box',
    position: 'absolute',
}

function createDivFactory() {
    return document.createElement('div')
}
