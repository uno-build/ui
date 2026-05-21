import Node from '../Node.ts'
import Style from '../Style.ts'

export default class NodeYoga extends Node {
    public yoga

    constructor({ yoga, styles, ui }) {
        super({ styles, ui })
        this.yoga = yoga
        this.applyStyles(styles)
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

    protected setStyle(key, value) {
        this.styles[key] = value
        const style = Style.resolveStyle(key, value)
        // const result = setLayoutProperty(this.yoga, key, value)
        // console.log([key, value, result])
    }

    on(type, listener) {
        // no-op
    }

    off(type, listener) {
        // no-op
    }
}
