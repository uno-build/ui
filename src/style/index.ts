import type { ResolvedStyle, StyleUpdate, StyleRule, StyleContext, StyleName } from './types'

export type * from './types'

import { normalizeStyleName } from './normalizers'
import { readUnit, runPipeline, runValidators } from './utils'
import { expandProperty } from './expand'
import { UNIT, RECORD_PANEL, RECORD_TEXT_RUN, RECORD_GLYPHS, RECORD_TEXT, RECORD_ALL } from './constants'
import {
    ALIGN_CONTENT_DEFINITION,
    ALIGN_ITEMS_DEFINITION,
    ALIGN_SELF_DEFINITION,
    BORDER_DEFINITION,
    BORDER_WIDTH_DEFINITION,
    BOX_SIZING_DEFINITION,
    COLOR_DEFINITION,
    DIRECTION_DEFINITION,
    DISPLAY_DEFINITION,
    FLEX_BASIS_DEFINITION,
    FLEX_DIRECTION_DEFINITION,
    FLEX_WRAP_DEFINITION,
    FONT_FAMILY_DEFINITION,
    FONT_SIZE_DEFINITION,
    LETTER_SPACING_DEFINITION,
    LINE_HEIGHT_DEFINITION,
    TEXT_ALIGN_DEFINITION,
    WHITE_SPACE_DEFINITION,
    JUSTIFY_CONTENT_DEFINITION,
    MARGIN_DEFINITION,
    MIN_MAX_SIZE_DEFINITION,
    NUMBER_DEFINITION,
    OFFSET_DEFINITION,
    OPACITY_DEFINITION,
    OVERFLOW_DEFINITION,
    POINTER_EVENTS_DEFINITION,
    POSITION_DEFINITION,
    PX_PERCENT_DEFINITION,
    SIZE_DEFINITION,
    INTEGER_DEFINITION,
    BACKGROUNDIMAGE_DEFINITION,
    BACKGROUND_SIZE_DEFINITION,
    BACKGROUND_POSITION_DEFINITION,
    BACKGROUND_REPEAT_DEFINITION,
    BOX_SHADOW_DEFINITION,
    TEXT_SHADOW_DEFINITION,
    TEXT_STROKE_DEFINITION,
    TRANSLATE_DEFINITION,
} from './definitions'

export function validateStyle(name: string, value: unknown) {
    if (typeof name !== 'string') {
        throw new Error(`style name must be a string, got '${typeof name}'`)
    }

    const normalized_name = Object.hasOwn(STYLE_BY_NAME, name) ? name : normalizeStyleName(name, STYLE)

    if (!Object.hasOwn(STYLE_BY_NAME, normalized_name)) {
        throw new Error(`unsupported property '${name}'`)
    }

    const typeof_value = typeof value
    if (typeof_value !== 'string') {
        throw new Error(`style value must be a string, got '${typeof_value}'`)
    }

    return normalized_name
}

