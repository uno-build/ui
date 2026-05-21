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
        const result = style.parser(value)
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

function parseString(value: any) {
    return {
        value: typeof value === 'string' ? value.trim().toLowerCase() : value,
    }
}

function parseColor(value: any) {
    value = parseString(value).value
    if (
        typeof value !== 'string' ||
        !/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)
    ) {
        throw new Error('expected hex color')
    }
    return { value, parsed: { rgba: parseRgba(value) } }
}

function parseEnum(value, values: Record<string, any>) {
    value = parseString(value).value
    if (!values.hasOwnProperty(value)) {
        throw new Error(`expected one of ${Object.keys(values).join(', ')}`)
    }
    return { value }
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

type StyleParseResult = {
    value: any
    parsed?: Record<string, any>
}

const STYLE: Record<
    string,
    { name: string; parser: (value: any) => StyleParseResult }
> = {
    BACKGROUNDCOLOR: {
        name: 'backgroundColor',
        parser: parseColor,
    },
    ALIGNITEMS: {
        name: 'alignItems',
        parser: (value) => parseEnum(value, OPTION_ALIGN),
    },
    FLEXDIRECTION: {
        name: 'flexDirection',
        parser: (value) => parseEnum(value, OPTION_FLEX_DIRECTION),
    },
    GAP: {
        name: 'gap',
        parser: parseString,
    },
    JUSTIFYCONTENT: {
        name: 'justifyContent',
        parser: (value) => parseEnum(value, OPTION_JUSTIFY),
    },
    POSITION: {
        name: 'position',
        parser: (value) => parseEnum(value, OPTION_POSITION),
    },
    OVERFLOW: {
        name: 'overflow',
        parser: (value) => parseEnum(value, OPTION_OVERFLOW),
    },
    DISPLAY: {
        name: 'display',
        parser: (value) => parseEnum(value, OPTION_DISPLAY),
    },
    DIRECTION: {
        name: 'direction',
        parser: (value) => parseEnum(value, OPTION_DIRECTION),
    },
    BOXSIZING: {
        name: 'boxSizing',
        parser: (value) => parseEnum(value, OPTION_BOX_SIZING),
    },
    FLEXWRAP: {
        name: 'flexWrap',
        parser: (value) => parseEnum(value, OPTION_WRAP),
    },
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
