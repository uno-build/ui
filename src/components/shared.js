const OBJECT_FIT_BACKGROUND_SIZE = {
    fill: '100% 100%',
    contain: 'contain',
    cover: 'cover',
    none: 'unset',
}

export function getImageStyle(resources, src, style = {}) {
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
    let size_style = {}

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

export function getScrollViewStyle(horizontal, style = {}) {
    return {
        flexDirection: horizontal ? 'row' : 'column',
        [horizontal ? 'overflowX' : 'overflowY']: 'scroll',
        ...style,
    }
}

export function getScrollContentStyle(horizontal, style = {}) {
    return {
        flexDirection: horizontal ? 'row' : 'column',
        flexShrink: '0',
    }
}

export function getInputStyle(style = {}) {
    return {
        backgroundColor: '#ffffff',
        border: '1px solid #777777',
        width: '100%',
        ...style,
    }
}

export function getInputContentStyle(style = {}) {
    return {
        flex: '1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:
            style.textAlign === 'center' ? 'center' : style.textAlign === 'right' ? 'flex-end' : 'flex-start',
        overflowX: 'hidden',
        pointerEvents: 'none',
    }
}

export function getInputTextStyle(style = {}, show_placeholder, placeholder_text_color) {
    return {
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        ...(style.fontFamily !== undefined && { fontFamily: style.fontFamily }),
        ...(style.lineHeight !== undefined && { lineHeight: style.lineHeight }),
        ...(style.letterSpacing !== undefined && { letterSpacing: style.letterSpacing }),
        ...(show_placeholder
            ? { color: placeholder_text_color }
            : style.color !== undefined
              ? { color: style.color }
              : {}),
        ...(style.textAlign !== undefined && { textAlign: style.textAlign }),
        ...(style.textShadow !== undefined && { textShadow: style.textShadow }),
        ...(style.textStroke !== undefined && { textStroke: style.textStroke }),
    }
}

export function getInputCaretStyle(style = {}, caret_visible) {
    return {
        backgroundColor: style.color ?? '#000000',
        width: '1px',
        height: '16px',
        marginLeft: '1px',
        flexShrink: '0',
        opacity: caret_visible ? '1' : '0',
        pointerEvents: 'none',
    }
}

export function showInputPlaceholder(value, placeholder, is_focused) {
    return isEmptyValue(value) && is_focused === false && placeholder != null
}

export function getInputTextValue(value, placeholder, show_placeholder) {
    if (show_placeholder) {
        return placeholder
    }

    return isEmptyValue(value) ? '\u00A0' : value
}

function isEmptyValue(value) {
    return value == null || value === ''
}
