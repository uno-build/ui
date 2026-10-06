import type Resources from '../core/Resources'
import type Node from '../core/Node'
import type { StyleProps } from '../style/types'
import type { ImageOptions, InputOptions } from './props'

const OBJECT_FIT_BACKGROUND_SIZE = {
    fill: '100% 100%',
    contain: 'contain',
    cover: 'cover',
    none: 'unset',
}

export function getImageStyle(
    resources: Resources,
    src: string,
    style: NonNullable<ImageOptions['style']> = {},
): StyleProps {
    const image_size = resources.getImageSize(src)

    if (image_size === undefined) {
        throw new Error(`Image source "${src}" is not registered.`)
    }

    const { objectFit = 'fill', ...view_style } = style
    const background_size = OBJECT_FIT_BACKGROUND_SIZE[objectFit]

    if (background_size === undefined) {
        throw new Error(`Unsupported objectFit "${objectFit}".`)
    }

    const has_width = view_style.width !== undefined
    const has_height = view_style.height !== undefined
    let size_style: StyleProps | null = {}

    if (has_width === false && has_height === false) {
        size_style = {
            width: `${image_size.width}px`,
            height: `${image_size.height}px`,
        }
    } else if (has_width !== has_height) {
        size_style = { aspectRatio: String(image_size.width / image_size.height) }
    }

    return {
        ...size_style,
        ...view_style,
        backgroundImage: src,
        backgroundSize: background_size,
        backgroundPosition: '50% 50%',
    }
}

export function getScrollViewStyle(horizontal: boolean, style: StyleProps | null = {}) {
    return {
        flexDirection: horizontal ? 'row' : 'column',
        [horizontal ? 'overflowX' : 'overflowY']: 'scroll',
        ...style,
    }
}

export function getScrollContentStyle(horizontal: boolean, style: StyleProps | null = {}) {
    return {
        flexDirection: horizontal ? 'row' : 'column',
        flexShrink: '0',
    }
}

export function getInputStyle(style: StyleProps = {}) {
    return {
        backgroundColor: '#ffffff',
        border: '1px solid #777777',
        width: '100%',
        ...style,
    }
}

export function getInputContentStyle(style: StyleProps = {}) {
    return {
        position: 'relative',
        flex: '1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:
            style.textAlign === 'center' ? 'center' : style.textAlign === 'right' ? 'flex-end' : 'flex-start',
        overflowX: 'hidden',
        pointerEvents: 'none',
    }
}

export function getInputTextStyle(style: StyleProps = {}, show_placeholder: boolean, placeholder_text_color: string) {
    return {
        whiteSpace: 'pre',
        textAlign: 'left',
        flexShrink: '0',
        pointerEvents: 'none',
        ...(style.fontFamily !== undefined && { fontFamily: style.fontFamily }),
        ...(style.fontSize !== undefined && { fontSize: style.fontSize }),
        ...(style.lineHeight !== undefined && { lineHeight: style.lineHeight }),
        ...(style.letterSpacing !== undefined && { letterSpacing: style.letterSpacing }),
        ...(show_placeholder
            ? { color: placeholder_text_color }
            : style.color !== undefined
              ? { color: style.color }
              : {}),
        ...(style.textShadow !== undefined && { textShadow: style.textShadow }),
        ...(style.textStroke !== undefined && { textStroke: style.textStroke }),
    }
}

export function getInputCaretStyle(style: StyleProps = {}, caret_visible: boolean) {
    return {
        position: 'absolute',
        backgroundColor: style.color ?? '#000000',
        width: '1px',
        height: '16px',
        marginLeft: '0px',
        flexShrink: '0',
        opacity: caret_visible ? '1' : '0',
        pointerEvents: 'none',
    }
}

export function getInputSelection({ value, caretPosition: caret_position, selection }: InputOptions) {
    const value_length = String(value ?? '').length
    const start = Math.max(0, Math.min(selection?.[0] ?? 0, value_length))
    const end = Math.max(0, Math.min(selection?.[1] ?? 0, value_length))
    const position = Math.max(0, Math.min(
        caret_position ?? (selection === undefined ? value_length : end),
        value_length,
    ))
    return { start, end, position }
}

export function updateInputLayout(
    { content, text, caret, selection: selection_node }: {
        content: Node
        text: Node
        caret?: Node | null
        selection?: Node | null
    },
    props: InputOptions & { style?: StyleProps },
    is_focused: boolean,
) {
    const ui = content.ui!
    const { style = {}, value, placeholder, caretVisible: show_caret = true } = props
    const { start, end, position } = getInputSelection(props)
    const show_placeholder = showInputPlaceholder(value, placeholder, is_focused)
    const text_width = show_placeholder || String(value ?? '').length > 0
        ? ui.renderer!.getTextCaretOffset(text, text.text_content!.length)
        : 0
    const caret_width = is_focused && show_caret ? 1 : 0
    const content_width = content.layout.width!
    const free_space = Math.max(0, content_width - text_width - caret_width)
    const alignment_offset =
        style.textAlign === 'right' ? free_space : style.textAlign === 'center' ? free_space / 2 : 0
    const caret_left = alignment_offset + ui.renderer!.getTextCaretOffset(text, position)

    text.style('width', `${text_width + caret_width}px`)
    content.style('justifyContent', text_width + caret_width > content_width
        ? 'flex-start'
        : getInputContentStyle(style).justifyContent)
    caret?.style('left', `${caret_left}px`)
    if (selection_node != null) {
        const start_offset = ui.renderer!.getTextCaretOffset(text, start)
        const end_offset = ui.renderer!.getTextCaretOffset(text, end)
        selection_node.style('left', `${alignment_offset + start_offset}px`)
        selection_node.style('width', `${end_offset - start_offset}px`)
        selection_node.style('top', `${text.layout.top!}px`)
        selection_node.style('height', `${text.layout.height!}px`)
    }
    content.scrollLeft = is_focused
        ? Math.max(0, Math.min(content.scrollLeft, caret_left), caret_left + caret_width - content_width)
        : 0
    ui.update()
}

export function showInputPlaceholder(
    value: InputOptions['value'],
    placeholder: InputOptions['placeholder'],
    is_focused: boolean,
) {
    return isEmptyValue(value) && is_focused === false && placeholder != null
}

export function getInputTextValue(
    value: InputOptions['value'],
    placeholder: InputOptions['placeholder'],
    show_placeholder: boolean,
) {
    if (show_placeholder) {
        return placeholder
    }

    return isEmptyValue(value) ? '\u00A0' : value
}

function isEmptyValue(value: InputOptions['value']) {
    return value == null || value === ''
}
