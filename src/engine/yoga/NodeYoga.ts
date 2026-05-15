import Node from '../Node.js'
import { setYogaProperty, isYogaProperty } from '../properties.js'

export default class YogaNode extends Node {
    public yoga

    constructor({ yoga, props, nodes }) {
        super({ props, nodes })
        this.yoga = yoga
        this.applyProperties(props)
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

    setProperty(key, value) {
        if (isYogaProperty(key)) {
            this.props[key] = value
            setYogaProperty(this.yoga, key, value)
            return
        }
    }

    on(type, listener) {
        // no-op
    }

    off(type, listener) {
        // no-op
    }
}
