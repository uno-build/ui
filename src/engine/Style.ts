export default {
    resolveStyle,
    normalizeStyleName,
}

if (typeof window !== 'undefined') {
    window.Style = {
        resolveStyle,
        normalizeStyleName,
    }
}

export function resolveStyle(name: string, value: any) {
    // Validating name
    if (typeof name !== 'string') {
        throw new Error(`style name must be a string, got '${typeof name}'`)
    }
    const style = STYLE[normalizeStyleKey(name)]
    if (!style) {
        name = normalizeStyleName(name)
        throw new Error(`unsupported property '${name}'`)
    }

    // Validating value
    if (typeof value === 'undefined') {
        throw new Error(
            `style value for property '${style.name}' cannot be undefined`,
        )
    }
    try {
        const normalized = style.normalize(value)
        style.validate(normalized)
        const result = style.parser(normalized)
        return {
            name: style.name,
            ...result,
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : err
        const suffix = message ? `: ${message}` : ''
        throw new Error(
            `invalid value '${value}' for property '${style.name}'${suffix}`,
        )
    }
}

export function normalizeStyleName(name: string) {
    const style = STYLE[normalizeStyleKey(name)]
    if (style) {
        return style.name
    }

    name = name.trim()

    if (name.includes('-')) {
        return name
            .toLowerCase()
            .replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    }

    return name.charAt(0).toLowerCase() + name.slice(1)
}

function normalizeStyleKey(name: string) {
    return name.trim().replace(/-/g, '').toUpperCase()
}

function normalizeString(value: any) {
    return String(value).trim().toLowerCase()
}

function normalizeUnit(value: any) {
    return typeof value === 'number' ? value : normalizeString(value)
}

function validateColor(value: string) {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
        throw new Error('expected hex color')
    }
}

function parseColor(value: string) {
    return { value, parsed: { rgba: parseRgba(value) } }
}

function validateEnum(value: string, values: Record<string, any>) {
    if (!Object.prototype.hasOwnProperty.call(values, value)) {
        throw new Error(`expected one of ${Object.keys(values).join(', ')}`)
    }
}

function parseEnum(value: string, values: Record<string, any>) {
    return { value, parsed: { enum: values[value] } }
}

function validateUnit(value: string | number) {
    if (readUnit(value) === undefined) {
        throw new Error('expected px or % unit')
    }
}

function parseUnit(value: string | number) {
    const unit = readUnit(value)!
    return {
        value: `${String(unit.value)}${unit.unit}`,
        parsed: { ...unit, value: Math.abs(unit.value) },
    }
}

function readUnit(value: string | number) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? { value, unit: 'px' } : undefined
    }

    const match = value.match(/^(-?(?:\d+|\d*\.\d+))(px|%)?$/)
    if (!match) {
        return undefined
    }

    const number = Number(match[1])
    if (!Number.isFinite(number)) {
        return undefined
    }

    return { value: number, unit: match[2] ?? 'px' }
}

function parseRgba(value: string) {
    const hex = value.slice(1)
    const channels =
        hex.length <= 4
            ? hex.split('').map((channel) => parseInt(channel + channel, 16))
            : hex.match(/../g)!.map((channel) => parseInt(channel, 16))

    return [
        channels[0] / 255,
        channels[1] / 255,
        channels[2] / 255,
        channels[3] == null ? 1 : channels[3] / 255,
    ]
}

