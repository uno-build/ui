import { DISPLAY, OVERFLOW, UNIT } from '../../style/consts'
import { TRANSPARENT_COLOR } from '../webgpu/buffers'

const EMPTY_BOX_SHADOW = [0, 0, 0, 0]

// If null is returned, the node should not be drawn
export function getNodeDrawingData(node) {
    const { x, y, width, height } = node.layout
    const display = node.styles.display?.parsed.enum || DISPLAY.flex
    if (width === 0 || height === 0 || display !== DISPLAY.flex) {
        return null
    }

    const background_color = node.styles.backgroundColor?.parsed.rgba
    const has_background = background_color !== undefined && background_color[3] > 0
    const has_background_image = node.styles.backgroundImage !== undefined
    const border_width_top = getNodeBorderWidth(node, 'Top')
    const border_width_right = getNodeBorderWidth(node, 'Right')
    const border_width_bottom = getNodeBorderWidth(node, 'Bottom')
    const border_width_left = getNodeBorderWidth(node, 'Left')
    const has_border =
        border_width_top > 0 || border_width_right > 0 || border_width_bottom > 0 || border_width_left > 0
    const box_shadow = getNodeBoxShadow(node)
    const has_box_shadow = (box_shadow[2] >>> 24) > 0 && (box_shadow[0] !== 0 || box_shadow[1] !== 0)

    if (!has_background && !has_background_image && !has_border && !has_box_shadow) {
        return null
    }

    const opacity = getNodeOpacity(node)
    if (opacity <= 0) {
        return null
    }

    const clip = getAncestorClipping(node)
    const normalized_clipping = clip === null ? [0, 0, 0, 0] : [clip.top, clip.right, clip.bottom, clip.left]
    if (
        clip !== null &&
        (clip.right <= 0 || clip.bottom <= 0 || clip.left >= width || clip.top >= height)
    ) {
        return null
    }

    const border_top_left_radius = getBorderRadius(node.styles.borderTopLeftRadius?.parsed, width, height)
    const border_top_right_radius = getBorderRadius(node.styles.borderTopRightRadius?.parsed, width, height)
    const border_bottom_right_radius = getBorderRadius(node.styles.borderBottomRightRadius?.parsed, width, height)
    const border_bottom_left_radius = getBorderRadius(node.styles.borderBottomLeftRadius?.parsed, width, height)

    return {
        layout: [x, y, width, height],
        clipping: normalized_clipping,
        opacity,
        border_radius_x: [
            border_top_left_radius[0],
            border_top_right_radius[0],
            border_bottom_right_radius[0],
            border_bottom_left_radius[0],
        ],
        border_radius_y: [
            border_top_left_radius[1],
            border_top_right_radius[1],
            border_bottom_right_radius[1],
            border_bottom_left_radius[1],
        ],
        border_color_top: node.styles.borderTopColor?.parsed.rgba ?? TRANSPARENT_COLOR,
        border_color_right: node.styles.borderRightColor?.parsed.rgba ?? TRANSPARENT_COLOR,
        border_color_bottom: node.styles.borderBottomColor?.parsed.rgba ?? TRANSPARENT_COLOR,
        border_color_left: node.styles.borderLeftColor?.parsed.rgba ?? TRANSPARENT_COLOR,
        border_widths: [border_width_top, border_width_right, border_width_bottom, border_width_left],
        background_color: background_color ?? TRANSPARENT_COLOR,
        box_shadow,
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

function getBorderRadius(border_radius, width, height) {
    if (border_radius === undefined) {
        return [0, 0]
    }
    if (border_radius.kind === UNIT.PERCENT) {
        return [(width * border_radius.value) / 100, (height * border_radius.value) / 100]
    }

    return [border_radius.value, border_radius.value]
}

function getNodeBoxShadow(node) {
    const box_shadow = node.styles.boxShadow?.parsed.box_shadow
    if (box_shadow === undefined || box_shadow.color[3] === 0) {
        return EMPTY_BOX_SHADOW
    }

    return [
        packSigned16Pair(box_shadow.offset_x, box_shadow.offset_y),
        packSigned16Pair(box_shadow.blur, box_shadow.spread),
        packColor(box_shadow.color),
        0,
    ]
}

function packSigned16Pair(first, second) {
    return (packSigned16(first) | (packSigned16(second) << 16)) >>> 0
}

function packSigned16(value) {
    return Math.max(-32768, Math.min(32767, Math.round(value))) & 0xffff
}

function packColor(color) {
    return ((color[0] & 255) | ((color[1] & 255) << 8) | ((color[2] & 255) << 16) | ((color[3] & 255) << 24)) >>> 0
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
            right: 0,
            bottom: 0,
            left: 0,
        }
    }

    const top = clip.y - layout.y
    const right = clip.x + clip.width - layout.x
    const bottom = clip.y + clip.height - layout.y
    const left = clip.x - layout.x

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
