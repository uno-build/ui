import type Operations from '../../core/Operations'
import {
    BACKGROUND_REPEAT,
    BACKGROUND_SIZE,
    DISPLAY,
    FLEX_DIRECTION,
    KEYWORD,
    OVERFLOW,
    RECORD_PANEL,
    RECORD_TEXT,
    UNIT,
} from '../../style/constants'
import { TRANSPARENT_COLOR } from '../webgpu/buffers'

const EMPTY_BOX_SHADOW = [0, 0, 0, 0]
const EMPTY_BORDER_WIDTHS = [0, 0, 0, 0]
const EMPTY_BORDER_RADIUS = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
]
const DEGREES_TO_RADIANS = Math.PI / 180
const ROOT_METRICS = {
    x: 0,
    y: 0,
    opacity: 1,
    offset_x: 0,
    offset_y: 0,
    scale_x: 1,
    scale_y: 1,
    matrix: null,
    scroll_left: 0,
    scroll_top: 0,
    clip: null,
    children_clip: null,
}

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

export function createNodeMetricsResolver(single_record_parts: number = 0) {
    if (single_record_parts !== 0) {
        if (!(single_record_parts & RECORD_PANEL) || !(single_record_parts & RECORD_TEXT)) {
            return getSingleNodeMetrics
        }
        let node_metrics
        return function getNodeMetrics(node: any) {
            return node_metrics ??= getSingleNodeMetrics(node)
        }
    }

    const metrics = new Map()
    const pending_nodes: any[] = []
    let last_leaf_node: any
    let last_leaf_metrics: any

    return function getNodeMetrics(node: any) {
        if (node === last_leaf_node) {
            return last_leaf_metrics
        }
        const is_leaf = node.children.length === 0
        if (!is_leaf) {
            const cached_metrics = metrics.get(node)
            if (cached_metrics !== undefined) {
                return cached_metrics
            }
        }

        let ancestor = node.parent
        let current_metrics = ancestor === null ? ROOT_METRICS : metrics.get(ancestor)
        let pending_count = 0
        while (current_metrics === undefined) {
            pending_nodes[pending_count++] = ancestor
            ancestor = ancestor.parent
            current_metrics = ancestor === null ? ROOT_METRICS : metrics.get(ancestor)
        }

        for (let index = pending_count; index >= 0; index--) {
            const current_node = index === 0 ? node : pending_nodes[index - 1]
            const { layout, styles } = current_node
            const rotate = styles.rotate?.parsed.value ?? 0
            // A rotated subtree composes full matrices; the rest keeps the offset and scale per axis below.
            if (current_metrics.matrix !== null || rotate !== 0) {
                current_metrics = getRotatedNodeMetrics(current_node, current_metrics, rotate)
                if (index === 0 && is_leaf) {
                    last_leaf_node = node
                    last_leaf_metrics = current_metrics
                    return last_leaf_metrics
                }
                metrics.set(current_node, current_metrics)
                continue
            }
            const translate_x = styles.translateX?.parsed.value ?? 0
            const translate_y = styles.translateY?.parsed.value ?? 0
            const node_scale_x = styles.scaleX?.parsed.value ?? 1
            const node_scale_y = styles.scaleY?.parsed.value ?? 1
            // In its parent's space, a point p of the box goes to center + translate + scale * (p - center).
            const offset_x =
                current_metrics.offset_x +
                current_metrics.scale_x * (translate_x + (layout.x + layout.width / 2) * (1 - node_scale_x))
            const offset_y =
                current_metrics.offset_y +
                current_metrics.scale_y * (translate_y + (layout.y + layout.height / 2) * (1 - node_scale_y))
            const scale_x = current_metrics.scale_x * node_scale_x
            const scale_y = current_metrics.scale_y * node_scale_y
            const x = layout.x * scale_x + offset_x
            const y = layout.y * scale_y + offset_y
            const width = layout.width * scale_x
            const height = layout.height * scale_y
            // Glyphs are placed without transforms; their text run applies the transform on the GPU.
            const untransformed_x = layout.x - current_metrics.scroll_left
            const untransformed_y = layout.y - current_metrics.scroll_top
            const clip = current_metrics.children_clip
            const opacity = current_metrics.opacity * (styles.opacity?.parsed.value ?? 1)
            // Each record is visited once; its panel and text consume leaf metrics consecutively.
            if (index === 0 && is_leaf) {
                last_leaf_node = node
                last_leaf_metrics = {
                    x,
                    y,
                    width,
                    height,
                    scale_x,
                    scale_y,
                    rotation: 0,
                    untransformed_x,
                    untransformed_y,
                    opacity,
                    clip,
                }
                return last_leaf_metrics
            }
            const overflow_x = styles.overflowX?.parsed.enum ?? OVERFLOW.visible
            const overflow_y = styles.overflowY?.parsed.enum ?? OVERFLOW.visible
            const clip_x = overflow_x === OVERFLOW.hidden || overflow_x === OVERFLOW.scroll
            const clip_y = overflow_y === OVERFLOW.hidden || overflow_y === OVERFLOW.scroll
            let children_clip = clip

            if (clip_x || clip_y) {
                const top = clip_y
                    ? Math.max(clip?.top ?? -Infinity, y + layout.border.top * scale_y)
                    : (clip?.top ?? -Infinity)
                const right = clip_x
                    ? Math.min(clip?.right ?? Infinity, x + width - layout.border.right * scale_x)
                    : (clip?.right ?? Infinity)
                const bottom = clip_y
                    ? Math.min(clip?.bottom ?? Infinity, y + height - layout.border.bottom * scale_y)
                    : (clip?.bottom ?? Infinity)
                const left = clip_x
                    ? Math.max(clip?.left ?? -Infinity, x + layout.border.left * scale_x)
                    : (clip?.left ?? -Infinity)
                children_clip =
                    clip !== null && top === clip.top && right === clip.right && bottom === clip.bottom && left === clip.left
                        ? clip
                        : { top, right, bottom, left }
            }

            current_metrics = {
                x,
                y,
                width,
                height,
                scale_x,
                scale_y,
                rotation: 0,
                untransformed_x,
                untransformed_y,
                opacity,
                offset_x: offset_x - current_node.scrollLeft * scale_x,
                offset_y: offset_y - current_node.scrollTop * scale_y,
                matrix: null,
                scroll_left: current_metrics.scroll_left + current_node.scrollLeft,
                scroll_top: current_metrics.scroll_top + current_node.scrollTop,
                clip,
                children_clip,
            }
            metrics.set(current_node, current_metrics)
        }

        return current_metrics
    }
}

