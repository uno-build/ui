import Renderer from '../Renderer'
import { calculateLayoutRect, getParentLayout } from '../engine/utils'
import { UNIT } from '../style/consts'

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
            if (style.parsed.unit === UNIT.UNSET) {
                node.element.style.backgroundImage = 'none'
                return
            }

            node.element.style.backgroundImage = `url(${style.value})`
            node.element.style.backgroundSize = 'cover'
            node.element.style.backgroundPosition = 'center'
            node.element.style.backgroundRepeat = 'no-repeat'
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
