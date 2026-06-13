export function normalizeStyleName(name: string, STYLE) {
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

export function normalizeStyleKey(name: string) {
    return name.trim().replace(/-/g, '').toUpperCase()
}

export function normalizeStyleValue(value: string) {
    return value.trim().toLowerCase()
}
