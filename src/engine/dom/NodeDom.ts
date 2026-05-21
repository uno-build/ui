import Node from '../Node.ts'
// import { isProperty, setStyle } from '../properties.ts'

export default class NodeDom extends Node {
    public element

    constructor({ element, styles, ui }) {
        super({ styles, ui })
        this.element = element
        this.applyStyles(styles)
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

    protected setStyle(key, value) {
        this.styles[key] = value
        this.element.style[key] = value
    }

    on(type, listener) {
        this.element.addEventListener(type, listener)
    }

    off(type, listener) {
        this.element.removeEventListener(type, listener)
    }
}