// Under a rotation the box is drawn from its top-left corner (x, y), rotated and scaled per axis. Positions follow the
// full matrix; only the shear of a non-uniform scale above a rotation is dropped from the box.
function getRotatedNodeMetrics(node: any, parent_metrics: any, rotate: number) {
    const { layout, styles } = node
    // The parent's map from its children's layout space to the screen.
    const { a: parent_a, b: parent_b, c: parent_c, d: parent_d, e: parent_e, f: parent_f } = parent_metrics.matrix ?? {
        a: parent_metrics.scale_x,
        b: 0,
        c: 0,
        d: parent_metrics.scale_y,
        e: parent_metrics.offset_x,
        f: parent_metrics.offset_y,
    }
    const angle = rotate * DEGREES_TO_RADIANS
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const node_scale_x = styles.scaleX?.parsed.value ?? 1
    const node_scale_y = styles.scaleY?.parsed.value ?? 1
    // In its parent's space, a point p of the box goes to center + translate + rotation * scale * (p - center).
    const local_a = cos * node_scale_x
    const local_b = sin * node_scale_x
    const local_c = -sin * node_scale_y
    const local_d = cos * node_scale_y
    const center_x = layout.x + layout.width / 2
    const center_y = layout.y + layout.height / 2
    const local_e = center_x + (styles.translateX?.parsed.value ?? 0) - local_a * center_x - local_c * center_y
    const local_f = center_y + (styles.translateY?.parsed.value ?? 0) - local_b * center_x - local_d * center_y
    const a = parent_a * local_a + parent_c * local_b
    const b = parent_b * local_a + parent_d * local_b
    const c = parent_a * local_c + parent_c * local_d
    const d = parent_b * local_c + parent_d * local_d
    const e = parent_a * local_e + parent_c * local_f + parent_e
    const f = parent_b * local_e + parent_d * local_f + parent_f
    const scale_x = Math.hypot(a, b)
    const scale_y = Math.hypot(c, d)

    return {
        x: a * layout.x + c * layout.y + e,
        y: b * layout.x + d * layout.y + f,
        width: layout.width * scale_x,
        height: layout.height * scale_y,
        scale_x,
        scale_y,
        rotation: Math.atan2(b, a),
        untransformed_x: layout.x - parent_metrics.scroll_left,
        untransformed_y: layout.y - parent_metrics.scroll_top,
        opacity: parent_metrics.opacity * (styles.opacity?.parsed.value ?? 1),
        // Overflow is ignored under a rotation, so every clip stays aligned with the screen.
        clip: parent_metrics.children_clip,
        children_clip: parent_metrics.children_clip,
        matrix: {
            a,
            b,
            c,
            d,
            e: e - a * node.scrollLeft - c * node.scrollTop,
            f: f - b * node.scrollLeft - d * node.scrollTop,
        },
        scroll_left: parent_metrics.scroll_left + node.scrollLeft,
        scroll_top: parent_metrics.scroll_top + node.scrollTop,
    }
}