export function resolveStyle(name: string, value: string): StyleUpdate {
    const style_parser = STYLE_BY_NAME[name]!

    try {
        return {
            name,
            value: value,
            expanded: style_parser.resolve(value),
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : err
        const suffix = message ? `: ${message}` : ''
        throw new Error(`invalid value '${value}' for property '${name}'${suffix}`)
    }
}

export function resolveNumberStyle(name: string, value: number): StyleUpdate {
    const normalized_name = Object.hasOwn(NUMBER_STYLE, name) ? name : normalizeStyleName(name, STYLE)

    if (!Object.hasOwn(NUMBER_STYLE, normalized_name)) {
        throw new Error(`property '${name}' does not accept numbers`)
    }

    const number_style = NUMBER_STYLE[normalized_name as NumberStyleName]
    const error = validateNumberStyle(value, number_style)

    if (error !== undefined) {
        throw new Error(`invalid value '${value}' for property '${normalized_name}': ${error}`)
    }

    const style = {
        name: normalized_name,
        value: `${value}${number_style.unit}`,
        parsed: number_style.unit === '' ? { value } : { value, kind: number_style.unit },
    }

    return { name: normalized_name, value: style.value, expanded: [style] }
}

function validateNumberStyle(value: number, number_style: NumberStyle) {
    if (!Number.isFinite(value)) {
        return 'expected number'
    }
    if (number_style.non_negative && value < 0) {
        return 'expected non-negative value'
    }
    if (number_style.max_one && value > 1) {
        return 'expected value between 0 and 1'
    }
    if (number_style.integer && !Number.isInteger(value)) {
        return 'expected integer'
    }
}

export function isPaintStyle(name: string) {
    return STYLE_BY_NAME[name]!.painter === true
}

export function computeStyleValue(style: ResolvedStyle | undefined, context: StyleContext) {
    if (style?.parsed === undefined) {
        return style
    }

    const parsed = computeParsedValue(style.parsed as Record<string, unknown>, context)

    return parsed === style.parsed ? style : { ...style, parsed }
}

function computeParsedValue(parsed: Record<string, unknown>, context: StyleContext): Record<string, unknown> {
    if (parsed.kind !== undefined) {
        return computeUnitValue(parsed as { kind: string, value: number }, context)
    }

    let computed: Record<string, unknown> | undefined

    for (const key in parsed) {
        if (typeof parsed[key] !== 'object') {
            continue
        }

        const value = computeParsedValue(parsed[key] as Record<string, unknown>, context)

        if (value !== parsed[key]) {
            computed ??= { ...parsed }
            computed[key] = value
        }
    }

    return computed ?? parsed
}

function computeUnitValue(parsed: { kind: string, value: number }, context: StyleContext) {
    let unit_size

    if (parsed.kind === UNIT.REM) {
        unit_size = context.root_size
    } else if (parsed.kind === UNIT.VW) {
        unit_size = context.viewport_width / 100
    } else if (parsed.kind === UNIT.VH) {
        unit_size = context.viewport_height / 100
    } else {
        return parsed
    }

    return {
        value: parsed.value * unit_size,
        kind: UNIT.PX,
    }
}

export type StyleDefinition<TName extends string> = {
    name: TName
    record_parts: number
    painter?: boolean
    resolve(value: string): Array<ResolvedStyle & { name: string }>
}

type StyleShorthand = { name: string, value: string, definition: StyleRule[] }

function createStyle<TName extends string>(name: TName, shorthandCallback: (name: TName, value: string) => StyleShorthand[], options: { record_parts?: number, painter?: boolean } = {}): StyleDefinition<TName> {
    return {
        name,
        record_parts: RECORD_ALL,
        ...options,
        resolve(value: string) {
            const style_shorthand = shorthandCallback(name, value)
            const styles = []

            for (const { name, value, definition } of style_shorthand) {
                let first_error: string | undefined
                let resolved = false

                for (const definition_item of definition) {
                    const normalized_value = runPipeline(definition_item.normalize, value)
                    const error = runValidators(definition_item.validate, normalized_value)

                    if (error !== undefined) {
                        first_error ??= error
                        continue
                    }

                    const parsed_value = runPipeline(definition_item.parse, normalized_value)
                    styles.push({ name, ...parsed_value })
                    resolved = true
                    break
                }

                if (!resolved) {
                    throw new Error(first_error)
                }
            }

            return styles
        },
    }
}

function expandHelper(name: string, value: string, definitions: Record<string, StyleRule[]>): StyleShorthand[] {
    const values = expandProperty(name, value)!
    return Object.keys(definitions)
        .filter((key) => Object.hasOwn(values, key))
        .map((key) => ({
            name: key,
            value: values[key]!,
            definition: definitions[key]!,
        }))
}

/* prettier-ignore */
export const STYLE = {
    ZINDEX: createStyle('zIndex', (name, value) => [
        { name, value, definition: INTEGER_DEFINITION },
    ], { painter: true, record_parts: 0 }),
    OVERFLOW: createStyle('overflow', (name, value) => [
        { name: 'overflowX', value, definition: OVERFLOW_DEFINITION },
        { name: 'overflowY', value, definition: OVERFLOW_DEFINITION },
    ]),
    OVERFLOWX: createStyle('overflowX', (name, value) => [
        { name, value, definition: OVERFLOW_DEFINITION },
    ], { record_parts: RECORD_PANEL | RECORD_TEXT_RUN }),
    OVERFLOWY: createStyle('overflowY', (name, value) => [
        { name, value, definition: OVERFLOW_DEFINITION },
    ], { record_parts: RECORD_PANEL | RECORD_TEXT_RUN }),
    OPACITY: createStyle('opacity', (name, value) => [
        { name, value, definition: OPACITY_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL | RECORD_TEXT_RUN }),
    TRANSLATE: createStyle('translate', (name, value) =>
        expandHelper(name, value, {
            translateX: TRANSLATE_DEFINITION,
            translateY: TRANSLATE_DEFINITION,
        })
    ),
    TRANSLATEX: createStyle('translateX', (name, value) => [
        { name, value, definition: TRANSLATE_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL | RECORD_TEXT_RUN }),
    TRANSLATEY: createStyle('translateY', (name, value) => [
        { name, value, definition: TRANSLATE_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL | RECORD_TEXT_RUN }),
    SCALE: createStyle('scale', (name, value) =>
        expandHelper(name, value, {
            scaleX: NUMBER_DEFINITION,
            scaleY: NUMBER_DEFINITION,
        })
    ),
    SCALEX: createStyle('scaleX', (name, value) => [
        { name, value, definition: NUMBER_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL | RECORD_TEXT_RUN }),
    SCALEY: createStyle('scaleY', (name, value) => [
        { name, value, definition: NUMBER_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL | RECORD_TEXT_RUN }),
    BOXSHADOW: createStyle('boxShadow', (name, value) => [
        { name, value, definition: BOX_SHADOW_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL }),
    TEXTSHADOW: createStyle('textShadow', (name, value) => [
        { name, value, definition: TEXT_SHADOW_DEFINITION },
    ], { painter: true, record_parts: RECORD_TEXT_RUN }),
    TEXTSTROKE: createStyle('textStroke', (name, value) => [
        { name, value, definition: TEXT_STROKE_DEFINITION },
    ], { painter: true, record_parts: RECORD_TEXT_RUN }),
    BORDER: createStyle('border', (name, value) => 
        expandHelper(name, value, {
            borderTopWidth: BORDER_WIDTH_DEFINITION,
            borderRightWidth: BORDER_WIDTH_DEFINITION,
            borderBottomWidth: BORDER_WIDTH_DEFINITION,
            borderLeftWidth: BORDER_WIDTH_DEFINITION,
            borderTopStyle: BORDER_DEFINITION,
            borderRightStyle: BORDER_DEFINITION,
            borderBottomStyle: BORDER_DEFINITION,
            borderLeftStyle: BORDER_DEFINITION,
            borderTopColor: COLOR_DEFINITION,
            borderRightColor: COLOR_DEFINITION,
            borderBottomColor: COLOR_DEFINITION,
            borderLeftColor: COLOR_DEFINITION,
        })
    ),
    BORDERRADIUS: createStyle('borderRadius', (name, value) => 
        expandHelper(name, value, {
            borderTopLeftRadius: PX_PERCENT_DEFINITION,
            borderTopRightRadius: PX_PERCENT_DEFINITION,
            borderBottomRightRadius: PX_PERCENT_DEFINITION,
            borderBottomLeftRadius: PX_PERCENT_DEFINITION,
        })
    ),
    BORDERTOPLEFTRADIUS: createStyle('borderTopLeftRadius', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL }),
    BORDERTOPRIGHTRADIUS: createStyle('borderTopRightRadius', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL }),
    BORDERBOTTOMLEFTRADIUS: createStyle('borderBottomLeftRadius', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL }),
    BORDERBOTTOMRIGHTRADIUS: createStyle('borderBottomRightRadius', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL }),
    BORDERTOPSTYLE: createStyle('borderTopStyle', (name, value) => [
        { name, value, definition: BORDER_DEFINITION },
    ], { record_parts: RECORD_PANEL | RECORD_GLYPHS }),
    BORDERLEFTSTYLE: createStyle('borderLeftStyle', (name, value) => [
        { name, value, definition: BORDER_DEFINITION },
    ], { record_parts: RECORD_PANEL | RECORD_GLYPHS }),
    BORDERRIGHTSTYLE: createStyle('borderRightStyle', (name, value) => [
        { name, value, definition: BORDER_DEFINITION },
    ], { record_parts: RECORD_PANEL | RECORD_GLYPHS }),
    BORDERBOTTOMSTYLE: createStyle('borderBottomStyle', (name, value) => [
        { name, value, definition: BORDER_DEFINITION },
    ], { record_parts: RECORD_PANEL }),
    BORDERTOPCOLOR: createStyle('borderTopColor', (name, value) => [
        { name, value, definition: COLOR_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL | RECORD_GLYPHS }),
    BORDERLEFTCOLOR: createStyle('borderLeftColor', (name, value) => [
        { name, value, definition: COLOR_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL | RECORD_GLYPHS }),
    BORDERRIGHTCOLOR: createStyle('borderRightColor', (name, value) => [
        { name, value, definition: COLOR_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL | RECORD_GLYPHS }),
    BORDERBOTTOMCOLOR: createStyle('borderBottomColor', (name, value) => [
        { name, value, definition: COLOR_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL }),
    BACKGROUNDCOLOR: createStyle('backgroundColor', (name, value) => [
        { name, value, definition: COLOR_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL }),
    BACKGROUNDIMAGE: createStyle('backgroundImage', (name, value) => [
        { name, value, definition: BACKGROUNDIMAGE_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL }),
    BACKGROUNDSIZE: createStyle('backgroundSize', (name, value) =>
        expandHelper(name, value, {
            backgroundSizeWidth: BACKGROUND_SIZE_DEFINITION,
            backgroundSizeHeight: BACKGROUND_SIZE_DEFINITION,
        })
    ),
    BACKGROUNDSIZEWIDTH: createStyle('backgroundSizeWidth', (name, value) => [
        { name, value, definition: BACKGROUND_SIZE_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL }),
    BACKGROUNDSIZEHEIGHT: createStyle('backgroundSizeHeight', (name, value) => [
        { name, value, definition: BACKGROUND_SIZE_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL }),
    BACKGROUNDPOSITION: createStyle('backgroundPosition', (name, value) =>
        expandHelper(name, value, {
            backgroundPositionX: BACKGROUND_POSITION_DEFINITION,
            backgroundPositionY: BACKGROUND_POSITION_DEFINITION,
        })
    ),
    BACKGROUNDPOSITIONX: createStyle('backgroundPositionX', (name, value) => [
        { name, value, definition: BACKGROUND_POSITION_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL }),
    BACKGROUNDPOSITIONY: createStyle('backgroundPositionY', (name, value) => [
        { name, value, definition: BACKGROUND_POSITION_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL }),
    BACKGROUNDREPEAT: createStyle('backgroundRepeat', (name, value) => [
        { name, value, definition: BACKGROUND_REPEAT_DEFINITION },
    ], { painter: true, record_parts: RECORD_PANEL }),
    COLOR: createStyle('color', (name, value) => [
        { name, value, definition: COLOR_DEFINITION },
    ], { painter: true, record_parts: RECORD_TEXT_RUN }),
    FONTFAMILY: createStyle('fontFamily', (name, value) => [
        { name, value, definition: FONT_FAMILY_DEFINITION },
    ], { record_parts: RECORD_TEXT }),
    FONTSIZE: createStyle('fontSize', (name, value) => [
        { name, value, definition: FONT_SIZE_DEFINITION },
    ], { record_parts: RECORD_TEXT }),
    LINEHEIGHT: createStyle('lineHeight', (name, value) => [
        { name, value, definition: LINE_HEIGHT_DEFINITION },
    ], { record_parts: RECORD_GLYPHS }),
    LETTERSPACING: createStyle('letterSpacing', (name, value) => [
        { name, value, definition: LETTER_SPACING_DEFINITION },
    ], { record_parts: RECORD_GLYPHS }),
    TEXTALIGN: createStyle('textAlign', (name, value) => [
        { name, value, definition: TEXT_ALIGN_DEFINITION },
    ], { painter: true, record_parts: RECORD_GLYPHS }),
    WHITESPACE: createStyle('whiteSpace', (name, value) => [
        { name, value, definition: WHITE_SPACE_DEFINITION },
    ], { record_parts: RECORD_GLYPHS }),

    // YOGA PROPERTIES
    POSITION: createStyle('position', (name, value) => [
        { name, value, definition: POSITION_DEFINITION },
    ]),
    TOP: createStyle('top', (name, value) => [
        { name, value, definition: OFFSET_DEFINITION }
    ]),
    LEFT: createStyle('left', (name, value) => [
        { name, value, definition: OFFSET_DEFINITION }
    ]),
    RIGHT: createStyle('right', (name, value) => [
        { name, value, definition: OFFSET_DEFINITION }
    ]),
    BOTTOM: createStyle('bottom', (name, value) => [
        { name, value, definition: OFFSET_DEFINITION },
    ]),
    ALIGNCONTENT: createStyle('alignContent', (name, value) => [
        { name, value, definition: ALIGN_CONTENT_DEFINITION },
    ]),
    ALIGNITEMS: createStyle('alignItems', (name, value) => [
        { name, value, definition: ALIGN_ITEMS_DEFINITION },
    ]),
    ALIGNSELF: createStyle('alignSelf', (name, value) => [
        { name, value, definition: ALIGN_SELF_DEFINITION },
    ]),
    FLEXDIRECTION: createStyle('flexDirection', (name, value) => [
        { name, value, definition: FLEX_DIRECTION_DEFINITION },
    ]),
    FLEXWRAP: createStyle('flexWrap', (name, value) => [
        { name, value, definition: FLEX_WRAP_DEFINITION },
    ]),
    JUSTIFYCONTENT: createStyle('justifyContent', (name, value) => [
        { name, value, definition: JUSTIFY_CONTENT_DEFINITION },
    ]),
    MARGIN: createStyle('margin', (name, value) => 
        expandHelper(name, value, {
            marginTop: MARGIN_DEFINITION,
            marginRight: MARGIN_DEFINITION,
            marginBottom: MARGIN_DEFINITION,
            marginLeft: MARGIN_DEFINITION,
        })
    ),
    MARGINTOP: createStyle('marginTop', (name, value) => [
        { name, value, definition: MARGIN_DEFINITION },
    ]),
    MARGINLEFT: createStyle('marginLeft', (name, value) => [
        { name, value, definition: MARGIN_DEFINITION },
    ]),
    MARGINRIGHT: createStyle('marginRight', (name, value) => [
        { name, value, definition: MARGIN_DEFINITION },
    ]),
    MARGINBOTTOM: createStyle('marginBottom', (name, value) => [
        { name, value, definition: MARGIN_DEFINITION },
    ]),
    FLEX: createStyle('flex', (name, value) => 
        expandHelper(name, value, {
            flexGrow: NUMBER_DEFINITION,
            flexShrink: NUMBER_DEFINITION,
            flexBasis: FLEX_BASIS_DEFINITION,
        })
    ),
    FLEXGROW: createStyle('flexGrow', (name, value) => [
        { name, value, definition: NUMBER_DEFINITION },
    ]),
    FLEXSHRINK: createStyle('flexShrink', (name, value) => [
        { name, value, definition: NUMBER_DEFINITION },
    ]),
    FLEXBASIS: createStyle('flexBasis', (name, value) => [
        { name, value, definition: FLEX_BASIS_DEFINITION },
    ]),
    WIDTH: createStyle('width', (name, value) => [
        { name, value, definition: SIZE_DEFINITION }
    ]),
    HEIGHT: createStyle('height', (name, value) => [
        { name, value, definition: SIZE_DEFINITION }
    ]),
    MINWIDTH: createStyle('minWidth', (name, value) => [
        { name, value, definition: MIN_MAX_SIZE_DEFINITION },
    ]),
    MINHEIGHT: createStyle('minHeight', (name, value) => [
        { name, value, definition: MIN_MAX_SIZE_DEFINITION },
    ]),
    MAXWIDTH: createStyle('maxWidth', (name, value) => [
        { name, value, definition: MIN_MAX_SIZE_DEFINITION },
    ]),
    MAXHEIGHT: createStyle('maxHeight', (name, value) => [
        { name, value, definition: MIN_MAX_SIZE_DEFINITION },
    ]),
    BOXSIZING: createStyle('boxSizing', (name, value) => [
        { name, value, definition: BOX_SIZING_DEFINITION },
    ]),
    ASPECTRATIO: createStyle('aspectRatio', (name, value) => [
        { name, value, definition: NUMBER_DEFINITION },
    ]),
    BORDERTOPWIDTH: createStyle('borderTopWidth', (name, value) => [
        { name, value, definition: BORDER_WIDTH_DEFINITION },
    ], { record_parts: RECORD_PANEL | RECORD_GLYPHS }),
    BORDERLEFTWIDTH: createStyle('borderLeftWidth', (name, value) => [
        { name, value, definition: BORDER_WIDTH_DEFINITION },
    ], { record_parts: RECORD_PANEL | RECORD_GLYPHS }),
    BORDERRIGHTWIDTH: createStyle('borderRightWidth', (name, value) => [
        { name, value, definition: BORDER_WIDTH_DEFINITION },
    ], { record_parts: RECORD_PANEL | RECORD_GLYPHS }),
    BORDERBOTTOMWIDTH: createStyle('borderBottomWidth', (name, value) => [
        { name, value, definition: BORDER_WIDTH_DEFINITION },
    ], { record_parts: RECORD_PANEL }),
    DISPLAY: createStyle('display', (name, value) => [
        { name, value, definition: DISPLAY_DEFINITION },
    ]),
    POINTEREVENTS: createStyle('pointerEvents', (name, value) => [
        { name, value, definition: POINTER_EVENTS_DEFINITION },
    ], { painter: true, record_parts: 0 }),
    DIRECTION: createStyle('direction', (name, value) => [
        { name, value, definition: DIRECTION_DEFINITION },
    ]),
    PADDING: createStyle('padding', (name, value) => 
        expandHelper(name, value, {
            paddingTop: PX_PERCENT_DEFINITION,
            paddingRight: PX_PERCENT_DEFINITION,
            paddingBottom: PX_PERCENT_DEFINITION,
            paddingLeft: PX_PERCENT_DEFINITION,
        })
    ),
    PADDINGTOP: createStyle('paddingTop', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    PADDINGLEFT: createStyle('paddingLeft', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    PADDINGRIGHT: createStyle('paddingRight', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    PADDINGBOTTOM: createStyle('paddingBottom', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    GAP: createStyle('gap', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION }
    ]),
    ROWGAP: createStyle('rowGap', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    COLUMNGAP: createStyle('columnGap', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
}

export const STYLE_BY_NAME = Object.fromEntries(Object.values(STYLE).map((style) => [style.name, style]))

type NumberStyle = { unit: string, non_negative: boolean, max_one: boolean, integer: boolean }

const PX_NUMBER: NumberStyle = { unit: UNIT.PX, non_negative: true, max_one: false, integer: false }
const SIGNED_PX_NUMBER: NumberStyle = { unit: UNIT.PX, non_negative: false, max_one: false, integer: false }
const NON_NEGATIVE_NUMBER: NumberStyle = { unit: '', non_negative: true, max_one: false, integer: false }
const OPACITY_NUMBER: NumberStyle = { unit: '', non_negative: true, max_one: true, integer: false }
const INTEGER_NUMBER: NumberStyle = { unit: '', non_negative: false, max_one: false, integer: true }

// A number follows the first rule of the style's string definition: lengths are px, the rest are unitless.
export const NUMBER_STYLE = {
    zIndex: INTEGER_NUMBER,
    opacity: OPACITY_NUMBER,
    translateX: SIGNED_PX_NUMBER,
    translateY: SIGNED_PX_NUMBER,
    scaleX: NON_NEGATIVE_NUMBER,
    scaleY: NON_NEGATIVE_NUMBER,
    borderTopLeftRadius: PX_NUMBER,
    borderTopRightRadius: PX_NUMBER,
    borderBottomLeftRadius: PX_NUMBER,
    borderBottomRightRadius: PX_NUMBER,
    backgroundSizeWidth: PX_NUMBER,
    backgroundSizeHeight: PX_NUMBER,
    backgroundPositionX: SIGNED_PX_NUMBER,
    backgroundPositionY: SIGNED_PX_NUMBER,
    fontSize: PX_NUMBER,
    lineHeight: NON_NEGATIVE_NUMBER,
    letterSpacing: SIGNED_PX_NUMBER,
    top: SIGNED_PX_NUMBER,
    left: SIGNED_PX_NUMBER,
    right: SIGNED_PX_NUMBER,
    bottom: SIGNED_PX_NUMBER,
    marginTop: SIGNED_PX_NUMBER,
    marginLeft: SIGNED_PX_NUMBER,
    marginRight: SIGNED_PX_NUMBER,
    marginBottom: SIGNED_PX_NUMBER,
    flexGrow: NON_NEGATIVE_NUMBER,
    flexShrink: NON_NEGATIVE_NUMBER,
    flexBasis: PX_NUMBER,
    width: PX_NUMBER,
    height: PX_NUMBER,
    minWidth: PX_NUMBER,
    minHeight: PX_NUMBER,
    maxWidth: PX_NUMBER,
    maxHeight: PX_NUMBER,
    aspectRatio: NON_NEGATIVE_NUMBER,
    borderTopWidth: PX_NUMBER,
    borderLeftWidth: PX_NUMBER,
    borderRightWidth: PX_NUMBER,
    borderBottomWidth: PX_NUMBER,
    paddingTop: PX_NUMBER,
    paddingLeft: PX_NUMBER,
    paddingRight: PX_NUMBER,
    paddingBottom: PX_NUMBER,
    gap: PX_NUMBER,
    rowGap: PX_NUMBER,
    columnGap: PX_NUMBER,
} satisfies Partial<Record<StyleName, NumberStyle>>

export type NumberStyleName = keyof typeof NUMBER_STYLE

export default {
    validateStyle,
    resolveStyle,
    computeStyleValue,
    STYLE,
}
