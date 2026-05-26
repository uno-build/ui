class RendererDom {
    constructor({ canvas }) {
        this.canvas = canvas
    }

    createElement(node) {
        const element = node.id === 0 ? this.canvas : createFakeElement() // document.createElement('div')
        return element
    }

    setStyle(element, name, value) {
        element.style[name] = value
    }

    appendChild(parent, child) {
        parent.appendChild(child)
    }

    removeChild(parent, child) {
        parent.removeChild(child)
    }

    getLayout(node) {
        // Get layout for node
    }
}

class UI {
    nodes = new Map()
    node_id = 0
    renderer = null
    root = null

    constructor({ renderer }) {
        this.renderer = renderer
    }

    async init() {
        this.root = this.create()
    }

    create(styles = {}) {
        const node = new Node({
            id: this.getNextNodeId(),
            styles,
            ui: this,
        })

        const element = this.renderer.createElement(node)
        this.nodes.set(node, element)


        Object.keys(styles).forEach((name) => {
            this.setStyle(node, name, styles[name])
        })

        return node
    }

    update(node, styles) {
        // Update styles
    }

    // Private
    setStyle(node, name, value) {
        const element = this.nodes.get(node)
        this.renderer.setStyle(element, name, value)
    }

    appendChild(node, child) {
        const element_parent = this.nodes.get(node)
        const element_child = this.nodes.get(child)
        this.renderer.appendChild(element_parent, element_child)
    }

    removeChild(node, child) {
        const element_parent = this.nodes.get(node)
        const element_child = this.nodes.get(child)
        this.renderer.removeChild(element_parent, element_child)
    }

    getNextNodeId() {
        return this.node_id++
    }
}

class Node {
    constructor({ id, styles, ui }) {
        this.id = id
        this.styles = styles
        this.ui = ui
    }

    setStyle(name, value) {
        this.ui.setStyle(this, name, value)
    }

    add(child) {
        this.ui.appendChild(this, child)
    }

    remove(child) {
        this.ui.removeChild(this, child)
    }
}

const canvas = createFakeElement() //document.getElementById('mycanvas')
const renderer = new RendererDom({ canvas })
const ui = new UI({ renderer })
await ui.init()

const container = ui.create()
const button = ui.create()
ui.root.add(container)
container.add(button)

console.log(ui.nodes)



function createFakeElement() {
    return {
        appendChild(child) {
            console.log('appendChild', child)
        },
        removeChild(child) {
            console.log('removeChild', child)
        },
        style: {},
    }
}