export function getSingleNodeMetrics(node: any): any {
    // A rotation in the chain needs full matrices, which the resolver composes from the root.
    if ((node.styles.rotate?.parsed.value ?? 0) !== 0) {
        return createNodeMetricsResolver()(node)
    }
    let opacity = node.styles.opacity?.parsed.value ?? 1
    let offset_x = 0
    let offset_y = 0
    let scale_x = 1
    let scale_y = 1
    let scroll_left = 0
    let scroll_top = 0
    let top = -Infinity
    let right = Infinity
    let bottom = Infinity
    let left = -Infinity
    let has_clip = false
    let ancestor = node.parent

    while (ancestor !== null) {
        if ((ancestor.styles.rotate?.parsed.value ?? 0) !== 0) {
            return createNodeMetricsResolver()(node)
        }
        scroll_left += ancestor.scrollLeft
        scroll_top += ancestor.scrollTop
        offset_x -= ancestor.scrollLeft
        offset_y -= ancestor.scrollTop
        opacity *= ancestor.styles.opacity?.parsed.value ?? 1
        const overflow_x = ancestor.styles.overflowX?.parsed.enum ?? OVERFLOW.visible
        const overflow_y = ancestor.styles.overflowY?.parsed.enum ?? OVERFLOW.visible
        const clip_x = overflow_x === OVERFLOW.hidden || overflow_x === OVERFLOW.scroll
        const clip_y = overflow_y === OVERFLOW.hidden || overflow_y === OVERFLOW.scroll
        if (clip_x) {
            left = Math.max(left, ancestor.layout.x - offset_x + ancestor.layout.border.left)
            right = Math.min(right, ancestor.layout.x - offset_x + ancestor.layout.width - ancestor.layout.border.right)
        }
        if (clip_y) {
            top = Math.max(top, ancestor.layout.y - offset_y + ancestor.layout.border.top)
            bottom = Math.min(bottom, ancestor.layout.y - offset_y + ancestor.layout.height - ancestor.layout.border.bottom)
        }
        has_clip ||= clip_x || clip_y
        // Applied after the clip: an ancestor's translate and scale move its own clip, its scroll does not.
        const translate_x = ancestor.styles.translateX?.parsed.value ?? 0
        const translate_y = ancestor.styles.translateY?.parsed.value ?? 0
        const ancestor_scale_x = ancestor.styles.scaleX?.parsed.value ?? 1
        const ancestor_scale_y = ancestor.styles.scaleY?.parsed.value ?? 1
        const center_x = ancestor.layout.x + ancestor.layout.width / 2
        const center_y = ancestor.layout.y + ancestor.layout.height / 2
        offset_x = offset_x * ancestor_scale_x + translate_x + center_x * (1 - ancestor_scale_x)
        offset_y = offset_y * ancestor_scale_y + translate_y + center_y * (1 - ancestor_scale_y)
        scale_x *= ancestor_scale_x
        scale_y *= ancestor_scale_y
        // A zero scale turns infinite sides into NaN, but it also empties the box: it is neither drawn nor hit.
        left *= ancestor_scale_x
        right *= ancestor_scale_x
        top *= ancestor_scale_y
        bottom *= ancestor_scale_y
        ancestor = ancestor.parent
    }

    // The node's own transform goes before its ancestors' one and does not move its clip.
    const translate_x = node.styles.translateX?.parsed.value ?? 0
    const translate_y = node.styles.translateY?.parsed.value ?? 0
    const node_scale_x = node.styles.scaleX?.parsed.value ?? 1
    const node_scale_y = node.styles.scaleY?.parsed.value ?? 1
    const node_offset_x = translate_x + (node.layout.x + node.layout.width / 2) * (1 - node_scale_x)
    const node_offset_y = translate_y + (node.layout.y + node.layout.height / 2) * (1 - node_scale_y)

    return {
        x: node.layout.x * scale_x * node_scale_x + offset_x + node_offset_x * scale_x,
        y: node.layout.y * scale_y * node_scale_y + offset_y + node_offset_y * scale_y,
        width: node.layout.width * scale_x * node_scale_x,
        height: node.layout.height * scale_y * node_scale_y,
        scale_x: scale_x * node_scale_x,
        scale_y: scale_y * node_scale_y,
        rotation: 0,
        untransformed_x: node.layout.x - scroll_left,
        untransformed_y: node.layout.y - scroll_top,
        opacity,
        clip: has_clip ? {
            top: top + offset_y,
            right: right + offset_x,
            bottom: bottom + offset_y,
            left: left + offset_x,
        } : null,
    }
}

