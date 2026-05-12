export default async function createHtmlBackend({ canvas }) {
    const ctx = canvas.getContext('2d')

    canvas.onpaint = (e) => {
        ctx.reset()
        for (const el of e.changedElements) {
            ctx.drawElementImage(el, 0, 0)
        }
    }

    // Size the canvas grid to match the device scale factor to prevent blurriness.
    const observer = new ResizeObserver(([entry]) => {
        canvas.width = entry.devicePixelContentBoxSize[0].inlineSize
        canvas.height = entry.devicePixelContentBoxSize[0].blockSize
    })
    observer.observe(canvas, { box: 'device-pixel-content-box' })

    return {
        create,
        root: wrapNode(canvas),
        calculateLayout: () => {},
    }
}

function create(props) {
    const element = document.createElement('div')
    element.style.display = 'flex'
    Object.keys(props).forEach((key) => {
        element.style[key] = props[key]
    })
    return wrapNode(element)
}

function wrapNode(element) {
    return {
        element,
        add: (child) => {
            element.appendChild(child.element)
        },
        remove: (child) => {
            element.removeChild(child.element)
        },
        on: (type, listener) => {
            element.addEventListener(type, listener)
        },
        getParent: () => {
            if (element.parentElement) {
                return wrapNode(element.parentElement)
            }
            return null
        },
        getComputedLayout: () => {
            const rect = element.getBoundingClientRect()
            return {
                left: Math.round(rect.left),
                top: Math.round(rect.top),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
            }
        },
        getPaintIndex: () => {
            if (element.parentElement) {
                return Array.from(element.parentElement.children).indexOf(
                    element,
                )
            }
            return 0
        },
        off: (type, listener) => {
            element.removeEventListener(type, listener)
        },
    }
}
