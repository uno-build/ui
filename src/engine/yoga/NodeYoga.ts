import Node from '../Node.js'
import { isLayoutProperty, setLayoutProperty } from '../properties.js'

export default class NodeYoga extends Node {
    public yoga

    constructor({ yoga, props, ui }) {
        super({ props, ui })
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

    protected setProperty(key, value) {
        this.props[key] = value
        if (isLayoutProperty(key)) {
            setLayoutProperty(this.yoga, key, value)
        }
    }

    on(type, listener) {
        // no-op
    }

    off(type, listener) {
        // no-op
    }
}
