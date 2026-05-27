import { loadYoga } from 'yoga-layout/load'
import { YOGA_SETTER } from '../style/yoga.ts'
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
            console.log(style)
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
            console.log(node.path, layout)
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

        return this.calculateLayoutRect(node_rect, parent_rect)
    }
}

const DEFAULT_NODE_STYLE = {
    boxSizing: 'border-box',
    position: 'absolute',
}
