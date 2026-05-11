export function BackendHTML({ canvas }) {
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

    return { create, canvas }
}

// function nodeConstructor(element) {
function create(props) {
    const element = document.createElement('div')
    element.style.display = 'flex'
    Object.keys(props).forEach((key) => {
        element.style[key] = props[key]
    })
    return element
}
