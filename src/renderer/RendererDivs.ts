import Renderer from '../Renderer'
import createEngine, { YOGA_SETTER } from '../engine/yoga'
import { KEYWORD } from '../style/consts'
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
            if (style.parsed.unit === KEYWORD.UNSET) {
                div.style.backgroundImage = 'none'
                return
            }

            div.style.backgroundImage = toCssBackgroundImage(style.value)
            div.style.backgroundRepeat = 'no-repeat'
            return
        }
        if (style.name === 'backgroundSizeWidth' || style.name === 'backgroundSizeHeight') {
            div.style.backgroundSize = toCssBackgroundSize(node)
            return
        }
        if (style.name === 'backgroundPositionX' || style.name === 'backgroundPositionY') {
            div.style.backgroundPosition = toCssBackgroundPosition(node)
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
    return value === KEYWORD.UNSET ? 'unset' : `url(${JSON.stringify(value)})`
}

function toCssBackgroundSize(node) {
    const width_style = node.styles.backgroundSizeWidth
    const height_style = node.styles.backgroundSizeHeight
    const width_unset = width_style?.parsed.unit === KEYWORD.UNSET
    const height_unset = height_style?.parsed.unit === KEYWORD.UNSET

    if (width_unset && height_unset) {
        return 'unset'
    }

    if (height_style === undefined) {
        return width_unset ? 'unset' : (width_style?.value ?? '')
    }

    const width = width_unset || width_style === undefined ? 'auto' : width_style.value
    const height = height_unset ? 'auto' : height_style.value

    return `${width} ${height}`
}

function toCssBackgroundPosition(node) {
    const x = node.styles.backgroundPositionX?.value ?? '0px'
    const y = node.styles.backgroundPositionY?.value ?? '0px'

    return `${x} ${y}`
}
