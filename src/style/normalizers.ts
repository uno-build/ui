export function normalizeStyleName(name: string, STYLE: Record<string, { name: string }>) {
    const style = STYLE[normalizeStyleKey(name)]

    if (style) {
        return style.name
    }

    name = name.trim()

    if (name.includes('-')) {
        return name.toLowerCase().replace(/-([a-z])/g, (_: string, char: string) => char.toUpperCase())
    }

    return name.charAt(0).toLowerCase() + name.slice(1)
}

export function normalizeStyleKey(name: string) {
    return name.trim().replace(/-/g, '').toUpperCase()
}

export function normalizeTrim(value: string) {
    return value.trim()
}

export function normalizeToLowercase(value: string) {
    return value.toLowerCase()
}
