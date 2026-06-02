import { OVERFLOW } from '../style/consts.ts'

export function getAncestorClipping(node) {
    let clip = null
    let ancestor = node.parent

    while (ancestor?.parent != null) {
        const overflow = ancestor.styles.overflow?.parsed.enum
        if (overflow === OVERFLOW.hidden || overflow === OVERFLOW.scroll) {
            clip = intersectRects(clip, ancestor.layout)
        }
        ancestor = ancestor.parent
    }

    if (clip == null || clip.width <= 0 || clip.height <= 0) {
        return null
    }

    const { layout } = node
    const top = Math.max(clip.y - layout.y, 0)
    const right = Math.max(layout.x + layout.width - (clip.x + clip.width), 0)
    const bottom = Math.max(
        layout.y + layout.height - (clip.y + clip.height),
        0,
    )
    const left = Math.max(clip.x - layout.x, 0)

    return {
        top,
        right,
        bottom,
        left,
    }
}

function intersectRects(a, b) {
    if (a == null) {
        return b
    }

    const x = Math.max(a.x, b.x)
    const y = Math.max(a.y, b.y)
    const right = Math.min(a.x + a.width, b.x + b.width)
    const bottom = Math.min(a.y + a.height, b.y + b.height)

    return {
        x,
        y,
        width: right - x,
        height: bottom - y,
    }
}
