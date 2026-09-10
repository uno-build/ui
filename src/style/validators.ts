import { KEYWORD, UNIT } from './constants'
import { readInteger, readNumber, readUnit } from './utils'

const LENGTH_UNITS = [UNIT.PX, UNIT.REM, UNIT.VW, UNIT.VH]

export function validateColor(value: string) {
    if (typeof value !== 'string' || !/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
        throw new Error('expected hex color')
    }
}

export function validateBoxShadow(value: string) {
    const values = value.split(/\s+/)
    if (values.length !== 4 && values.length !== 5) {
        throw new Error('expected offset-x offset-y blur-radius spread-radius color')
    }

    for (const shadow_value of values.slice(0, 4)) {
        validateLength(shadow_value)
    }

    if (readUnit(values[2]!)!.value < 0) {
        throw new Error('expected non-negative blur radius')
    }

    if (values[4] !== undefined) {
        validateColor(values[4]!)
    }
}

export function validateTextShadow(value: string) {
    const values = value.split(/\s+/)
    if (values.length !== 3 && values.length !== 4) {
        throw new Error('expected offset-x offset-y blur-radius color')
    }

    for (const shadow_value of values.slice(0, 3)) {
        validateLength(shadow_value)
    }

    if (readUnit(values[2]!)!.value < 0) {
        throw new Error('expected non-negative blur radius')
    }

    if (values[3] !== undefined) {
        validateColor(values[3]!)
    }
}

export function validateTextStroke(value: string) {
    const values = value.split(/\s+/)
    if (values.length !== 2) {
        throw new Error('expected width color')
    }

    validateLength(values[0]!)
    if (readUnit(values[0]!)!.value < 0) {
        throw new Error('expected non-negative width')
    }
    validateColor(values[1]!)
}
export function validateEnum(value: string, values: Record<string, number>) {
    if (typeof value !== 'string' || !Object.prototype.hasOwnProperty.call(values, value)) {
        throw new Error(`expected one of ${Object.keys(values).join(', ')}`)
    }
}
export function validateAuto(value: string) {
    if (value !== KEYWORD.AUTO) {
        throw new Error('expected auto')
    }
}

export function validateUnset(value: string) {
    if (value !== KEYWORD.UNSET) {
        throw new Error('expected unset')
    }
}

export function validateNotUnset(value: string) {
    if (value.toLowerCase() === KEYWORD.UNSET) {
        throw new Error('expected value')
    }
}

export function validateImageSrc(value: string) {
    if (value.toLowerCase() === KEYWORD.UNSET) {
        throw new Error('expected image src')
    }
}

export function validateNumber(value: string) {
    if (readNumber(value) === undefined) {
        throw new Error('expected number')
    }
}

export function validateInteger(value: string) {
    if (readInteger(value) === undefined) {
        throw new Error('expected integer')
    }
}

export function validatePx(value: string) {
    const parsed = readUnit(value)
    if (parsed === undefined || parsed.kind !== UNIT.PX) {
        throw new Error('expected px unit')
    }
}

export function validateLength(value: string) {
    const parsed = readUnit(value)
    if (parsed === undefined || !LENGTH_UNITS.includes(parsed.kind)) {
        throw new Error('expected px, rem, vw or vh unit')
    }
}

export function validatePercent(value: string) {
    const parsed = readUnit(value)
    if (parsed === undefined || parsed.kind !== UNIT.PERCENT) {
        throw new Error('expected % unit')
    }
}

export function validateRem(value: string) {
    const parsed = readUnit(value)
    if (parsed === undefined || parsed.kind !== UNIT.REM) {
        throw new Error('expected rem unit')
    }
}

export function validateVw(value: string) {
    const parsed = readUnit(value)
    if (parsed === undefined || parsed.kind !== UNIT.VW) {
        throw new Error('expected vw unit')
    }
}

export function validateVh(value: string) {
    const parsed = readUnit(value)
    if (parsed === undefined || parsed.kind !== UNIT.VH) {
        throw new Error('expected vh unit')
    }
}

export function validateNonNegative(value: string) {
    const number = readNumber(value) ?? (readUnit(value) ?? readUnit(value))?.value

    if (number !== undefined && number < 0) {
        throw new Error('expected non-negative value')
    }
}

export function validateMaxOne(value: string) {
    const number = readNumber(value)

    if (number !== undefined && number > 1) {
        throw new Error('expected value between 0 and 1')
    }
}
