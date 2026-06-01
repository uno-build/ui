import Renderer from '../Renderer.ts'
import EngineYoga from '../engine/EngineYoga.ts'
import { YOGA_SETTER } from '../style/yoga.ts'

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
        for (const [node, zIndex] of readPaintOrder(nodes)) {
            const div = this.divs.get(node)
            div.style.zIndex = `${zIndex}`
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

function readPaintOrder(nodes) {
    const childrenByParent = new Map()
    const paintOrder = []
    let root = null

    for (const node of nodes) {
        const children = childrenByParent.get(node.parent) ?? []
        children.push(node)
        childrenByParent.set(node.parent, children)
        if (node.parent.parent === null) {
            root = node.parent
        }
    }

    for (const children of childrenByParent.values()) {
        children.sort(compareStackingOrder)
    }

    for (const node of childrenByParent.get(root) ?? []) {
        appendPaintOrder(node, childrenByParent, paintOrder)
    }

    return paintOrder.map((node, zIndex) => [node, zIndex])
}

function appendPaintOrder(node, childrenByParent, paintOrder) {
    paintOrder.push(node)

    for (const child of childrenByParent.get(node) ?? []) {
        appendPaintOrder(child, childrenByParent, paintOrder)
    }
}

function compareStackingOrder(a, b) {
    return readZIndex(a) - readZIndex(b) || readChildIndex(a) - readChildIndex(b)
}

function readZIndex(node) {
    return node.styles.zIndex?.parsed.value ?? 0
}

function readChildIndex(node) {
    return node.path[node.path.length - 1]
}

function createDivFactory() {
    return document.createElement('div')
}
