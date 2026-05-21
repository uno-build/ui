import Node from '../Node.ts'

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

    protected setStyle(name, value) {
        const style = super.setStyle(name, value)
        if (style !== undefined) {
            this.element.style[style.name] = style.value
        }
    }

    on(type, listener) {
        this.element.addEventListener(type, listener)
    }

    off(type, listener) {
        this.element.removeEventListener(type, listener)
    }
}
