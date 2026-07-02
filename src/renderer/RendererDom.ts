import Renderer from '../Renderer'
import { calculateLayoutRect, getParentLayout } from '../engine/utils'
import { KEYWORD } from '../style/consts'

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
        element.id = `node-${node.id}`
        Object.assign(element.style, DEFAULT_NODE_STYLE)
        return element
    }

    protected insertChild(parent, node, childIndex) {
        parent.element.appendChild(node.element)
    }

    public removeChild(parent, node) {
        parent.element.removeChild(node.element)
    }

    public getChildIndex(node) {
        return node.element.children.length
    }

    protected updateStyle(node, style) {
        if (style.name === 'backgroundImage') {
            if (style.parsed.kind === KEYWORD.UNSET) {
                node.element.style.backgroundImage = 'none'
                return
            }

            node.element.style.backgroundImage = toCssBackgroundImage(style.value)
            node.element.style.backgroundRepeat = 'no-repeat'
            return
        }
        if (style.name === 'backgroundSizeWidth' || style.name === 'backgroundSizeHeight') {
            node.element.style.backgroundSize = toCssBackgroundSize(node)
            return
        }
        if (style.name === 'backgroundPositionX' || style.name === 'backgroundPositionY') {
            node.element.style.backgroundPosition = toCssBackgroundPosition(node)
            return
        }

        node.element.style[style.name] = style.value
    }

    // prettier-ignore
    public getLayout(node) {
        const parent = node.parent
        const parent_layout = getParentLayout(node)
        const node_rect = node.element.getBoundingClientRect()
        const parent_rect = (parent?.element ?? this.canvas).getBoundingClientRect()

        return calculateLayoutRect(
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
    zIndex: '0',
}

function toCssBackgroundImage(value) {
    return `url(${JSON.stringify(value)})`
}

function toCssBackgroundSize(node) {
    const width_style = node.styles.backgroundSizeWidth
    const height_style = node.styles.backgroundSizeHeight
    const width_unset = width_style?.parsed.kind === KEYWORD.UNSET
    const height_unset = height_style?.parsed.kind === KEYWORD.UNSET

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
