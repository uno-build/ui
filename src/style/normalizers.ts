import { readNumber } from './utils.ts'

export function normalizeNumber(value: any) {
    const number = readNumber(value)
    return number === undefined ? value : number
}

export function normalizeStyleKey(name: string) {
    return name.trim().replace(/-/g, '').toUpperCase()
}

export function normalizeString(value: any) {
    return String(value).trim().toLowerCase()
}

export function normalizeUnit(value: any) {
    return typeof value === 'number' ? value : normalizeString(value)
}

export function normalizeStyleName(name: string, STYLE) {
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
