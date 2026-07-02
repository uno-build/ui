import Renderer from '../Renderer'
import createEngine, { YOGA_SETTER } from '../engine/yoga'
import { UNIT } from '../style/consts'
import { getAncestorClipping } from './utils/node'

export default class RendererDivs extends Renderer {
    private canvas
    private engine
    private divs = new WeakMap()
    private createDiv

    constructor({ canvas, createDiv = createDivFactory }) {
        super()
        this.canvas = canvas
        this.createDiv = createDiv
    }

    public async init() {
        this.engine = await createEngine()
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
        const div = this.divs.get(node)

        this.engine.removeChild(parent, node)
        this.canvas.removeChild(div)
        this.divs.delete(node)
    }

    protected updateStyle(node, style) {
        const div = this.divs.get(node)
        const is_yoga_style = YOGA_SETTER.hasOwnProperty(style.name)

        if (is_yoga_style) {
            YOGA_SETTER[style.name](node.element, style)
        }
        if (style.name === 'backgroundImage') {
            if (style.parsed.unit === UNIT.UNSET) {
                div.style.backgroundImage = 'none'
                return
            }

            div.style.backgroundImage = toCssBackgroundImage(style.value)
            div.style.backgroundSize = 'cover'
            div.style.backgroundPosition = 'center'
            div.style.backgroundRepeat = 'no-repeat'
            return
        }
        if (!is_yoga_style || MANDATORY_STYLES.includes(style.name)) {
            div.style[style.name] = style.value
        }
    }

    public beforeUpdate(nodes) {
        super.beforeUpdate(nodes)
        this.engine.update()
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
            div.style.clipPath =
                clipping === null
                    ? ''
                    : `inset(${clipping.top}px ${clipping.right}px ${clipping.bottom}px ${clipping.left}px)`
        }
    }

    public getLayout(node) {
        return this.engine.getLayout(node)
    }
}

const DEFAULT_NODE_STYLE = {
    boxSizing: 'border-box',
    position: 'absolute',
    zIndex: '0',
}

const MANDATORY_STYLES = ['borderTopWidth', 'borderLeftWidth', 'borderRightWidth', 'borderBottomWidth']

function createDivFactory() {
    return document.createElement('div')
}

function toCssBackgroundImage(value) {
    return value === UNIT.UNSET ? 'unset' : `url(${JSON.stringify(value)})`
}
