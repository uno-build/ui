import Renderer from '../Renderer.ts'
import { createYogaLayout } from '../layout/yoga.ts'
import { YOGA_SETTER } from '../style/yoga.ts'
import { getAncestorClipping } from '../utils/getAncestorClipping.ts'

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
        const div = this.divs.get(node)
        const is_yoga_style = YOGA_SETTER.hasOwnProperty(style.name)

        if (is_yoga_style) {
            YOGA_SETTER[style.name](node.element, style)
        }
        if (!is_yoga_style || MANDATORY_STYLES.includes(style.name)) {
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
            const clipping = getAncestorClipping(node)
            div.style.left = `${layout.x}px`
            div.style.top = `${layout.y}px`
            div.style.width = `${layout.width}px`
            div.style.height = `${layout.height}px`
            div.style.zIndex = `${node.order}`
            if (clipping !== null) {
                div.style.clipPath = `inset(${clipping.top}px ${clipping.right}px ${clipping.bottom}px ${clipping.left}px)`
            }
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

const MANDATORY_STYLES = ['borderWidth']

function createDivFactory() {
    return document.createElement('div')
}
