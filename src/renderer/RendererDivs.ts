import { loadYoga } from 'yoga-layout/load'
import { YOGA_SETTER } from '../style/yoga.ts'

export default class RendererDivs {
    private pending_styles = []
    private canvas
    private Yoga
    private yoga_config
    private root_element

    constructor() {}

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

    public addPendingStyle(node, style) {
        this.pending_styles.push({ node, style })
    }

    public addChild(parent, node) {
        const child_index = parent.element.getChildCount()
        parent.element.insertChild(node.element, child_index)
    }

    public removeChild(parent, node) {
        parent.element.removeChild(node.element)
    }

    public update(nodes) {
        for (const { node, style } of this.pending_styles) {
            this.updateStyle(node, style)
        }
        this.pending_styles.length = 0
        this.root_element.calculateLayout()
    }

    public getChildIndex(node) {
        return node.element.getChildCount()
    }

    private updateStyle(node, style) {
        if (YOGA_SETTER.hasOwnProperty(style.name)) {
            YOGA_SETTER[style.name](node.element, style)
        } else {
            console.warn(`Not supported:`, [style.name, style.value])
        }
    }

    // prettier-ignore
    private getLayout(node) {
        const node_rect = node.element.getComputedLayout()
        const parent_rect =
            node.parent.element === this.root_element
                ? { x: 0, y: 0, ...this.root_element.getComputedLayout() }
                : (node.parent?.layout ?? {
                      x: 0,
                      y: 0,
                      width: 0,
                      height: 0,
                  })

        const width = node_rect.width
        const height = node_rect.height
        const left = node_rect.left
        const top = node_rect.top
        const right = node_rect.right
        const bottom = node_rect.bottom

        // x/y and left/top/right/bottom: accumulated 2D coordinates from the root.
        const x = parent_rect.x + left
        const y = parent_rect.y + top

        // Local center coordinates relative to the parent's center,
        // with Y flipped for GPU/3D-style coordinate systems.
        const centerX = Math.round(left + width / 2 - parent_rect.width / 2)
        const centerY = Math.round(
            -(top + height / 2 - parent_rect.height / 2),
        )

        return {
            width,
            height,
            left,
            top,
            x,
            y,
            centerX,
            centerY,
        }
    }
}
