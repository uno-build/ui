import Renderer from '../Renderer.ts'
import { createYogaLayout } from '../layout/yoga.ts'
import { YOGA_SETTER } from '../style/yoga.ts'

export default class RendererDivs extends Renderer {
    private canvas
    private layout
    private divs = new WeakMap()

    constructor({ canvas, createDiv = createDivFactory }) {
        super()
        this.canvas = canvas
        this.createDiv = createDiv
    }

    public async init() {
        this.layout = await createYogaLayout()
    }

    public createElement(node) {
        const element = this.layout.createElement(node)

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
        return this.layout.getChildIndex(node)
    }

    protected insertChild(parent, node, childIndex) {
        this.layout.insertChild(parent, node, childIndex)
    }

    public removeChild(parent, node) {
        this.layout.removeChild(parent, node)
        this.canvas.removeChild(this.divs.get(node))
    }

    protected updateStyle(node, style) {
        const MANDATORY = ['borderWidth']
        const div = this.divs.get(node)
        const is_yoga_style = YOGA_SETTER.hasOwnProperty(style.name)

        if (is_yoga_style) {
            YOGA_SETTER[style.name](node.element, style)
        }
        if (!is_yoga_style || MANDATORY.includes(style.name)) {
            div.style[style.name] = style.value
        }
    }

    public beforeUpdate(nodes) {
        super.beforeUpdate(nodes)
        this.layout.update()
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
            div.style.zIndex = `${node.order}`
        }
    }

    public getLayout(node) {
        return this.layout.getLayout(node)
    }
}

const DEFAULT_NODE_STYLE = {
    boxSizing: 'border-box',
    position: 'absolute',
    zIndex: '0',
}

function createDivFactory() {
    return document.createElement('div')
}
