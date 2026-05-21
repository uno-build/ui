export default {
    resolveStyle,
    normalizeStyleName,
}

// if (typeof window !== 'undefined') {
//     window.Style = {
//         resolveStyle,
//         normalizeStyleName,
//     }
// }

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
        return { name: style.name, value: style.parser(value) }
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
    return typeof value === 'string' ? value.trim().toLowerCase() : value
}

function parseColor(value: any) {
    value = parseString(value)
    if (
        typeof value !== 'string' ||
        (!/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) &&
            !CSS_COLOR_NAMES.has(value))
    ) {
        throw new Error('expected color')
    }
    return value
}

function parseEnum(values: Record<string, unknown>) {
    return (value: any) => {
        value = parseString(value)
        if (!Object.prototype.hasOwnProperty.call(values, value)) {
            throw new Error(`expected one of ${Object.keys(values).join(', ')}`)
        }
        return value
    }
}

const STYLE: Record<string, { name: string; parser: (value: any) => any }> = {
    ALIGNITEMS: {
        name: 'alignItems',
        parser: parseString,
    },
    BACKGROUNDCOLOR: {
        name: 'backgroundColor',
        parser: parseColor,
    },
    BORDER: {
        name: 'border',
        parser: parseString,
    },
    BORDERRADIUS: {
        name: 'borderRadius',
        parser: parseString,
    },
    BOTTOM: {
        name: 'bottom',
        parser: parseString,
    },
    FLEX: {
        name: 'flex',
        parser: parseString,
    },
    FLEXDIRECTION: {
        name: 'flexDirection',
        parser: parseString,
    },
    GAP: {
        name: 'gap',
        parser: parseString,
    },
    HEIGHT: {
        name: 'height',
        parser: parseString,
    },
    JUSTIFYCONTENT: {
        name: 'justifyContent',
        parser: parseString,
    },
    LEFT: {
        name: 'left',
        parser: parseString,
    },
    PADDING: {
        name: 'padding',
        parser: parseString,
    },
    POSITION: {
        name: 'position',
        parser: parseEnum({
            static: 0,
            relative: 1,
            absolute: 2,
        }),
    },
    RIGHT: {
        name: 'right',
        parser: parseString,
    },
    TOP: {
        name: 'top',
        parser: parseString,
    },
    WIDTH: {
        name: 'width',
        parser: parseString,
    },
}

const CSS_COLOR_NAMES = new Set(['blue', 'green', 'lightgray', 'red', 'yellow'])
