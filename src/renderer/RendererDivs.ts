import { loadYoga } from 'yoga-layout/load'
import { YOGA_SETTER } from '../style/yoga.ts'
import Renderer from '../Renderer.ts'

export default class RendererDivs extends Renderer {
    private Yoga
    private yoga_config
    private root_element

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
        if (node.id === 0) {
            this.root_element = element
        }
        return element
    }

    protected afterUpdate() {
        this.root_element.calculateLayout()
    }

    public getChildIndex(node) {
        return node.element.getChildCount()
    }

    protected insertChild(parent, node, childIndex) {
        parent.element.insertChild(node.element, childIndex)
    }

    protected updateStyle(node, style) {
        if (YOGA_SETTER.hasOwnProperty(style.name)) {
            YOGA_SETTER[style.name](node.element, style)
        } else {
            console.warn(`Not supported:`, [style.name, style.value])
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
