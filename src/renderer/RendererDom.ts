import Renderer from '../core/Renderer'
import { calculateLayoutRect, getParentLayout } from '../layouter/utils'
import { KEYWORD } from '../style/consts'

export default class RendererDom extends Renderer {
    private resources
    private elements = new WeakMap()
    private text_elements = new WeakMap()
    private root_node

    constructor({ resources }) {
        super()
        this.resources = resources
    }

    public setRootSize(root_size) {
        document.body.parentElement.style.fontSize = `${root_size}px`
    }

    public createElement(node) {
        let element
        if (node.id === 0) {
            this.root_node = node
            element = this.resources.canvas
        } else {
            element = document.createElement('div')
            element.id = `node-${node.id}`
            Object.assign(element.style, DEFAULT_NODE_STYLE)
        }

        this.elements.set(node, element)
        return element
    }

    public destroy(nodes) {
        for (const node of nodes) {
            const element = this.elements.get(node)

            if (node === this.root_node) {
                if (node.hasTextContent()) {
                    element.textContent = ''
                }
            } else {
                element.remove()
            }

            this.elements.delete(node)
            this.text_elements.delete(node)
        }

        super.destroy(nodes)
        this.root_node = null
        this.resources = null
    }

    protected insertChild(parent, node, child_index) {
        const parent_element = this.elements.get(parent)
        parent_element.insertBefore(this.elements.get(node), parent_element.children[child_index] ?? null)
    }

    public detachChild(parent, node) {
        this.elements.get(parent).removeChild(this.elements.get(node))
    }

    public destroyNode(node) {
        this.elements.get(node).remove()
        this.elements.delete(node)
        this.text_elements.delete(node)
    }

    public getChildIndex(node) {
        return this.elements.get(node).children.length
    }

    public initializeTextNode(node) {
        const element = this.elements.get(node)
        element.style.whiteSpace = 'pre-wrap'
        element.style.overflowWrap = 'anywhere'
    }

    protected updateStyle(node, resolved_style) {
        const element = this.elements.get(node)

        if (resolved_style.name === 'textStroke') {
            element.style.webkitTextStroke = resolved_style.expanded[0].value
            return
        }

        if (resolved_style.name === 'fontFamily') {
            element.style.fontFamily = resolved_style.value
            this.updateTextLineHeight(node)
            return
        }

        if (resolved_style.name === 'lineHeight') {
            this.updateTextLineHeight(node)
            return
        }

        if (resolved_style.name === 'backgroundImage') {
            const style = resolved_style.expanded[0]
            if (style.parsed.kind === KEYWORD.UNSET) {
                element.style.backgroundImage = 'none'
                return
            }

            const image = this.resources.getImage(style.value)
            element.style.backgroundImage = image === undefined ? 'none' : toCssBackgroundImage(image.src)
            element.style.backgroundRepeat = node.styles.backgroundRepeat?.value ?? 'no-repeat'
            return
        }

        if (resolved_style.name === 'backgroundSizeWidth' || resolved_style.name === 'backgroundSizeHeight') {
            element.style.backgroundSize = toCssBackgroundSize(node)
            return
        }

        const default_value = DEFAULT_NODE_STYLE[resolved_style.name]
        const value =
            resolved_style.expanded[0].parsed.kind === KEYWORD.UNSET && default_value !== undefined
                ? default_value
                : resolved_style.value
        element.style[resolved_style.name] = value
    }

    private updateTextLineHeight(node) {
        const element = this.elements.get(node)
        const line_height = node.styles.lineHeight

        if (line_height !== undefined && line_height.parsed.kind !== KEYWORD.UNSET) {
            element.style.lineHeight = line_height.value
            return
        }

        const font = this.resources.getFont(node.styles.fontFamily?.value)
        element.style.lineHeight = font === undefined ? '' : `${font.lineHeight}`
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
        const element = this.elements.get(node)
        element.scrollLeft = node.scrollLeft
        element.scrollTop = node.scrollTop
    }

    private readNodeScroll(node) {
        const element = this.elements.get(node)
        node.scrollLeft = element.scrollLeft
        node.scrollTop = element.scrollTop
        node.scrollWidth = element.scrollWidth
        node.scrollHeight = element.scrollHeight
        node.clientWidth = element.clientWidth
        node.clientHeight = element.clientHeight
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
        //     this.elements.get(node).insertBefore(text_element, this.elements.get(node).firstChild)
        // }

        this.elements.get(node).innerHTML = node.text_content
    }

    // prettier-ignore
    public getLayout(node) {
        const parent = node.parent
        const parent_layout = getParentLayout(node)
        const node_rect = this.elements.get(node).getBoundingClientRect()
        const parent_element = parent === null ? this.resources.canvas : this.elements.get(parent)
        const parent_rect = parent_element.getBoundingClientRect()

        return calculateLayoutRect(
            {
                width: node_rect.width,
                height: node_rect.height,
                left: node_rect.left - parent_rect.left + (parent === null ? 0 : parent_element.scrollLeft),
                top: node_rect.top - parent_rect.top + (parent === null ? 0 : parent_element.scrollTop),
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
