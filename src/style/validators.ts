import { readPercent, readPx } from './utils.ts'

export function validateColor(value: string) {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
        throw new Error('expected hex color')
    }
}
export function validateEnum(value: string, values: Record<string, any>) {
    if (!Object.prototype.hasOwnProperty.call(values, value)) {
        throw new Error(`expected one of ${Object.keys(values).join(', ')}`)
    }
}
export function validateAuto(value: any) {
    if (value !== 'auto') {
        throw new Error('expected auto')
    }
}

export function validateUnset(value: any) {
    if (value !== 'unset') {
        throw new Error('expected unset')
    }
}

export function validateNumber(value: any) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error('expected number')
    }
}

export function validateInteger(value: any) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error('expected integer')
    }

    if (!Number.isInteger(value)) {
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
    let number

    if (typeof value === 'number') {
        number = value
    } else if (typeof value === 'string') {
        number = (readPx(value) ?? readPercent(value))?.value
    }

    if (number !== undefined && number < 0) {
        throw new Error('expected non-negative value')
    }
}