// The screen bounding box of a box that turns about its top-left corner (x, y).
export function getRotatedBounds({ x, y, width, height, rotation }: { x: number; y: number; width: number; height: number; rotation: number; }) {
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)
    return {
        x: x + Math.min(0, width * cos) + Math.min(0, -height * sin),
        y: y + Math.min(0, width * sin) + Math.min(0, height * cos),
        width: Math.abs(width * cos) + Math.abs(height * sin),
        height: Math.abs(width * sin) + Math.abs(height * cos),
    }
}

// A box emptied by a zero scale counts as clipped. A rotated box is tested by its bounding box.
export function isNodeClipped({ x, y, width, height, rotation, clip }: { x: any; y: any; width: any; height: any; rotation: any; clip: any; }) {
    if (rotation !== 0 && width !== 0 && height !== 0) {
        return isNodeClipped({ ...getRotatedBounds({ x, y, width, height, rotation }), rotation: 0, clip })
    }
    return (
        width === 0 || height === 0 || (clip !== null && (
            clip.right <= clip.left || clip.bottom <= clip.top ||
            clip.right <= x || clip.bottom <= y || clip.left >= x + width || clip.top >= y + height
        ))
    )
}

// If null is returned, the node should not be drawn
export function getNodeDrawingData(node: any, computeStyleValue: any, getNodeMetrics: any, image_size: any) {
    const { width, height } = node.layout
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
    const box_shadow_style = FEATURES.box_shadow ? computeStyleValue(node.styles.boxShadow) : undefined
    // Packed unscaled first: whether there is a shadow is decided before resolving the metrics.
    const box_shadow = packBoxShadow(box_shadow_style, 1, 1)
    const has_box_shadow = box_shadow[2]! >>> 24 > 0 && (box_shadow[0] !== 0 || box_shadow[1] !== 0)

    if (!has_background && !has_background_image && !has_border && !has_box_shadow) {
        return null
    }

    const node_metrics = getNodeMetrics(node)
    const { x, y, scale_x, scale_y, rotation, opacity, clip } = node_metrics
    if (opacity <= 0 || isNodeClipped(node_metrics)) {
        return null
    }

    // The clip stays aligned with the screen: it is relative to the panel's top-left corner, not rotated with it.
    const normalized_clipping = clip === null ? [0, 0, 0, 0] : [clip.top - y, clip.right - x, clip.bottom - y, clip.left - x]

    const [border_radius_x, border_radius_y] = FEATURES.border_radius
        ? getNodeBorderRadius(node, computeStyleValue, width, height, scale_x, scale_y)
        : EMPTY_BORDER_RADIUS
    const border_widths = has_border
        ? [border_width_top, border_width_right, border_width_bottom, border_width_left]
        : EMPTY_BORDER_WIDTHS

    return {
        layout: [x, y, node_metrics.width, node_metrics.height],
        clipping: normalized_clipping,
        opacity,
        rotation,
        border_radius_x,
        border_radius_y,
        border_color_top: node.styles.borderTopColor?.parsed.rgba ?? TRANSPARENT_COLOR,
        border_color_right: node.styles.borderRightColor?.parsed.rgba ?? TRANSPARENT_COLOR,
        border_color_bottom: node.styles.borderBottomColor?.parsed.rgba ?? TRANSPARENT_COLOR,
        border_color_left: node.styles.borderLeftColor?.parsed.rgba ?? TRANSPARENT_COLOR,
        border_widths: has_border ? [
            border_width_top * scale_y,
            border_width_right * scale_x,
            border_width_bottom * scale_y,
            border_width_left * scale_x,
        ] : EMPTY_BORDER_WIDTHS,
        background_color: has_background ? background_color : TRANSPARENT_COLOR,
        background_image_rect: image_size === undefined
            ? [0, 0, 0, 0]
            : getBackgroundImageRect(node, image_size, computeStyleValue, border_widths, scale_x, scale_y),
        box_shadow: packBoxShadow(box_shadow_style, scale_x, scale_y),
    }
}

