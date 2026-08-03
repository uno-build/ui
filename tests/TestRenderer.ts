import { loadYoga } from 'yoga-layout/load'
import Renderer from '../src/core/Renderer'
import createEngine from '../src/layouter/yoga'

export default class TestRenderer extends Renderer {
    private engine

    public async init() {
        this.engine = await createEngine({ loadYoga })
    }

    public createElement(node) {
        this.engine.createNode(node)
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

    public removeChild(parent, node) {
        this.engine.removeChild(parent, node)
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
