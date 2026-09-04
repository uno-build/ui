import { KEYWORD, MEASURE_MODE, ROOT_SIZE, UNIT, WHITE_SPACE } from '../../style/consts'
import { layoutWithLines } from '../pretext/layout'

export function getTextFont(node, font_manager) {
    const font_family_style = node.styles.fontFamily
    const font_family = font_family_style?.parsed.kind === KEYWORD.UNSET ? undefined : font_family_style?.value
    const font = font_family === undefined ? font_manager.getDefaultFont() : font_manager.getFont(font_family)

    if (font === undefined && font_family !== undefined) {
        throw new Error(`Font "${font_family}" is not registered.`)
    }

    return font
}

export function getTextFontSize(node, computeStyle) {
    return computeStyle(node.styles.fontSize)?.parsed.value ?? ROOT_SIZE
}

export function getTextNaturalLineHeight(font, font_size) {
    return font.metrics.lineHeight * font_size
}

export function getTextLineHeight(node, natural_line_height, font_size, computeStyle) {
    const line_height_style = computeStyle(node.styles.lineHeight)

    if (line_height_style === undefined || line_height_style.parsed.kind === KEYWORD.UNSET) {
        return natural_line_height
    }

    if (line_height_style.parsed.kind === UNIT.PX) {
        return line_height_style.parsed.value
    }

    return line_height_style.parsed.value * font_size
}

export function getTextRasterMetrics(font, font_size, device_pixel_ratio) {
    return {
        ascender: roundToDevicePixel(font.metrics.ascender * font_size, device_pixel_ratio),
        descender: roundToDevicePixel(-font.metrics.descender * font_size, device_pixel_ratio),
    }
}

export function getTextWhiteSpace(node) {
    return node.styles.whiteSpace?.parsed.enum ?? WHITE_SPACE['pre-wrap']
}

export function measureGlyphAdvances(font, font_size, text) {
    let width = 0

    for (const character of text) {
        const glyph = font.glyphs_by_unicode.get(character.codePointAt(0))
        if (glyph !== undefined) {
            width += glyph.advance * font_size
        }
    }

    return width
}

export function getTextLayout(record, prepared_text, layout_width, line_height) {
    if (
        record.prepared_text !== prepared_text ||
        record.layout_width !== layout_width ||
        record.line_height !== line_height
    ) {
        record.prepared_text = prepared_text
        record.layout_width = layout_width
        record.line_height = line_height
        record.text_layout = layoutWithLines(prepared_text, layout_width, line_height)
    }

    return record.text_layout
}

export function constrainMeasuredSize(measured_size, available_size, measure_mode) {
    if (measure_mode === MEASURE_MODE.EXACTLY) {
        return available_size
    }

    if (measure_mode === MEASURE_MODE.AT_MOST) {
        return Math.min(measured_size, available_size)
    }

    return measured_size
}

export function roundToDevicePixel(value, device_pixel_ratio) {
    return Math.round(value * device_pixel_ratio) / device_pixel_ratio
}
