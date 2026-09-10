import Renderer from '../core/Renderer'
import { OPERATIONS } from '../core/constants'
import { calculateLayoutRect, getParentLayout } from '../layouter/utils'
import { KEYWORD } from '../style/constants'

/**
 * @typedef {import('../core/Node').default<HTMLElement>} DomNode
 * @typedef {import('../core/Operations').default<HTMLElement>} DomOperations
 */

/** @extends {Renderer<unknown, void, HTMLElement, void>} */
export default class RendererDom extends Renderer {
    /** @private */
    resources
    /** @private */
    elements = new WeakMap()
    /** @private */
    element_nodes = new WeakMap()
    /** @private */
    root_node
    /** @private */
    stopObservingFonts

    /** @param {{ resources: import('./dom/ResourcesDom').default }} options */
    constructor({ resources }) {
        super()
        this.resources = resources
    }

    async init() {
        this.stopObservingFonts = this.resources.observeFonts()
    }

    /** @param {Set<DomNode>} nodes_created @param {DomOperations} operations @returns {boolean} */
    prepareLayout(nodes_created, operations) {
        const image = operations.items.some((operation) => operation.op === OPERATIONS.RESOURCE_IMAGE)
        const font = operations.items.some((operation) => operation.op === OPERATIONS.RESOURCE_FONT)

        if (image || font) {
            for (const node of nodes_created) {
                if (image && node.styles.backgroundImage !== undefined) {
                    this.updateBackgroundImage(node, node.styles.backgroundImage)
                }
                if (font) {
                    this.updateTextLineHeight(node)
                }
            }
        }

        return operations.needCheckLayout()
    }

    /** @param {number} root_size */
    setRootSize(root_size) {
        document.body.parentElement.style.fontSize = `${root_size}px`
    }

    /** @override @param {DomNode} node @returns {HTMLElement} */
    createElement(node) {
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
        this.element_nodes.set(element, node)
        return element
    }

    /** @param {DomNode[]} nodes */
    destroy(nodes) {
        this.stopObservingFonts()

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
            this.element_nodes.delete(element)
        }

        super.destroy(nodes)
        this.root_node = null
        this.resources = null
    }

    /**
     * @protected
     * @override
     * @param {DomNode} parent
     * @param {DomNode} node
     * @param {number} child_index
     */
    insertChild(parent, node, child_index) {
        const parent_element = this.elements.get(parent)
        parent_element.insertBefore(this.elements.get(node), parent_element.children[child_index] ?? null)
    }

    /** @override @param {DomNode} parent @param {DomNode} node */
    detachChild(parent, node) {
        this.elements.get(parent).removeChild(this.elements.get(node))
    }

    /** @override @param {DomNode} node */
    destroyNode(node) {
        const element = this.elements.get(node)
        element.remove()
        this.elements.delete(node)
        this.element_nodes.delete(element)
    }

    /** @override @param {DomNode} node @returns {number} */
    getChildIndex(node) {
        return this.elements.get(node).children.length
    }

    /** @param {DomNode} node */
    initializeTextNode(node) {
        const element = this.elements.get(node)
        element.style.whiteSpace = 'pre-wrap'
        element.style.overflowWrap = 'anywhere'
    }

    /** @override @param {DomNode} node @param {import('../style/types').StyleUpdate} resolved_style */
    updateStyle(node, resolved_style) {
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
            this.updateBackgroundImage(node, resolved_style.expanded[0])
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

    /** @private */
    updateBackgroundImage(node, style) {
        const element = this.elements.get(node)
        if (style.parsed.kind === KEYWORD.UNSET) {
            element.style.backgroundImage = 'none'
            return
        }

        const image = this.resources.getImage(style.value)
        element.style.backgroundImage = image === undefined ? 'none' : toCssBackgroundImage(image.src)
        element.style.backgroundRepeat = node.styles.backgroundRepeat?.value ?? 'no-repeat'
    }

    /** @private */
    updateTextLineHeight(node) {
        const element = this.elements.get(node)
        const line_height = node.styles.lineHeight

        if (line_height !== undefined && line_height.parsed.kind !== KEYWORD.UNSET) {
            element.style.lineHeight = line_height.value
            return
        }

        const font = this.resources.getFont(node.styles.fontFamily?.value)
        element.style.lineHeight = font === undefined ? '' : `${font.lineHeight}`
    }

    /** @param {DomNode[]} nodes @param {DomOperations} operations */
    beforeUpdate(nodes, operations) {
        for (const operation of operations.items) {
            if (operation.op === OPERATIONS.TEXT && operation.node.ui !== null) {
                this.elements.get(operation.node).innerHTML = operation.value
            }
        }

        const scroll_nodes =
            operations.needUpdateLayout() || operations.needUpdateScrollMetrics()
                ? nodes
                : operations.scroll_nodes
        for (const node of scroll_nodes) {
            this.applyNodeScroll(node)
        }
    }

    /** @param {DomNode[]} nodes @param {DomOperations} operations */
    afterUpdate(nodes, operations) {
        const read_metrics = operations.needUpdateLayout() || operations.needUpdateScrollMetrics()
        const scroll_nodes = read_metrics ? nodes : operations.scroll_nodes
        for (const node of scroll_nodes) {
            if (this.readNodeScroll(node, read_metrics)) {
                operations.scroll_nodes.add(node)
            }
        }
    }

    /** @private */
    applyNodeScroll(node) {
        const element = this.elements.get(node)
        element.scrollLeft = node.scrollLeft
        element.scrollTop = node.scrollTop
    }

    /** @private */
    readNodeScroll(node, read_metrics) {
        const element = this.elements.get(node)
        const scroll_changed = node.scrollLeft !== element.scrollLeft || node.scrollTop !== element.scrollTop
        node.scroll_left = element.scrollLeft
        node.scroll_top = element.scrollTop
        if (read_metrics) {
            node.scrollWidth = element.scrollWidth
            node.scrollHeight = element.scrollHeight
            node.clientWidth = element.clientWidth
            node.clientHeight = element.clientHeight
        }
        return scroll_changed
    }

    /** @param {HTMLElement} element @returns {DomNode | undefined} */
    syncScroll(element) {
        const node = this.element_nodes.get(element)

        if (node !== undefined) {
            this.readNodeScroll(node, true)
        }

        return node
    }

    /** @param {globalThis.Node | null} element @returns {DomNode | null} */
    getEventNode(element) {
        let current_element = element

        while (current_element != null) {
            const node = this.element_nodes.get(current_element)
            if (node !== undefined) {
                return node
            }
            current_element = current_element.parentNode
        }

        return null
    }

    /** @override @param {DomNode} node @returns {import('../style/types').ComputedLayout} */
    // prettier-ignore
    getLayout(node) {
        const parent = node.parent
        const parent_layout = getParentLayout(node)
        const node_rect = this.elements.get(node).getBoundingClientRect()
        const computed_style = getComputedStyle(this.elements.get(node))
        const parent_element = parent === null ? this.resources.canvas : this.elements.get(parent)
        const parent_rect = parent_element.getBoundingClientRect()

        return {
            ...calculateLayoutRect(
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
            ),
            border: {
                top: parseFloat(computed_style.borderTopWidth),
                right: parseFloat(computed_style.borderRightWidth),
                bottom: parseFloat(computed_style.borderBottomWidth),
                left: parseFloat(computed_style.borderLeftWidth),
            },
        }
    }
}

const DEFAULT_NODE_STYLE = {
    boxSizing: 'border-box',
    color: '#000000',
    display: 'flex',
    minWidth: '0',
    minHeight: '0',
    whiteSpace: 'pre-wrap',
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
