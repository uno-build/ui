export default function UI({ canvas }) {
    const self = {}

    if (typeof canvas.getContext === 'function') {
        const ctx = canvas.getContext('2d')
        canvas.onpaint = (event) => {
            ctx.reset()
            for (const element of event.changedElements) {
                ctx.drawElementImage(element, 0, 0)
            }
        }
    }

    self.nodes = new Set()

    self.root = new Node({
        element: canvas,
        props: {},
        nodes: self.nodes,
    })

    self.init = async () => {}

    self.create = (props) => {
        const element = document.createElement('div')
        element.style.display = 'flex'
        return Node({
            element,
            props,
            nodes: self.nodes,
        })
    }

    self.update = () => {
        const updatedNodes = []
        for (const node of self.nodes) {
            const layout = getComputedLayout(node.element)
            if (!deepEqual(layout, node.layout)) {
                updatedNodes.push(node)
            }
            node.layout = layout
        }
        return updatedNodes
    }

    self.render = () => {
        // for (const element of draws) {
        //     console.log('drawing', element)
        //     ctx.drawElementImage(element, 0, 0)
        // }
        // draws.clear()
    }

    return self
}

function Node({ element, props, nodes }) {
    const self = {}
    self.element = element
    self.parent = undefined
    self.path = []
    self.layout = {}
    self.props = props

    self.add = (child) => {
        if (nodes.has(child)) {
            throw new Error('child already added')
        }

        const childIndex = self.element.children.length
        child.parent = this
        child.path = [...(self.path || []), childIndex]
        nodes.add(child)
        self.element.appendChild(child.element)
    }

    self.remove = (child) => {
        nodes.delete(child)
        child.parent = undefined
        self.element.removeChild(child.element)
    }

    self.setProperty = (key, value) => {
        self.props[key] = value
        self.element.style[key] = value
    }

    self.on = (type, listener) => {
        self.element.addEventListener(type, listener)
    }

    self.off = (type, listener) => {
        self.element.removeEventListener(type, listener)
    }

    Object.keys(props).forEach((key) => {
        self.setProperty(key, props[key])
    })

    return self
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
