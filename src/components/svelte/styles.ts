import { resolveStyle, validateStyle } from '../../style'
import { normalizeStyleKey } from '../../style/normalizers'
import type { StyleProps } from '../../style/types'

export type CssSelector = {
    parts: {
        tag?: string
        ids: string[]
        classes: string[]
        combinator: ' ' | '>' | null
    }[]
    specificity: [number, number, number]
}

export type CssRule = {
    selectors: CssSelector[]
    declarations: { name: string, value: string, important: boolean }[]
}

export type StyleElement = {
    name: string
    tag_name?: string
    class_name: string
    id?: string
    parent: StyleElement | null
}

export function normalizeClass(value: unknown): string {
    if (Array.isArray(value)) {
        return value.filter((item) => item && typeof item !== 'boolean').map(normalizeClass).filter(Boolean).join(' ')
    }
    if (value !== null && typeof value === 'object') {
        return Object.keys(value).filter((key) => (value as Record<string, unknown>)[key]).join(' ')
    }
    return String(value ?? '')
}

export function parseDeclarations(source: string): CssRule['declarations'] {
    const declarations: CssRule['declarations'] = []
    let declaration = ''
    let quote = ''
    let depth = 0
    let important_index = -1

    function appendDeclaration() {
        const colon = declaration.indexOf(':')
        if (colon !== -1) {
            const name = declaration.slice(0, colon).trim()
            const important = important_index > colon && /^!\s*important\s*$/i.test(declaration.slice(important_index))
            const value = declaration.slice(colon + 1, important ? important_index : undefined).trim()
            if (name !== '' && value !== '') declarations.push({ name, value, important })
        }
        declaration = ''
        important_index = -1
    }

    for (let index = 0; index < source.length; index++) {
        const char = source[index]!
        if (char === '\\') {
            declaration += source.slice(index, index + 2)
            index++
            continue
        }
        if (quote !== '') {
            declaration += char
            if (char === quote) quote = ''
            continue
        }
        if (char === '/' && source[index + 1] === '*') {
            const comment_end = source.indexOf('*/', index + 2)
            index = comment_end === -1 ? source.length : comment_end + 1
            declaration += ' '
            continue
        }
        if (char === '"' || char === "'") quote = char
        else if (char === '(' || char === '[') depth++
        else if (char === ')' || char === ']') depth--
        else if (depth === 0 && char === '!') important_index = declaration.length
        else if (depth === 0 && char === ';') {
            appendDeclaration()
            continue
        }
        declaration += char
    }
    appendDeclaration()
    return declarations
}

function comparePriority(left: number[], right: number[]) {
    for (let index = 0; index < left.length; index++) {
        const difference = left[index]! - right[index]!
        if (difference !== 0) return difference
    }
    return 0
}

function matchesSelector(element: StyleElement, selector: CssSelector, index = selector.parts.length - 1): boolean {
    const part = selector.parts[index]!
    if (part.tag !== undefined && part.tag !== '*' && part.tag !== (element.tag_name ?? element.name)) return false
    if (part.ids.some((id) => id !== element.id)) return false
    const classes = element.class_name.split(/\s+/)
    if (part.classes.some((class_name) => !classes.includes(class_name))) return false
    if (index === 0) return true

    let ancestor = element.parent
    if (part.combinator === '>') {
        return ancestor !== null && matchesSelector(ancestor, selector, index - 1)
    }
    while (ancestor !== null) {
        if (matchesSelector(ancestor, selector, index - 1)) return true
        ancestor = ancestor.parent
    }
    return false
}

export function resolveStyles(element: StyleElement, rules: Iterable<CssRule[]>, inline_style?: StyleProps | string | null): StyleProps {
    const styles: StyleProps = {}
    const priorities = new Map<string, number[]>()

    function applyDeclaration(name: string, value: string, priority: number[]) {
        const expanded = normalizeStyleKey(name) === 'OBJECTFIT'
            ? [{ name: 'objectFit', value }]
            : resolveStyle(validateStyle(name, value), value).expanded

        for (const style of expanded) {
            for (const name of style.name === 'gap' ? ['rowGap', 'columnGap'] : [style.name]) {
                const previous_priority = priorities.get(name)
                if (previous_priority !== undefined && comparePriority(priority, previous_priority) < 0) continue
                styles[name] = style.value
                priorities.set(name, priority)
            }
        }
    }

    for (const stylesheet of rules) {
        for (const rule of stylesheet) {
            let specificity: CssSelector['specificity'] | undefined
            for (const selector of rule.selectors) {
                if (matchesSelector(element, selector) && (specificity === undefined || comparePriority(selector.specificity, specificity) > 0)) {
                    specificity = selector.specificity
                }
            }
            if (specificity === undefined) continue
            for (const declaration of rule.declarations) {
                applyDeclaration(declaration.name, declaration.value, [Number(declaration.important), 0, ...specificity])
            }
        }
    }
    if (typeof inline_style === 'string') {
        for (const declaration of parseDeclarations(inline_style)) {
            applyDeclaration(declaration.name, declaration.value, [Number(declaration.important), 1, 0, 0, 0])
        }
    } else {
        for (const name in inline_style) {
            const value = inline_style[name]
            if (value !== undefined) applyDeclaration(name, value, [0, 1, 0, 0, 0])
        }
    }
    return styles
}
