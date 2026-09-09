import { KEYWORD, UNIT } from './constants'
import { readInteger, readNumber, readUnit } from './utils'

const LENGTH_UNITS = [UNIT.PX, UNIT.REM, UNIT.VW, UNIT.VH]

/**
 * @param {string} value
 */
export function validateColor(value) {
    if (typeof value !== 'string' || !/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
        throw new Error('expected hex color')
    }
}

/**
 * @param {string} value
 */
export function validateBoxShadow(value) {
    const values = value.split(/\s+/)
    if (values.length !== 4 && values.length !== 5) {
        throw new Error('expected offset-x offset-y blur-radius spread-radius color')
    }

    for (const shadow_value of values.slice(0, 4)) {
        validateLength(shadow_value)
    }

    if (readUnit(values[2]).value < 0) {
        throw new Error('expected non-negative blur radius')
    }

    if (values[4] !== undefined) {
        validateColor(values[4])
    }
}

/**
 * @param {string} value
 */
export function validateTextShadow(value) {
    const values = value.split(/\s+/)
    if (values.length !== 3 && values.length !== 4) {
        throw new Error('expected offset-x offset-y blur-radius color')
    }

    for (const shadow_value of values.slice(0, 3)) {
        validateLength(shadow_value)
    }

    if (readUnit(values[2]).value < 0) {
        throw new Error('expected non-negative blur radius')
    }

    if (values[3] !== undefined) {
        validateColor(values[3])
    }
}

/**
 * @param {string} value
 */
export function validateTextStroke(value) {
    const values = value.split(/\s+/)
    if (values.length !== 2) {
        throw new Error('expected width color')
    }

    validateLength(values[0])
    if (readUnit(values[0]).value < 0) {
        throw new Error('expected non-negative width')
    }
    validateColor(values[1])
}
/**
 * @param {string} value
 * @param {Record<string, any>} values
 */
export function validateEnum(value, values) {
    if (typeof value !== 'string' || !Object.prototype.hasOwnProperty.call(values, value)) {
        throw new Error(`expected one of ${Object.keys(values).join(', ')}`)
    }
}
/**
 * @param {any} value
 */
export function validateAuto(value) {
    if (value !== KEYWORD.AUTO) {
        throw new Error('expected auto')
    }
}

/**
 * @param {any} value
 */
export function validateUnset(value) {
    if (value !== KEYWORD.UNSET) {
        throw new Error('expected unset')
    }
}

/**
 * @param {string} value
 */
export function validateNotUnset(value) {
    if (value.toLowerCase() === KEYWORD.UNSET) {
        throw new Error('expected value')
    }
}

/**
 * @param {string} value
 */
export function validateImageSrc(value) {
    if (value.toLowerCase() === KEYWORD.UNSET) {
        throw new Error('expected image src')
    }
}

/**
 * @param {any} value
 */
export function validateNumber(value) {
    if (readNumber(value) === undefined) {
        throw new Error('expected number')
    }
}

/**
 * @param {any} value
 */
export function validateInteger(value) {
    if (readInteger(value) === undefined) {
        throw new Error('expected integer')
    }
}

/**
 * @param {string} value
 */
export function validatePx(value) {
    const parsed = readUnit(value)
    if (parsed === undefined || parsed.kind !== UNIT.PX) {
        throw new Error('expected px unit')
    }
}

/**
 * @param {string} value
 */
export function validateLength(value) {
    const parsed = readUnit(value)
    if (parsed === undefined || !LENGTH_UNITS.includes(parsed.kind)) {
        throw new Error('expected px, rem, vw or vh unit')
    }
}

/**
 * @param {string} value
 */
export function validatePercent(value) {
    const parsed = readUnit(value)
    if (parsed === undefined || parsed.kind !== UNIT.PERCENT) {
        throw new Error('expected % unit')
    }
}

/**
 * @param {string} value
 */
export function validateRem(value) {
    const parsed = readUnit(value)
    if (parsed === undefined || parsed.kind !== UNIT.REM) {
        throw new Error('expected rem unit')
    }
}

/**
 * @param {string} value
 */
export function validateVw(value) {
    const parsed = readUnit(value)
    if (parsed === undefined || parsed.kind !== UNIT.VW) {
        throw new Error('expected vw unit')
    }
}

/**
 * @param {string} value
 */
export function validateVh(value) {
    const parsed = readUnit(value)
    if (parsed === undefined || parsed.kind !== UNIT.VH) {
        throw new Error('expected vh unit')
    }
}

/**
 * @param {any} value
 */
export function validateNonNegative(value) {
    const number = readNumber(value) ?? (readUnit(value) ?? readUnit(value))?.value

    if (number !== undefined && number < 0) {
        throw new Error('expected non-negative value')
    }
}

/**
 * @param {any} value
 */
export function validateMaxOne(value) {
    const number = readNumber(value)

    if (number !== undefined && number > 1) {
        throw new Error('expected value between 0 and 1')
    }
}
