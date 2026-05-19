import Node from '../Node.js'
// import { isProperty, setProperty } from '../properties.js'

export default class NodeDom extends Node {
    public element

    constructor({ element, props, ui }) {
        super({ props, ui })
        this.element = element
        this.applyProperties(props)
    }

    protected getChildIndex() {
        return this.element.children.length
    }

    protected appendChild(child) {
        this.element.appendChild(child.element)
    }

    protected removeChild(child) {
        this.element.removeChild(child.element)
    }

    protected setProperty(key, value) {
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
