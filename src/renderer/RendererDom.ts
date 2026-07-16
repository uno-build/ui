import Renderer from '../Renderer'
import { calculateLayoutRect, getParentLayout } from '../layouter/utils'
import { KEYWORD } from '../style/consts'

export default class RendererDom extends Renderer {
    private canvas
    private fonts = new Map()
    private text_elements = new WeakMap()
    private root_node

    constructor({ canvas }) {
        super()
        this.canvas = canvas
    }

    public createElement(node) {
        if (node.id === 0) {
            this.root_node = node
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

    public initializeTextNode(node) {
        node.element.style.whiteSpace = 'pre-wrap'
        node.element.style.overflowWrap = 'anywhere'
    }

    public fontRegister(name: string, image: any, json: any): void {
        this.fonts.set(name, json.metrics)
    }

    protected updateStyle(node, resolved_style) {
        if (resolved_style.name === 'textStroke') {
            node.element.style.webkitTextStroke = resolved_style.expanded[0].value
            return
        }

        if (resolved_style.name === 'fontFamily') {
            const font = this.fonts.get(resolved_style.value)
            node.element.style.fontFamily = resolved_style.value
            return
        }

        if (resolved_style.name === 'backgroundImage') {
            const style = resolved_style.expanded[0]
            if (style.parsed.kind === KEYWORD.UNSET) {
                node.element.style.backgroundImage = 'none'
                return
            }

            node.element.style.backgroundImage = toCssBackgroundImage(style.value)
            node.element.style.backgroundRepeat = node.styles.backgroundRepeat?.value ?? 'no-repeat'
            return
        }

        if (resolved_style.name === 'backgroundSizeWidth' || resolved_style.name === 'backgroundSizeHeight') {
            node.element.style.backgroundSize = toCssBackgroundSize(node)
            return
        }

        node.element.style[resolved_style.name] = resolved_style.value
    }

    public beforeUpdate(nodes) {
        super.beforeUpdate(nodes)

        for (const node of nodes) {
            this.updateText(node)
        }

        this.applyNodeScroll(this.root_node)
        for (const node of nodes) {
            this.applyNodeScroll(node)
        }
    }

    public afterUpdate(nodes) {
        super.afterUpdate(nodes)
        this.readNodeScroll(this.root_node)

        for (const node of nodes) {
            this.readNodeScroll(node)
        }
    }

    private applyNodeScroll(node) {
        const { element } = node
        element.scrollLeft = node.scroll_left
        element.scrollTop = node.scroll_top
    }

    private readNodeScroll(node) {
        const { element } = node
        node.scroll_left = element.scrollLeft
        node.scroll_top = element.scrollTop
        node.scroll_width = element.scrollWidth
        node.scroll_height = element.scrollHeight
        node.client_width = element.clientWidth
        node.client_height = element.clientHeight
    }

    private updateText(node) {
        let text_element = this.text_elements.get(node)

        if (!node.hasTextContent()) {
            text_element?.remove()
            this.text_elements.delete(node)
            return
        }

        // if (text_element === undefined) {
        //     text_element = document.createElement('span')
        //     this.text_elements.set(node, text_element)
        //     node.element.insertBefore(text_element, node.element.firstChild)
        // }

        node.element.innerHTML = node.text_content
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
                left: node_rect.left - parent_rect.left + (parent?.element.scrollLeft ?? 0),
                top: node_rect.top - parent_rect.top + (parent?.element.scrollTop ?? 0),
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
    color: '#000000',
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
    const width_mode = width_style?.parsed.enum !== undefined
    const height_mode = height_style?.parsed.enum !== undefined

    if (width_unset && height_unset) {
        return 'unset'
    }

    if (width_mode || height_mode) {
        return width_mode ? width_style.value : height_style.value
    }

    if (height_style === undefined) {
        return width_unset ? 'unset' : (width_style?.value ?? '')
    }

    const width = width_unset || width_style === undefined ? 'auto' : width_style.value
    const height = height_unset ? 'auto' : height_style.value

    return `${width} ${height}`
}
