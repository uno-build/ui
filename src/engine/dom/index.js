export default class UnoUI {
    constructor({ canvas }) {
        const ctx = canvas.getContext('2d')

        this.nodes = new Set()
        this.root = new UnoNode({
            element: canvas,
            props: {},
            ui: this,
        })

        canvas.onpaint = (event) => {
            ctx.reset()
            for (const element of event.changedElements) {
                ctx.drawElementImage(element, 0, 0)
            }
        }
    }

    create(props) {
        const element = document.createElement('div')
        element.style.display = 'flex'
        return new UnoNode({
            element,
            props,
            ui: this,
        })
    }

    update() {
        const nodes = []
        for (const node of this.nodes) {
            const layout = getComputedLayout(node.element)
            if (!deepEqual(layout, node.layout)) {
                nodes.push(node)
            }
            node.layout = layout
        }
        return nodes
    }
}

class UnoNode {
    constructor({ element, props, ui }) {
        this.element = element
        this.parent = undefined
        this.path = []
        this.layout = {}
        this.props = props
        this.zIndex = props.zIndex || 0
        this.ui = ui

        Object.keys(props).forEach((key) => {
            this.setProperty(key, props[key])
        })
    }

    add(child) {
        if (this.ui.nodes.has(child)) {
            throw new Error('child already added')
        }

        const childIndex = this.element.children.length
        child.parent = this
        child.path = [...(this.path || []), childIndex]
        this.ui.nodes.add(child)
        this.element.appendChild(child.element)
    }

    remove(child) {
        this.ui.nodes.delete(child)
        child.parent = undefined
        this.element.removeChild(child.element)
    }

    setProperty(key, value) {
        this.props[key] = value
        this.element.style[key] = value
        if (key === 'zIndex') {
            this.zIndex = value
        }
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
