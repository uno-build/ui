import Node from '../Node.js'
import { isLayoutProperty, setLayoutProperty } from '../properties.js'

const POSITION_EDGE_KEYS = ['left', 'top', 'right', 'bottom']

export default class NodeYoga extends Node {
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

    protected setProperty(key, value) {
        this.props[key] = value
        if (key === 'position' || POSITION_EDGE_KEYS.includes(key)) {
            this.applyLayoutProperties()
            return
        }
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

    private applyLayoutProperties() {
        for (const edge of POSITION_EDGE_KEYS) {
            setLayoutProperty(this.yoga, edge, undefined)
        }

        for (const [key, value] of Object.entries(this.props)) {
            if (!isLayoutProperty(key)) {
                continue
            }
            if (
                isRelativePosition(this.props) &&
                POSITION_EDGE_KEYS.includes(key)
            ) {
                continue
            }
            setLayoutProperty(this.yoga, key, value)
        }
    }
}

function isRelativePosition(props) {
    return props.position === 'relative'
}
