export default function UI({ canvas }) {
    const ctx = canvas.getContext('2d')
    // const draws = new Set()

    canvas.onpaint = (event) => {
        ctx.reset()
        for (const element of event.changedElements) {
            ctx.drawElementImage(element, 0, 0)
        }
    }

    this.nodes = new Set()

    this.root = new Node({
        element: canvas,
        props: {},
        nodes: this.nodes,
    })

    this.create = (props) => {
        const element = document.createElement('div')
        element.style.display = 'flex'
        return new Node({
            element,
            props,
            nodes: this.nodes,
        })
    }

    this.update = () => {
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

    this.render = () => {
        // for (const element of draws) {
        //     console.log('drawing', element)
        //     ctx.drawElementImage(element, 0, 0)
        // }
        // draws.clear()
    }
}

function Node({ element, props, nodes }) {
    this.element = element
    this.parent = undefined
    this.path = []
    this.layout = {}
    this.props = props

    this.add = (child) => {
        if (nodes.has(child)) {
            throw new Error('child already added')
        }

        const childIndex = this.element.children.length
        child.parent = this
        child.path = [...(this.path || []), childIndex]
        nodes.add(child)
        this.element.appendChild(child.element)
    }

    this.remove = (child) => {
        nodes.delete(child)
        child.parent = undefined
        this.element.removeChild(child.element)
    }

    this.setProperty = (key, value) => {
        this.props[key] = value
        this.element.style[key] = value
    }

    this.on = (type, listener) => {
        this.element.addEventListener(type, listener)
    }

    this.off = (type, listener) => {
        this.element.removeEventListener(type, listener)
    }

    Object.keys(props).forEach((key) => {
        this.setProperty(key, props[key])
    })
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
