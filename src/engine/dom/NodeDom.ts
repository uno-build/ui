import Node from '../Node.js'

export default class DOMNode extends Node {
    public element

    constructor({ element, props, nodes }) {
        super({ props, nodes })
        this.element = element
        this.applyProperties(props)
    }

    protected getChildIndex() {
        return this.element.children.length
    }

    protected attachChild(child) {
        this.element.appendChild(child.element)
    }

    protected detachChild(child) {
        this.element.removeChild(child.element)
    }

    setProperty(key, value) {
        this.props[key] = value
        this.element.style[key] = value
    }

    on(type, listener) {
        this.element.addEventListener(type, listener)
    }

    off(type, listener) {
        this.element.removeEventListener(type, listener)
    }
}
