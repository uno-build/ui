export function BackendHTML({ canvas }) {
    const ctx = canvas.getContext('2d')
    let container = null

    canvas.onpaint = () => {
        ctx.reset()
        const transform = ctx.drawElementImage(container, 0, 0)
        container.style.transform = transform.toString()
    }

    // Size the canvas grid to match the device scale factor to prevent blurriness.
    const observer = new ResizeObserver(([entry]) => {
        canvas.width = entry.devicePixelContentBoxSize[0].inlineSize
        canvas.height = entry.devicePixelContentBoxSize[0].blockSize
    })
    observer.observe(canvas, { box: 'device-pixel-content-box' })

    const { create, add } = nodeConstructor(canvas)
    return {
        add,
        create: (...args) => {
            const node = create(...args)
            if (container === null) {
                container = node.element
            }
            return node
        },
    }
}

function nodeConstructor(element) {
    function create(props) {
        const element = document.createElement('div')
        element.style.display = 'flex'
        Object.keys(props).forEach((key) => {
            element.style[key] = props[key]
        })
        return nodeConstructor(element)
    }
    function add(node) {
        element.appendChild(node.element)
    }
    return { create, add, element }
}
