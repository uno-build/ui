import { KEYWORD } from './consts'
import { readInteger, readNumber, readPercent, readPx } from './utils'

export function validateColor(value: string) {
    if (typeof value !== 'string' || !/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
        throw new Error('expected hex color')
    }
}

export function validateBoxShadow(value: string) {
    if (value === KEYWORD.UNSET) {
        return
    }

    const values = value.split(/\s+/)
    if (values.length !== 4 && values.length !== 5) {
        throw new Error('expected offset-x offset-y blur-radius spread-radius color')
    }

    for (const shadow_value of values.slice(0, 4)) {
        validatePx(shadow_value)
    }

    if (readPx(values[2])!.value < 0) {
        throw new Error('expected non-negative blur radius')
    }

    if (values[4] !== undefined) {
        validateColor(values[4])
    }
}

export function validateTextShadow(value: string) {
    if (value === KEYWORD.UNSET) {
        return
    }

    const values = value.split(/\s+/)
    if (values.length !== 3 && values.length !== 4) {
        throw new Error('expected offset-x offset-y blur-radius color')
    }

    for (const shadow_value of values.slice(0, 3)) {
        validatePx(shadow_value)
    }

    if (readPx(values[2])!.value < 0) {
        throw new Error('expected non-negative blur radius')
    }

    if (values[3] !== undefined) {
        validateColor(values[3])
    }
}
export function validateEnum(value: string, values: Record<string, any>) {
    if (typeof value !== 'string' || !Object.prototype.hasOwnProperty.call(values, value)) {
        throw new Error(`expected one of ${Object.keys(values).join(', ')}`)
    }
}
export function validateAuto(value: any) {
    if (value !== KEYWORD.AUTO) {
        throw new Error('expected auto')
    }
}

export function validateUnset(value: any) {
    if (value !== KEYWORD.UNSET) {
        throw new Error('expected unset')
    }
}

export function validateImageSrc(value: string) {
    if (value.toLowerCase() === KEYWORD.UNSET) {
        throw new Error('expected image src')
    }
}

export function validateNumber(value: any) {
    if (readNumber(value) === undefined) {
        throw new Error('expected number')
    }
}

export function validateInteger(value: any) {
    if (readInteger(value) === undefined) {
        throw new Error('expected integer')
    }
}

export function validatePx(value: string) {
    if (readPx(value) === undefined) {
        throw new Error('expected px unit')
    }
}

export function validatePercent(value: string) {
    if (readPercent(value) === undefined) {
        throw new Error('expected % unit')
    }
}

export function validateNonNegative(value: any) {
    const number = readNumber(value) ?? (readPx(value) ?? readPercent(value))?.value

    if (number !== undefined && number < 0) {
        throw new Error('expected non-negative value')
    }
}

export function validateMaxOne(value: any) {
    const number = readNumber(value)

    if (number !== undefined && number > 1) {
        throw new Error('expected value between 0 and 1')
    }
}
