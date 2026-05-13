export default async function UnoUI({ canvas }) {
    const ctx = canvas.getContext('2d')

    canvas.onpaint = (e) => {
        ctx.reset()
        for (const el of e.changedElements) {
            ctx.drawElementImage(el, 0, 0)
        }
    }

    const state = {
        nodes: new Set(),
        root: null,
    }
    state.root = createNode(canvas, {})

    function create(props) {
        const element = document.createElement('div')
        element.style.display = 'flex'
        return createNode(element, props)
    }

    function createNode(element, props) {
        const add = (child) => {
            if (state.nodes.has(child)) {
                throw new Error('child already added')
            }
            const child_index = element.children.length
            child.parent = node
            child.path = [...(node.path || []), child_index]
            state.nodes.add(child)
            element.appendChild(child.element)
        }
        const remove = (child) => {
            state.nodes.delete(child)
            element.removeChild(child.element)
        }
        const setProperty = (key, value) => {
            props[key] = value
            element.style[key] = value
            if (key === 'zIndex') {
                node.zIndex = value
            }
        }
        const on = (type, listener) => {
            element.addEventListener(type, listener)
        }
        const off = (type, listener) => {
            element.removeEventListener(type, listener)
        }

        const node = {
            element,
            parent: undefined,
            zIndex: props.zIndex || 0,
            path: [],
            layout: {},
            props,
            add,
            remove,
            setProperty,
            on,
            off,
        }

        Object.keys(props).forEach((key) => {
            setProperty(key, props[key])
        })

        return node
    }

    function update() {
        const nodes = []
        for (const node of state.nodes) {
            const layout = getComputedLayout(node.element)
            if (!deepEqual(layout, node.layout)) {
                nodes.push(node)
            }
            node.layout = layout
        }
        return nodes
    }

    return {
        root: state.root,
        create,
        update,
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