const OPTION_POSITION = {
    static: 0,
    relative: 1,
    absolute: 2,
}
const OPTION_ALIGN_CONTENT = {
    'flex-start': 1,
    center: 2,
    'flex-end': 3,
    stretch: 4,
    baseline: 5,
    'space-between': 6,
    'space-around': 7,
    'space-evenly': 8,
}
const OPTION_ALIGN_ITEMS = {
    normal: 0,
    'flex-start': 1,
    center: 2,
    'flex-end': 3,
    stretch: 4,
    baseline: 5,
}
const OPTION_ALIGN_SELF = {
    auto: 0,
    normal: 0,
    'flex-start': 1,
    center: 2,
    'flex-end': 3,
    stretch: 4,
    baseline: 5,
}
const OPTION_FLEX_DIRECTION = {
    column: 0,
    'column-reverse': 1,
    row: 2,
    'row-reverse': 3,
}
const OPTION_WRAP = {
    nowrap: 0,
    wrap: 1,
    'wrap-reverse': 2,
}
const OPTION_JUSTIFY = {
    'flex-start': 0,
    center: 1,
    'flex-end': 2,
    'space-between': 3,
    'space-around': 4,
    'space-evenly': 5,
}
const OPTION_OVERFLOW = {
    visible: 0,
    hidden: 1,
    scroll: 2,
}
const OPTION_DISPLAY = {
    flex: 0,
    none: 1,
    contents: 2,
}
const OPTION_DIRECTION = {
    inherit: 0,
    ltr: 1,
    rtl: 2,
}
const OPTION_BOX_SIZING = {
    'border-box': 0,
    'content-box': 1,
}

type StyleParseResult = {
    value: any
    parsed?: Record<string, any>
}

type StyleDefinition<T = any> = {
    name: string
    normalize: (value: any) => T
    validate: (value: T) => void
    parser: (value: T) => StyleParseResult
}

function normalizeUnitOrAuto(value: any) {
    return normalizeUnit(value)
}

function normalizeNumber(value: any) {
    const number = readNumber(value)
    return number === undefined ? value : number
}

function validateUnitOrAuto(value: string | number) {
    if (value === 'auto') {
        return
    }

    validateUnit(value)
}

function validateNumber(value: any) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error('expected number')
    }
}

function validateNonNegativeNumber(value: any) {
    validateNumber(value)
    if (value < 0) {
        throw new Error('expected non-negative number')
    }
}

function validateBorderWidth(value: string | number) {
    if (readBorderWidth(value) === undefined) {
        throw new Error('expected px border width')
    }
}

function parseUnitOrAuto(value: string | number) {
    if (value === 'auto') {
        return {
            value,
            parsed: { unit: 'auto' },
        }
    }

    return parseUnit(value)
}

function parseNumber(value: number) {
    return { value, parsed: { value } }
}

function parseBorderWidth(value: string | number) {
    const unit = readBorderWidth(value)!
    return {
        value: `${String(unit.value)}px`,
        parsed: unit,
    }
}

function readNumber(value: any) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined
    }

    if (typeof value !== 'string') {
        return undefined
    }

    const normalized = normalizeString(value)
    if (!/^-?(?:\d+|\d*\.\d+)$/.test(normalized)) {
        return undefined
    }

    const number = Number(normalized)
    return Number.isFinite(number) ? number : undefined
}

function readBorderWidth(value: string | number) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? { value, unit: 'px' } : undefined
    }

    const normalized = normalizeString(value)
    const keywordWidth = readBorderKeywordWidth(normalized)
    if (keywordWidth !== undefined) {
        return { value: keywordWidth, unit: 'px' }
    }

    for (const token of normalized.split(/\s+/)) {
        const unit = readUnit(token)
        if (unit?.unit === 'px') {
            return unit
        }

        const tokenKeywordWidth = readBorderKeywordWidth(token)
        if (tokenKeywordWidth !== undefined) {
            return { value: tokenKeywordWidth, unit: 'px' }
        }
    }

    return undefined
}

function readBorderKeywordWidth(value: string) {
    if (value === 'thin') {
        return 1
    }
    if (value === 'medium') {
        return 3
    }
    if (value === 'thick') {
        return 5
    }
}

function colorStyle(name: string): StyleDefinition<string> {
    return {
        name,
        normalize: normalizeString,
        validate: validateColor,
        parser: parseColor,
    }
}

function enumStyle(
    name: string,
    values: Record<string, any>,
): StyleDefinition<string> {
    return {
        name,
        normalize: normalizeString,
        validate: (value) => validateEnum(value, values),
        parser: (value) => parseEnum(value, values),
    }
}

function unitStyle(name: string): StyleDefinition<string | number> {
    return {
        name,
        normalize: normalizeUnit,
        validate: validateUnit,
        parser: parseUnit,
    }
}

