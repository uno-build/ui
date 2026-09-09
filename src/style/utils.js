import { UNIT } from './constants'
import { parseEnum } from './parsers'
import { validateEnum } from './validators'

/**
 * @param {string} value
 */
export function readUnit(value) {
    const regex = new RegExp(`^(-?(?:\\d+|\\d*\\.\\d+))(${Object.values(UNIT).join('|')})$`, 'i')
    const match = value.match(regex)

    if (!match) {
        return undefined
    }

    return { value: Number(match[1]), kind: match[2] }
}

/**
 * @param {any} value
 */
export function readNumber(value) {
    if (!/^-?(?:\d+|\d*\.\d+)$/.test(value)) {
        return undefined
    }

    const number = Number(value)
    return Number.isFinite(number) ? number : undefined
}

/**
 * @param {any} value
 */
export function readInteger(value) {
    if (!/^-?\d+$/.test(value)) {
        return undefined
    }

    const integer = Number(value)
    return Number.isFinite(integer) && Number.isInteger(integer) ? integer : undefined
}

/**
 * @param {[] | undefined} fns
 * @param {any} value
 * @param {any} context
 */
export function runPipeline(fns = [], value, context) {
    return fns.reduce((current, fn) => fn(current, context), value)
}

/**
 * @param {[] | undefined} fns
 * @param {any} value
 */
export function runValidators(fns = [], value) {
    for (const fn of fns) {
        fn(value)
    }
}

/**
 * @param {Record<string, any>} values
 */
export function createEnumValidator(values) {
    return /** @param {string} value */ (value) => validateEnum(value, values)
}

/**
 * @param {Record<string, any>} values
 */
export function createEnumParser(values) {
    return /** @param {string} value */ (value) => parseEnum(value, values)
}
