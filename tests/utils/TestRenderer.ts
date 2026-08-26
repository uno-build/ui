import { loadYoga } from 'yoga-layout/load'
import Renderer from '../../src/core/Renderer'
import createEngine from '../../src/layouter/yoga'

export default class TestRenderer extends Renderer {
    private engine

    public async init() {
        this.engine = await createEngine({ loadYoga })
    }

    public createElement(node) {
        this.engine.createNode(node)
    }

    public destroy(nodes) {
        this.engine.destroy(nodes)
        super.destroy(nodes)
    }

    public getChildIndex(node) {
        return this.engine.getChildIndex(node)
    }

    public initializeTextNode(node) {
        this.engine.setMeasureFunction(node, (...constraints) => this.getTextMeasure(node, ...constraints))
    }

    public invalidateTextNode(node) {
        this.engine.markDirty(node)
    }

    public getTextMeasure() {
        return { width: 0, height: 0 }
    }

    protected insertChild(parent, node, child_index) {
        this.engine.insertChild(parent, node, child_index)
    }

    public detachChild(parent, node) {
        this.engine.detachChild(parent, node)
    }

    public destroyNode(node) {
        this.engine.destroyNode(node)
    }

    protected updateStyle(node, resolved_style) {
        for (const style of resolved_style.expanded) {
            this.engine.applyStyle(node, style)
        }
    }

    public beforeUpdate(nodes) {
        super.beforeUpdate(nodes)
        this.engine.update()
    }

    public getLayout(node) {
        return this.engine.getLayout(node)
    }
}
