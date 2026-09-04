import { loadYoga } from 'yoga-layout/load'
import Renderer from '../../src/core/Renderer'
import createYogaLayouter from '../../src/layouter/yoga'

export default class TestRenderer extends Renderer {
    private layouter

    public async init() {
        this.layouter = await createYogaLayouter({ loadYoga })
    }

    public createElement(node) {
        this.layouter.createNode(node)
    }

    public destroy(nodes) {
        this.layouter.destroy(nodes)
        super.destroy(nodes)
    }

    public getChildIndex(node) {
        return this.layouter.getChildIndex(node)
    }

    public initializeTextNode(node) {
        this.layouter.setMeasureFunction(node, (...constraints) => this.getTextMeasure(node, ...constraints))
    }

    public invalidateTextNode(node) {
        this.layouter.markDirty(node)
    }

    public getTextMeasure() {
        return { width: 0, height: 0 }
    }

    protected insertChild(parent, node, child_index) {
        this.layouter.insertChild(parent, node, child_index)
    }

    public detachChild(parent, node) {
        this.layouter.detachChild(parent, node)
    }

    public destroyNode(node) {
        this.layouter.destroyNode(node)
    }

    protected updateStyle(node, resolved_style) {
        for (const style of resolved_style.expanded) {
            this.layouter.applyStyle(node, style)
        }
    }

    public beforeUpdate(nodes) {
        super.beforeUpdate(nodes)
        this.layouter.update()
    }

    public getLayout(node) {
        return this.layouter.getLayout(node)
    }
}