function unitOrAutoStyle(name: string): StyleDefinition<string | number> {
    return {
        name,
        normalize: normalizeUnitOrAuto,
        validate: validateUnitOrAuto,
        parser: parseUnitOrAuto,
    }
}

function numberStyle(
    name: string,
    validate = validateNumber,
): StyleDefinition<number> {
    return {
        name,
        normalize: normalizeNumber,
        validate,
        parser: parseNumber,
    }
}

function borderWidthStyle(name: string): StyleDefinition<string | number> {
    return {
        name,
        normalize: normalizeUnit,
        validate: validateBorderWidth,
        parser: parseBorderWidth,
    }
}

const STYLE: Record<string, StyleDefinition> = {
    BACKGROUNDCOLOR: colorStyle('backgroundColor'),

    POSITION: enumStyle('position', OPTION_POSITION),
    TOP: unitOrAutoStyle('top'),
    LEFT: unitOrAutoStyle('left'),
    RIGHT: unitOrAutoStyle('right'),
    BOTTOM: unitOrAutoStyle('bottom'),

    ALIGNCONTENT: enumStyle('alignContent', OPTION_ALIGN_CONTENT),
    ALIGNITEMS: enumStyle('alignItems', OPTION_ALIGN_ITEMS),
    ALIGNSELF: enumStyle('alignSelf', OPTION_ALIGN_SELF),
    FLEXDIRECTION: enumStyle('flexDirection', OPTION_FLEX_DIRECTION),
    FLEXWRAP: enumStyle('flexWrap', OPTION_WRAP),
    JUSTIFYCONTENT: enumStyle('justifyContent', OPTION_JUSTIFY),

    MARGINTOP: unitOrAutoStyle('marginTop'),
    MARGINLEFT: unitOrAutoStyle('marginLeft'),
    MARGINRIGHT: unitOrAutoStyle('marginRight'),
    MARGINBOTTOM: unitOrAutoStyle('marginBottom'),
    MARGIN: unitOrAutoStyle('margin'),

    FLEXBASIS: unitOrAutoStyle('flexBasis'),
    FLEX: numberStyle('flex'),
    FLEXGROW: numberStyle('flexGrow', validateNonNegativeNumber),
    FLEXSHRINK: numberStyle('flexShrink', validateNonNegativeNumber),

    WIDTH: unitOrAutoStyle('width'),
    HEIGHT: unitOrAutoStyle('height'),
    MINWIDTH: unitStyle('minWidth'),
    MINHEIGHT: unitStyle('minHeight'),
    MAXWIDTH: unitStyle('maxWidth'),
    MAXHEIGHT: unitStyle('maxHeight'),
    BOXSIZING: enumStyle('boxSizing', OPTION_BOX_SIZING),
    ASPECTRATIO: numberStyle('aspectRatio', validateNonNegativeNumber),

    BORDERTOPWIDTH: borderWidthStyle('borderTopWidth'),
    BORDERLEFTWIDTH: borderWidthStyle('borderLeftWidth'),
    BORDERRIGHTWIDTH: borderWidthStyle('borderRightWidth'),
    BORDERBOTTOMWIDTH: borderWidthStyle('borderBottomWidth'),
    BORDERWIDTH: borderWidthStyle('borderWidth'),
    BORDER: borderWidthStyle('border'),

    OVERFLOW: enumStyle('overflow', OPTION_OVERFLOW),
    DISPLAY: enumStyle('display', OPTION_DISPLAY),
    DIRECTION: enumStyle('direction', OPTION_DIRECTION),

    PADDINGTOP: unitStyle('paddingTop'),
    PADDINGLEFT: unitStyle('paddingLeft'),
    PADDINGRIGHT: unitStyle('paddingRight'),
    PADDINGBOTTOM: unitStyle('paddingBottom'),
    PADDING: unitStyle('padding'),

    ROWGAP: unitStyle('rowGap'),
    COLUMNGAP: unitStyle('columnGap'),
    GAP: unitStyle('gap'),
}
