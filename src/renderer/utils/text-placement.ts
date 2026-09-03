import { TEXT_ALIGN } from '../../style/consts'

export function placeGlyphs({
    prepared_text,
    text_layout,
    font,
    font_size,
    line_height,
    baseline_y,
    content_x,
    content_width,
    text_align,
    space_advance,
    grapheme_segmenter,
    run_index,
    text_shadow,
}) {
    const letter_spacing = prepared_text.letterSpacing
    const glyphs = []

    for (let line_index = 0; line_index < text_layout.lines.length; line_index++) {
        const line = text_layout.lines[line_index]!
        const baseline = baseline_y + line_index * line_height
        const line_width = getTextAlignmentWidth(line, space_advance, letter_spacing)
        const line_x = content_x + getTextAlignOffset(text_align, content_width, line_width)
        const justify_data = getJustifyData(text_align, prepared_text, line, content_width, line_width)
        let cursor_x = line_x
        let character_offset = 0

        const segments = letter_spacing === 0 ? line.text : grapheme_segmenter.segment(line.text)

        for (const segment of segments) {
            const grapheme = typeof segment === 'string' ? segment : segment.segment
            if (grapheme === '\t') {
                cursor_x += getTabAdvance(cursor_x - line_x, space_advance * 8)
            } else {
                for (let character_index = 0; character_index < grapheme.length; ) {
                    const code_point = grapheme.codePointAt(character_index)
                    const glyph = font.glyphs_by_unicode.get(code_point)
                    if (glyph !== undefined) {
                        if (glyph.plane_bounds !== undefined && glyph.uv_rect !== undefined) {
                            const [left, bottom, right, top] = glyph.plane_bounds
                            glyphs.push({
                                layout: [
                                    cursor_x + left * font_size,
                                    baseline - top * font_size,
                                    (right - left) * font_size,
                                    (top - bottom) * font_size,
                                ],
                                uv_rect: glyph.uv_rect,
                                run_index,
                                text_shadow,
                            })
                        }

                        cursor_x += glyph.advance * font_size
                    }

                    character_index += code_point > 0xffff ? 2 : 1
                }
            }

            if (
                grapheme === ' ' &&
                justify_data !== null &&
                character_offset >= justify_data.start &&
                character_offset < justify_data.end
            ) {
                cursor_x += justify_data.advance
            }

            cursor_x += letter_spacing
            character_offset += grapheme.length
        }
    }

    return glyphs
}

function getTabAdvance(line_width, tab_stop_advance) {
    if (tab_stop_advance <= 0) {
        return 0
    }

    const remainder = line_width % tab_stop_advance
    return Math.abs(remainder) <= 1e-6 ? tab_stop_advance : tab_stop_advance - remainder
}

function getTextAlignOffset(text_align, content_width, line_width) {
    if (text_align === TEXT_ALIGN.right) {
        return content_width - line_width
    }

    if (text_align === TEXT_ALIGN.center) {
        return (content_width - line_width) / 2
    }

    return 0
}

function getTextAlignmentWidth(line, space_advance, letter_spacing) {
    let end = line.text.length
    while (end > 0 && line.text[end - 1] === ' ') {
        end--
    }

    return line.width - (line.text.length - end) * (space_advance + letter_spacing)
}

function getJustifyData(text_align, prepared_text, line, content_width, line_width) {
    if (text_align !== TEXT_ALIGN.justify || isParagraphEnd(prepared_text, line)) {
        return null
    }

    const start = line.text.length - line.text.trimStart().length
    let end = line.text.length
    while (end > start && line.text[end - 1] === ' ') {
        end--
    }
    let space_count = 0

    for (let index = start; index < end; index++) {
        if (line.text[index] === ' ') {
            space_count++
        }
    }

    const remaining_width = content_width - line_width
    if (space_count === 0 || remaining_width <= 0) {
        return null
    }

    return {
        start,
        end,
        advance: remaining_width / space_count,
    }
}

function isParagraphEnd(prepared_text, line) {
    if (line.end.segmentIndex >= prepared_text.segments.length) {
        return true
    }

    return line.end.graphemeIndex === 0 && prepared_text.kinds[line.end.segmentIndex - 1] === 'hard-break'
}