export function getNodeOpacity(node: any) {
    let opacity = 1
    let current_node = node

    while (current_node != null) {
        opacity *= current_node.styles.opacity?.parsed.value ?? 1
        current_node = current_node.parent
    }

    return opacity
}

export function getNodeBorderWidth(node: any, side: any, computeStyleValue: any) {
    const border_style = node.styles[`border${side}Style`]
    const border_color = node.styles[`border${side}Color`]
    const border_width = computeStyleValue(node.styles[`border${side}Width`])

    if (border_style?.value !== 'solid' || border_color?.parsed.rgba === undefined) {
        return 0
    }

    return border_width?.parsed.value ?? 0
}

export function getNodeRenderLayout(node: any) {
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

export function updateScrollMetrics(node: any, getContentSize: any, operations: Operations<any>) {
    const display = node.styles.display?.parsed.enum ?? DISPLAY.flex
    if (display === DISPLAY.none) {
        resetScrollMetrics(node, operations)
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

    node.clientWidth = Math.round(Math.max(0, node.layout.width - border_left - border_right))
    node.clientHeight = Math.round(Math.max(0, node.layout.height - border_top - border_bottom))

    const overflow_rect = {
        left: node.layout.x + border_left,
        top: node.layout.y + border_top,
        right: node.layout.x + border_left + node.clientWidth,
        bottom: node.layout.y + border_top + node.clientHeight,
    }
    const content_size = getContentSize(node)
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
        const child_overflow = updateScrollMetrics(child, getContentSize, operations)
        const child_display = child.styles.display?.parsed.enum ?? DISPLAY.flex
        if (child_display === DISPLAY.none) {
            continue
        }

        // Unlike CSS, translate and scale do not extend the scrollable overflow: it is read from the layout boxes.
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

    node.scrollWidth = Math.round(Math.max(node.clientWidth, overflow_rect.right - node.layout.x - border_left))
    node.scrollHeight = Math.round(Math.max(node.clientHeight, overflow_rect.bottom - node.layout.y - border_top))
    clampScroll(node, operations)

    return overflow_rect
}

export function clampScroll(node: any, operations: Operations<any>) {
    const scroll_left = Math.max(0, Math.min(node.scrollLeft, node.scrollWidth - node.clientWidth))
    const scroll_top = Math.max(0, Math.min(node.scrollTop, node.scrollHeight - node.clientHeight))
    if (node.scrollLeft !== scroll_left || node.scrollTop !== scroll_top) {
        node.scroll_left = scroll_left
        node.scroll_top = scroll_top
        operations.scroll_nodes.add(node)
    }
    operations.recordScrollMetrics(node)
}

function resetScrollMetrics(node: any, operations: Operations<any>) {
    node.clientWidth = 0
    node.clientHeight = 0
    node.scrollWidth = 0
    node.scrollHeight = 0
    if (node.scrollLeft !== 0 || node.scrollTop !== 0) {
        node.scroll_left = 0
        node.scroll_top = 0
        operations.scroll_nodes.add(node)
    }
    operations.recordScrollMetrics(node)

    for (const child of node.children) {
        resetScrollMetrics(child, operations)
    }
}

function getNodeBorderRadius(node: any, computeStyleValue: any, width: any, height: any, scale_x: any, scale_y: any) {
    const top_left = getBorderRadius(computeStyleValue(node.styles.borderTopLeftRadius)?.parsed, width, height)
    const top_right = getBorderRadius(computeStyleValue(node.styles.borderTopRightRadius)?.parsed, width, height)
    const bottom_right = getBorderRadius(computeStyleValue(node.styles.borderBottomRightRadius)?.parsed, width, height)
    const bottom_left = getBorderRadius(computeStyleValue(node.styles.borderBottomLeftRadius)?.parsed, width, height)

    return [
        [top_left[0] * scale_x, top_right[0] * scale_x, bottom_right[0] * scale_x, bottom_left[0] * scale_x],
        [top_left[1] * scale_y, top_right[1] * scale_y, bottom_right[1] * scale_y, bottom_left[1] * scale_y],
    ]
}

function getBorderRadius(border_radius: any, width: any, height: any) {
    if (border_radius === undefined || border_radius.kind === KEYWORD.UNSET) {
        return [0, 0]
    }
    if (border_radius.kind === UNIT.PERCENT) {
        return [(width * border_radius.value) / 100, (height * border_radius.value) / 100]
    }

    return [border_radius.value, border_radius.value]
}

function packBoxShadow(box_shadow_style: any, scale_x: any, scale_y: any) {
    const box_shadow = box_shadow_style?.parsed.box_shadow
    if (box_shadow === undefined || box_shadow.color[3] === 0) {
        return EMPTY_BOX_SHADOW
    }

    // Blur and spread are single values: a non-uniform scale uses its smaller factor.
    const scale = Math.min(scale_x, scale_y)
    return [
        packSigned16Pair(box_shadow.offset_x.value * scale_x, box_shadow.offset_y.value * scale_y),
        packSigned16Pair(box_shadow.blur.value * scale, box_shadow.spread.value * scale),
        packColor(box_shadow.color),
        0,
    ]
}

function packSigned16Pair(first: any, second: any) {
    return (packSigned16(first) | (packSigned16(second) << 16)) >>> 0
}

function packSigned16(value: any) {
    return Math.max(-32768, Math.min(32767, Math.round(value))) & 0xffff
}

function packColor(color: any) {
    return ((color[0] & 255) | ((color[1] & 255) << 8) | ((color[2] & 255) << 16) | ((color[3] & 255) << 24)) >>> 0
}

export function getAncestorClipping(node: any) {
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

export function getBackgroundImageRect(
    node: any,
    image_size: any,
    computeStyleValue: any,
    border_widths: any,
    scale_x: any,
    scale_y: any,
) {
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

    return [x * scale_x, y * scale_y, width * scale_x, height * scale_y]
}

function getBackgroundAreaSize(node: any, border_widths: any): [number, number] {
    const [border_width_top, border_width_right, border_width_bottom, border_width_left] = border_widths

    return [
        node.layout.width - border_width_left - border_width_right,
        node.layout.height - border_width_top - border_width_bottom,
    ]
}

function readBackgroundSize(style: any, reference_size: any) {
    if (style?.parsed.kind === UNIT.PERCENT) {
        return (reference_size * style.parsed.value) / 100
    }

    if (style?.parsed.kind === UNIT.PX) {
        return style.parsed.value
    }

    return undefined
}

function readBackgroundPosition(style: any, background_size: any, image_size: any) {
    if (style?.parsed.kind === UNIT.PERCENT) {
        return ((background_size - image_size) * style.parsed.value) / 100
    }

    if (style?.parsed.kind === UNIT.PX) {
        return style.parsed.value
    }

    return 0
}

export function readBackgroundImageMode(node: any) {
    return 1 + (node.styles.backgroundRepeat?.parsed.enum ?? BACKGROUND_REPEAT['no-repeat'])
}

export function getMainAxisOverflow(node: any) {
    const flex_direction = node.styles.flexDirection?.parsed.enum ?? FLEX_DIRECTION.row

    return flex_direction === FLEX_DIRECTION.column || flex_direction === FLEX_DIRECTION['column-reverse']
        ? (node.styles.overflowY?.parsed.enum ?? OVERFLOW.visible)
        : (node.styles.overflowX?.parsed.enum ?? OVERFLOW.visible)
}

export function collectPanelData(node: any, image_manager: any, computeStyle: any, getNodeMetrics: any) {
    const atlas_image = FEATURES.background_image
        ? image_manager.getImage(node.styles.backgroundImage?.value)
        : undefined
    // The image rect is computed with the drawing data, which knows the unscaled border widths.
    const drawing_data = getNodeDrawingData(node, computeStyle, getNodeMetrics, atlas_image?.image_size)
    if (drawing_data === null) {
        return null
    }

    const panel_data = {
        ...drawing_data,
        background_image_mode: 0,
        background_uv_rect: [0, 0, 1, 1],
        background_atlas_layer: 0,
    }

    if (atlas_image !== undefined) {
        panel_data.background_image_mode = readBackgroundImageMode(node)
        panel_data.background_uv_rect = atlas_image.uv_rect
        panel_data.background_atlas_layer = atlas_image.layer
    }

    return panel_data
}
