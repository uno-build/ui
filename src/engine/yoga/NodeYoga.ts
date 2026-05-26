import Node from '../Node.ts'

export default class NodeYoga extends Node {
    public yoga

    constructor({ id, yoga, styles, ui }) {
        super({ id, styles, ui })
        this.yoga = yoga
        Object.keys(styles).forEach((name) => {
            this.setStyle(name, styles[name])
        })
    }

    public on(type, listener) {
        // no-op
    }

    public off(type, listener) {
        // no-op
    }

    protected getChildIndex() {
        return this.yoga.getChildCount()
    }

    protected appendChild(child, child_index) {
        this.yoga.insertChild(child.yoga, child_index)
    }

    protected removeChild(child) {
        this.yoga.removeChild(child.yoga)
    }
}
