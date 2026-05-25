import Node from '../Node.ts'

export default class NodeDom extends Node {
    public element

    constructor({ id, element, styles, ui }) {
        super({ id, styles, ui })
        this.element = element
        Object.keys(styles).forEach((name) => {
            this.setStyle(name, styles[name])
        })
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

    on(type, listener) {
        // this.element.addEventListener(type, listener)
    }

    off(type, listener) {
        // this.element.removeEventListener(type, listener)
    }
}
