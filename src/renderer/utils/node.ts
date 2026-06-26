import { DISPLAY, OVERFLOW } from '../../style/consts.js'

export function getNodeDrawingData(node) {
    const { width, height } = node.layout
    const display = node.styles.display?.parsed.enum || DISPLAY.flex
    const background_color = node.styles.backgroundColor?.parsed.rgba
    const has_background = background_color !== undefined && background_color[3] > 0
    const has_border =
        getNodeBorderWidth(node, 'Top') > 0 ||
        getNodeBorderWidth(node, 'Right') > 0 ||
        getNodeBorderWidth(node, 'Bottom') > 0 ||
        getNodeBorderWidth(node, 'Left') > 0

    const clipping = getAncestorClipping(node)
    const opacity = getNodeOpacity(node)

    const is_drawable =
        width > 0 &&
        height > 0 &&
        display === DISPLAY.flex &&
        opacity > 0 &&
        (clipping === null ||
            (clipping.left + clipping.right < width && clipping.top + clipping.bottom < height)) &&
        (has_background || has_border)

    return {
        is_drawable,
        clipping,
        opacity,
    }
}

export function getNodeOpacity(node) {
    let opacity = 1
    let current_node = node

    while (current_node != null) {
        opacity *= current_node.styles.opacity?.parsed.value ?? 1
        current_node = current_node.parent
    }

    return opacity
}

export function getNodeBorderWidth(node, side) {
    const border_style = node.styles[`border${side}Style`]
    const border_color = node.styles[`border${side}Color`]
    const border_width = node.styles[`border${side}Width`]

    if (border_style?.value !== 'solid' || border_color === undefined) {
        return 0
    }

    return border_width?.parsed.value ?? 0
}

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

    if (clip == null) {
        return null
    }

    const { layout } = node

    if (clip.width <= 0 || clip.height <= 0) {
        return {
            top: 0,
            right: layout.width,
            bottom: layout.height,
            left: 0,
        }
    }

    const top = Math.max(clip.y - layout.y, 0)
    const right = Math.max(layout.x + layout.width - (clip.x + clip.width), 0)
    const bottom = Math.max(layout.y + layout.height - (clip.y + clip.height), 0)
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
