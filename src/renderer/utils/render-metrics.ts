import {
    BACKGROUND_REPEAT,
    BACKGROUND_SIZE,
    DISPLAY,
    FLEX_DIRECTION,
    KEYWORD,
    OVERFLOW,
    UNIT,
} from '../../style/consts'
import { TRANSPARENT_COLOR } from '../webgpu/buffers'

const EMPTY_BOX_SHADOW = [0, 0, 0, 0]
const EMPTY_BORDER_WIDTHS = [0, 0, 0, 0]
const EMPTY_BORDER_RADIUS = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
]

export const FEATURES = {
    panel: true,
    background_image: true,
    border: true,
    border_radius: true,
    box_shadow: true,
    text: true,
    text_shadow: true,
    text_stroke: true,
}

// If null is returned, the node should not be drawn
export function getNodeDrawingData(node, computeStyleValue) {
    const { x, y, width, height } = getNodeRenderLayout(node)
    const display = node.styles.display?.parsed.enum || DISPLAY.flex
    if (width === 0 || height === 0 || display !== DISPLAY.flex) {
        return null
    }

    const background_color = node.styles.backgroundColor?.parsed.rgba
    const has_background = FEATURES.panel && background_color !== undefined && background_color[3] > 0
    const has_background_image = FEATURES.background_image && node.styles.backgroundImage !== undefined
    const border_width_top = getNodeBorderWidth(node, 'Top', computeStyleValue)
    const border_width_right = getNodeBorderWidth(node, 'Right', computeStyleValue)
    const border_width_bottom = getNodeBorderWidth(node, 'Bottom', computeStyleValue)
    const border_width_left = getNodeBorderWidth(node, 'Left', computeStyleValue)
    const has_border =
        FEATURES.border &&
        (border_width_top > 0 || border_width_right > 0 || border_width_bottom > 0 || border_width_left > 0)
    const box_shadow = FEATURES.box_shadow ? getNodeBoxShadow(node, computeStyleValue) : EMPTY_BOX_SHADOW
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

    const [border_radius_x, border_radius_y] = FEATURES.border_radius
        ? getNodeBorderRadius(node, computeStyleValue, width, height)
        : EMPTY_BORDER_RADIUS

    return {
        layout: [x, y, width, height],
        clipping: normalized_clipping,
        opacity,
        border_radius_x,
        border_radius_y,
        border_color_top: node.styles.borderTopColor?.parsed.rgba ?? TRANSPARENT_COLOR,
        border_color_right: node.styles.borderRightColor?.parsed.rgba ?? TRANSPARENT_COLOR,
        border_color_bottom: node.styles.borderBottomColor?.parsed.rgba ?? TRANSPARENT_COLOR,
        border_color_left: node.styles.borderLeftColor?.parsed.rgba ?? TRANSPARENT_COLOR,
        border_widths: has_border
            ? [border_width_top, border_width_right, border_width_bottom, border_width_left]
            : EMPTY_BORDER_WIDTHS,
        background_color: has_background ? background_color : TRANSPARENT_COLOR,
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

export function getNodeBorderWidth(node, side, computeStyleValue) {
    const border_style = node.styles[`border${side}Style`]
    const border_color = node.styles[`border${side}Color`]
    const border_width = computeStyleValue(node.styles[`border${side}Width`])

    if (border_style?.value !== 'solid' || border_color?.parsed.rgba === undefined) {
        return 0
    }

    return border_width?.parsed.value ?? 0
}

export function getNodeRenderLayout(node) {
    let x = node.layout.x
    let y = node.layout.y
    let ancestor = node.parent

    while (ancestor !== null) {
        x -= ancestor.scrollLeft
        y -= ancestor.scrollTop
        ancestor = ancestor.parent
    }

    return {
        x,
        y,
        width: node.layout.width,
        height: node.layout.height,
    }
}

export function updateScrollMetrics(node, get_content_size, scroll_nodes) {
    const display = node.styles.display?.parsed.enum ?? DISPLAY.flex
    if (display === DISPLAY.none) {
        resetScrollMetrics(node, scroll_nodes)
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
    const previous_scroll_left = node.scrollLeft
    const previous_scroll_top = node.scrollTop

    node.clientWidth = Math.round(Math.max(0, node.layout.width - border_left - border_right))
    node.clientHeight = Math.round(Math.max(0, node.layout.height - border_top - border_bottom))

    const overflow_rect = {
        left: node.layout.x + border_left,
        top: node.layout.y + border_top,
        right: node.layout.x + border_left + node.clientWidth,
        bottom: node.layout.y + border_top + node.clientHeight,
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
        const child_overflow = updateScrollMetrics(child, get_content_size, scroll_nodes)
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

    node.scroll_width = Math.round(Math.max(node.clientWidth, overflow_rect.right - node.layout.x - border_left))
    node.scroll_height = Math.round(Math.max(node.clientHeight, overflow_rect.bottom - node.layout.y - border_top))
    node.scroll_left = Math.max(0, Math.min(node.scrollLeft, node.scrollWidth - node.clientWidth))
    node.scroll_top = Math.max(0, Math.min(node.scrollTop, node.scrollHeight - node.clientHeight))
    if (node.scrollLeft !== previous_scroll_left || node.scrollTop !== previous_scroll_top) {
        scroll_nodes.add(node)
    }

    return overflow_rect
}

function resetScrollMetrics(node, scroll_nodes) {
    if (node.scrollLeft !== 0 || node.scrollTop !== 0) {
        scroll_nodes.add(node)
    }
    node.clientWidth = 0
    node.clientHeight = 0
    node.scroll_width = 0
    node.scroll_height = 0
    node.scroll_left = 0
    node.scroll_top = 0

    for (const child of node.children) {
        resetScrollMetrics(child, scroll_nodes)
    }
}

function getNodeBorderRadius(node, computeStyleValue, width, height) {
    const top_left = getBorderRadius(computeStyleValue(node.styles.borderTopLeftRadius)?.parsed, width, height)
    const top_right = getBorderRadius(computeStyleValue(node.styles.borderTopRightRadius)?.parsed, width, height)
    const bottom_right = getBorderRadius(computeStyleValue(node.styles.borderBottomRightRadius)?.parsed, width, height)
    const bottom_left = getBorderRadius(computeStyleValue(node.styles.borderBottomLeftRadius)?.parsed, width, height)

    return [
        [top_left[0], top_right[0], bottom_right[0], bottom_left[0]],
        [top_left[1], top_right[1], bottom_right[1], bottom_left[1]],
    ]
}

function getBorderRadius(border_radius, width, height) {
    if (border_radius === undefined || border_radius.kind === KEYWORD.UNSET) {
        return [0, 0]
    }
    if (border_radius.kind === UNIT.PERCENT) {
        return [(width * border_radius.value) / 100, (height * border_radius.value) / 100]
    }

    return [border_radius.value, border_radius.value]
}

function getNodeBoxShadow(node, computeStyleValue) {
    const box_shadow = computeStyleValue(node.styles.boxShadow)?.parsed.box_shadow
    if (box_shadow === undefined || box_shadow.color[3] === 0) {
        return EMPTY_BOX_SHADOW
    }

    return [
        packSigned16Pair(box_shadow.offset_x.value, box_shadow.offset_y.value),
        packSigned16Pair(box_shadow.blur.value, box_shadow.spread.value),
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
    let scrollLeft = 0
    let scrollTop = 0
    let ancestor = node.parent

    while (ancestor !== null) {
        scrollLeft += ancestor.scrollLeft
        scrollTop += ancestor.scrollTop
        ancestor = ancestor.parent
    }

    const render_x = node.layout.x - scrollLeft
    const render_y = node.layout.y - scrollTop
    ancestor = node.parent

    while (ancestor !== null) {
        scrollLeft -= ancestor.scrollLeft
        scrollTop -= ancestor.scrollTop
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
                clip.left = Math.max(clip.left, ancestor.layout.x - scrollLeft + border_left)
                clip.right = Math.min(clip.right, ancestor.layout.x - scrollLeft + ancestor.layout.width - border_right)
            }
            if (clip_y) {
                clip.top = Math.max(clip.top, ancestor.layout.y - scrollTop + border_top)
                clip.bottom = Math.min(
                    clip.bottom,
                    ancestor.layout.y - scrollTop + ancestor.layout.height - border_bottom,
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

export function getBackgroundImageRect(node, image_size, computeStyleValue, border_widths) {
    const [image_width, image_height] = image_size
    const [background_width, background_height] = getBackgroundAreaSize(node, border_widths)
    const width_style = computeStyleValue(node.styles.backgroundSizeWidth)
    const height_style = computeStyleValue(node.styles.backgroundSizeHeight)
    const background_size_mode = width_style?.parsed.enum ?? height_style?.parsed.enum
    let width
    let height

    if (background_size_mode === BACKGROUND_SIZE.cover || background_size_mode === BACKGROUND_SIZE.contain) {
        const scale =
            background_size_mode === BACKGROUND_SIZE.cover
                ? Math.max(background_width / image_width, background_height / image_height)
                : Math.min(background_width / image_width, background_height / image_height)

        width = image_width * scale
        height = image_height * scale
    } else {
        const size_width = readBackgroundSize(width_style, background_width)
        const size_height = readBackgroundSize(height_style, background_height)
        width = size_width ?? (size_height === undefined ? image_width : image_width * (size_height / image_height))
        height = size_height ?? image_height * (width / image_width)
    }

    const x = readBackgroundPosition(computeStyleValue(node.styles.backgroundPositionX), background_width, width)
    const y = readBackgroundPosition(computeStyleValue(node.styles.backgroundPositionY), background_height, height)

    return [x, y, width, height]
}

function getBackgroundAreaSize(node, border_widths) {
    const [border_width_top, border_width_right, border_width_bottom, border_width_left] = border_widths

    return [
        node.layout.width - border_width_left - border_width_right,
        node.layout.height - border_width_top - border_width_bottom,
    ]
}

function readBackgroundSize(style, reference_size) {
    if (style?.parsed.kind === UNIT.PERCENT) {
        return (reference_size * style.parsed.value) / 100
    }

    if (style?.parsed.kind === UNIT.PX) {
        return style.parsed.value
    }

    return undefined
}

function readBackgroundPosition(style, background_size, image_size) {
    if (style?.parsed.kind === UNIT.PERCENT) {
        return ((background_size - image_size) * style.parsed.value) / 100
    }

    if (style?.parsed.kind === UNIT.PX) {
        return style.parsed.value
    }

    return 0
}

export function readBackgroundImageMode(node) {
    return 1 + (node.styles.backgroundRepeat?.parsed.enum ?? BACKGROUND_REPEAT['no-repeat'])
}

export function getMainAxisOverflow(node) {
    const flex_direction = node.styles.flexDirection?.parsed.enum ?? FLEX_DIRECTION.row

    return flex_direction === FLEX_DIRECTION.column || flex_direction === FLEX_DIRECTION['column-reverse']
        ? (node.styles.overflowY?.parsed.enum ?? OVERFLOW.visible)
        : (node.styles.overflowX?.parsed.enum ?? OVERFLOW.visible)
}

export function collectPanelData(node, image_manager, computeStyle) {
    const drawing_data = getNodeDrawingData(node, computeStyle)
    if (drawing_data === null) {
        return null
    }

    const panel_data = {
        ...drawing_data,
        background_image_mode: 0,
        background_uv_rect: [0, 0, 1, 1],
        background_image_rect: [0, 0, 0, 0],
        background_atlas_layer: 0,
    }

    const atlas_image = FEATURES.background_image
        ? image_manager.getImage(node.styles.backgroundImage?.value)
        : undefined
    if (atlas_image !== undefined) {
        panel_data.background_image_mode = readBackgroundImageMode(node)
        panel_data.background_uv_rect = atlas_image.uv_rect
        panel_data.background_image_rect = getBackgroundImageRect(
            node,
            atlas_image.image_size,
            computeStyle,
            panel_data.border_widths,
        )
        panel_data.background_atlas_layer = atlas_image.layer
    }

    return panel_data
}
