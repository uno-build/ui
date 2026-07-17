import { DISPLAY, OVERFLOW, UNIT } from '../../style/consts'
import { TRANSPARENT_COLOR } from '../webgpu/buffers'

const EMPTY_BOX_SHADOW = [0, 0, 0, 0]

// If null is returned, the node should not be drawn
export function getNodeDrawingData(node) {
    const { x, y, width, height } = getNodeRenderLayout(node)
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
    const has_box_shadow = box_shadow[2] >>> 24 > 0 && (box_shadow[0] !== 0 || box_shadow[1] !== 0)

    if (!has_background && !has_background_image && !has_border && !has_box_shadow) {
        return null
    }

    const opacity = getNodeOpacity(node)
    if (opacity <= 0) {
        return null
    }

    const clip = getAncestorClipping(node)
    const normalized_clipping = clip === null ? [0, 0, 0, 0] : [clip.top, clip.right, clip.bottom, clip.left]
    if (clip !== null && (clip.right <= 0 || clip.bottom <= 0 || clip.left >= width || clip.top >= height)) {
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

export function getNodeRenderLayout(node) {
    let x = node.layout.x
    let y = node.layout.y
    let ancestor = node.parent

    while (ancestor !== null) {
        x -= ancestor.scroll_left
        y -= ancestor.scroll_top
        ancestor = ancestor.parent
    }

    return {
        x,
        y,
        width: node.layout.width,
        height: node.layout.height,
    }
}

export function updateScrollMetrics(root, get_content_size) {
    updateNodeScrollMetrics(root, get_content_size)
}

function updateNodeScrollMetrics(node, get_content_size) {
    const display = node.styles.display?.parsed.enum ?? DISPLAY.flex
    if (display === DISPLAY.none) {
        resetScrollMetrics(node)
        return {
            left: node.layout.x,
            top: node.layout.y,
            right: node.layout.x,
            bottom: node.layout.y,
        }
    }

    const border_left = node.layout.border.left
    const border_right = node.layout.border.right
    const border_top = node.layout.border.top
    const border_bottom = node.layout.border.bottom
    const padding_left = node.layout.padding.left
    const padding_top = node.layout.padding.top
    const padding_right = node.layout.padding.right
    const padding_bottom = node.layout.padding.bottom

    node.client_width = Math.round(Math.max(0, node.layout.width - border_left - border_right))
    node.client_height = Math.round(Math.max(0, node.layout.height - border_top - border_bottom))

    const overflow_rect = {
        left: node.layout.x + border_left,
        top: node.layout.y + border_top,
        right: node.layout.x + border_left + node.client_width,
        bottom: node.layout.y + border_top + node.client_height,
    }
    const content_size = get_content_size(node)
    if (content_size !== null) {
        overflow_rect.right = Math.max(
            overflow_rect.right,
            node.layout.x + border_left + padding_left + content_size.width + padding_right,
        )
        overflow_rect.bottom = Math.max(
            overflow_rect.bottom,
            node.layout.y + border_top + padding_top + content_size.height + padding_bottom,
        )
    }

    for (const child of node.children) {
        const child_overflow = updateNodeScrollMetrics(child, get_content_size)
        const child_display = child.styles.display?.parsed.enum ?? DISPLAY.flex
        if (child_display === DISPLAY.none) {
            continue
        }

        overflow_rect.left = Math.min(overflow_rect.left, child.layout.x)
        overflow_rect.top = Math.min(overflow_rect.top, child.layout.y)
        overflow_rect.right = Math.max(overflow_rect.right, child.layout.x + child.layout.width + padding_right)
        overflow_rect.bottom = Math.max(overflow_rect.bottom, child.layout.y + child.layout.height + padding_bottom)

        const overflow_x = child.styles.overflowX?.parsed.enum ?? OVERFLOW.visible
        const overflow_y = child.styles.overflowY?.parsed.enum ?? OVERFLOW.visible
        if (overflow_x === OVERFLOW.visible) {
            overflow_rect.left = Math.min(overflow_rect.left, child_overflow.left)
            overflow_rect.right = Math.max(overflow_rect.right, child_overflow.right)
        }
        if (overflow_y === OVERFLOW.visible) {
            overflow_rect.top = Math.min(overflow_rect.top, child_overflow.top)
            overflow_rect.bottom = Math.max(overflow_rect.bottom, child_overflow.bottom)
        }
    }

    node.scroll_width = Math.round(
        Math.max(node.client_width, overflow_rect.right - node.layout.x - border_left),
    )
    node.scroll_height = Math.round(
        Math.max(node.client_height, overflow_rect.bottom - node.layout.y - border_top),
    )
    node.scroll_left = Math.max(0, Math.min(node.scroll_left, node.scroll_width - node.client_width))
    node.scroll_top = Math.max(0, Math.min(node.scroll_top, node.scroll_height - node.client_height))

    return overflow_rect
}

function resetScrollMetrics(node) {
    node.client_width = 0
    node.client_height = 0
    node.scroll_width = 0
    node.scroll_height = 0
    node.scroll_left = 0
    node.scroll_top = 0

    for (const child of node.children) {
        resetScrollMetrics(child)
    }
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
    const clip = {
        top: Number.NEGATIVE_INFINITY,
        right: Number.POSITIVE_INFINITY,
        bottom: Number.POSITIVE_INFINITY,
        left: Number.NEGATIVE_INFINITY,
    }
    let has_clip = false
    let scroll_left = 0
    let scroll_top = 0
    let ancestor = node.parent

    while (ancestor !== null) {
        scroll_left += ancestor.scroll_left
        scroll_top += ancestor.scroll_top
        ancestor = ancestor.parent
    }

    const render_x = node.layout.x - scroll_left
    const render_y = node.layout.y - scroll_top
    ancestor = node.parent

    while (ancestor?.parent != null) {
        scroll_left -= ancestor.scroll_left
        scroll_top -= ancestor.scroll_top
        const overflow_x = ancestor.styles.overflowX?.parsed.enum ?? OVERFLOW.visible
        const overflow_y = ancestor.styles.overflowY?.parsed.enum ?? OVERFLOW.visible
        const clip_x = overflow_x === OVERFLOW.hidden || overflow_x === OVERFLOW.scroll
        const clip_y = overflow_y === OVERFLOW.hidden || overflow_y === OVERFLOW.scroll
        if (clip_x || clip_y) {
            const border_left = ancestor.layout.border.left
            const border_right = ancestor.layout.border.right
            const border_top = ancestor.layout.border.top
            const border_bottom = ancestor.layout.border.bottom
            if (clip_x) {
                clip.left = Math.max(clip.left, ancestor.layout.x - scroll_left + border_left)
                clip.right = Math.min(
                    clip.right,
                    ancestor.layout.x - scroll_left + ancestor.layout.width - border_right,
                )
            }
            if (clip_y) {
                clip.top = Math.max(clip.top, ancestor.layout.y - scroll_top + border_top)
                clip.bottom = Math.min(
                    clip.bottom,
                    ancestor.layout.y - scroll_top + ancestor.layout.height - border_bottom,
                )
            }
            has_clip = true
        }
        ancestor = ancestor.parent
    }

    if (!has_clip) {
        return null
    }

    if (clip.right <= clip.left || clip.bottom <= clip.top) {
        return {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        }
    }

    return {
        top: clip.top - render_y,
        right: clip.right - render_x,
        bottom: clip.bottom - render_y,
        left: clip.left - render_x,
    }
}
