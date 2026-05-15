import BaseNode from '../node.ts'

export default class UI {
    public nodes = new Set()
    public root

    constructor({ canvas }) {
        if (typeof canvas.getContext === 'function') {
            const ctx = canvas.getContext('2d')
            canvas.onpaint = (event) => {
                ctx.reset()
                for (const element of event.changedElements) {
                    ctx.drawElementImage(element, 0, 0)
                }
            }
        }

        this.root = new Node({
            element: canvas,
            props: {},
            nodes: this.nodes,
        })
    }

    create(props) {
        const element = document.createElement('div')
        element.style.display = 'flex'
        return new Node({
            element,
            props,
            nodes: this.nodes,
        })
    }

    update() {
        const updatedNodes = []
        for (const node of this.nodes) {
            const layout = getComputedLayout(node.element)
            if (!deepEqual(layout, node.layout)) {
                updatedNodes.push(node)
            }
            node.layout = layout
        }
        return updatedNodes
    }
}

class Node extends BaseNode {
    public element

    constructor({ element, props, nodes }) {
        super({ props, nodes })
        this.element = element
        this.applyProperties()
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

function getComputedLayout(element) {
    const rect = element.getBoundingClientRect()
    return {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
    }
}

function deepEqual(obj1, obj2) {
    for (const key in obj1) {
        if (obj1[key] !== obj2[key]) {
            return false
        }
    }
    return true
}
