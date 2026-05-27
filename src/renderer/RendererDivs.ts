import { loadYoga } from 'yoga-layout/load'
import { YOGA_SETTER } from '../style/yoga.ts'
import { UNIT } from '../style/consts.ts'
import Renderer from '../Renderer.ts'

export default class RendererDivs extends Renderer {
    private canvas
    private Yoga
    private yoga_config
    private root_element
    private divs = new WeakMap()

    constructor({ canvas }) {
        super()
        this.canvas = canvas
    }

    public async init() {
        this.Yoga = await loadYoga()
        this.yoga_config = this.Yoga.Config.create()
        this.yoga_config.setUseWebDefaults(true)
        // this.yoga_config.setPointScaleFactor(200)
        this.yoga_config.setExperimentalFeatureEnabled(
            0, // ExperimentalFeature.WebFlexBasis
            true,
        )
    }

    public createElement(node) {
        const element = this.Yoga.Node.create(this.yoga_config)
        const div = document.createElement('div')

        if (node.id === 0) {
            this.root_element = element
        }

        this.divs.set(node, div)
        this.canvas.appendChild(div)
        Object.assign(div.style, DEFAULT_NODE_STYLE)

        return element
    }

    public getChildIndex(node) {
        return node.element.getChildCount()
    }

    protected insertChild(parent, node, childIndex) {
        parent.element.insertChild(node.element, childIndex)
    }

    public removeChild(parent, node) {
        super.removeChild(parent, node)
    }

    protected updateStyle(node, style) {
        const div = this.divs.get(node)

        if (YOGA_SETTER.hasOwnProperty(style.name)) {
            YOGA_SETTER[style.name](node.element, style)
        } else {
            div.style[style.name] = style.value
        }
    }

    public beforeUpdate(nodes) {
        super.beforeUpdate(nodes)
        this.root_element.calculateLayout()
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
    }

    // prettier-ignore
    public getLayout(node) {
        const node_rect = node.element.getComputedLayout()
        const parent_layout = this.getParentLayout(node)
        const parent_rect =
            node.parent.element === this.root_element
                ? { ...parent_layout, ...this.root_element.getComputedLayout() }
                : parent_layout

        return this.calculateLayoutRect(
            this.applyBorderContentOffset(
                node,
                this.applyRowRelativeCrossOffset(node, node_rect),
            ),
            parent_rect,
        )
    }

    private applyRowRelativeCrossOffset(node, rect) {
        if (
            node.styles.position?.value !== 'relative' ||
            node.parent?.styles.flexDirection?.value !== 'row'
        ) {
            return rect
        }

        return {
            ...rect,
            top:
                rect.top +
                readPxOffset(node.styles.top) -
                readPxOffset(node.styles.bottom),
        }
    }

    private applyBorderContentOffset(node, rect) {
        const borderWidth = readPxOffset(node.parent?.styles.borderWidth)

        if (borderWidth === 0) {
            return rect
        }

        return {
            ...rect,
            left:
                rect.left +
                readFlexContentOffset(
                    node.parent?.styles.justifyContent?.value,
                    borderWidth,
                ),
            top:
                rect.top +
                readFlexContentOffset(
                    node.parent?.styles.alignItems?.value,
                    borderWidth,
                ),
        }
    }
}

function readPxOffset(style) {
    return style?.parsed?.unit === UNIT.PX ? style.parsed.value : 0
}

function readFlexContentOffset(alignment, borderWidth) {
    if (alignment === 'flex-end') {
        return -borderWidth
    }

    if (alignment == null || alignment === 'flex-start') {
        return borderWidth
    }

    return 0
}

const DEFAULT_NODE_STYLE = {
    boxSizing: 'border-box',
    position: 'absolute',
}
