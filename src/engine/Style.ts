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
        parsed: unit,
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
const OPTION_ALIGN = {
    auto: 0,
    'flex-start': 1,
    center: 2,
    'flex-end': 3,
    stretch: 4,
    baseline: 5,
    'space-between': 6,
    'space-around': 7,
    'space-evenly': 8,
}
const OPTION_FLEX_DIRECTION = {
    column: 0,
    'column-reverse': 1,
    row: 2,
    'row-reverse': 3,
}
const OPTION_WRAP = {
    'no-wrap': 0,
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
const OPTION_EDGE = {
    left: 0,
    top: 1,
    right: 2,
    bottom: 3,
    start: 4,
    end: 5,
    horizontal: 6,
    vertical: 7,
    all: 8,
}
const OPTION_GUTTER = {
    column: 0,
    row: 1,
    all: 2,
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

const STYLE: Record<string, StyleDefinition> = {
    BACKGROUNDCOLOR: {
        name: 'backgroundColor',
        normalize: normalizeString,
        validate: validateColor,
        parser: parseColor,
    },
    ALIGNITEMS: {
        name: 'alignItems',
        normalize: normalizeString,
        validate: (value) => validateEnum(value, OPTION_ALIGN),
        parser: (value) => parseEnum(value, OPTION_ALIGN),
    },
    FLEXDIRECTION: {
        name: 'flexDirection',
        normalize: normalizeString,
        validate: (value) => validateEnum(value, OPTION_FLEX_DIRECTION),
        parser: (value) => parseEnum(value, OPTION_FLEX_DIRECTION),
    },
    GAP: {
        name: 'gap',
        normalize: normalizeUnit,
        validate: validateUnit,
        parser: parseUnit,
    },
    JUSTIFYCONTENT: {
        name: 'justifyContent',
        normalize: normalizeString,
        validate: (value) => validateEnum(value, OPTION_JUSTIFY),
        parser: (value) => parseEnum(value, OPTION_JUSTIFY),
    },
    POSITION: {
        name: 'position',
        normalize: normalizeString,
        validate: (value) => validateEnum(value, OPTION_POSITION),
        parser: (value) => parseEnum(value, OPTION_POSITION),
    },
    OVERFLOW: {
        name: 'overflow',
        normalize: normalizeString,
        validate: (value) => validateEnum(value, OPTION_OVERFLOW),
        parser: (value) => parseEnum(value, OPTION_OVERFLOW),
    },
    DISPLAY: {
        name: 'display',
        normalize: normalizeString,
        validate: (value) => validateEnum(value, OPTION_DISPLAY),
        parser: (value) => parseEnum(value, OPTION_DISPLAY),
    },
    DIRECTION: {
        name: 'direction',
        normalize: normalizeString,
        validate: (value) => validateEnum(value, OPTION_DIRECTION),
        parser: (value) => parseEnum(value, OPTION_DIRECTION),
    },
    BOXSIZING: {
        name: 'boxSizing',
        normalize: normalizeString,
        validate: (value) => validateEnum(value, OPTION_BOX_SIZING),
        parser: (value) => parseEnum(value, OPTION_BOX_SIZING),
    },
    FLEXWRAP: {
        name: 'flexWrap',
        normalize: normalizeString,
        validate: (value) => validateEnum(value, OPTION_WRAP),
        parser: (value) => parseEnum(value, OPTION_WRAP),
    },
}
