/**
 * @param {string} name
 */
export function normalizeStyleName(name, STYLE) {
    const style = STYLE[normalizeStyleKey(name)]

    if (style) {
        return style.name
    }

    name = name.trim()

    if (name.includes('-')) {
        return name.toLowerCase().replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    }

    return name.charAt(0).toLowerCase() + name.slice(1)
}

/**
 * @param {string} name
 */
export function normalizeStyleKey(name) {
    return name.trim().replace(/-/g, '').toUpperCase()
}

/**
 * @param {string} value
 */
export function normalizeTrim(value) {
    return value.trim()
}

/**
 * @param {string} value
 */
export function normalizeToLowercase(value) {
    return value.toLowerCase()
}
