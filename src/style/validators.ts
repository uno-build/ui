import { readUnit } from './utils.ts'

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
export function validateUnit(value: string | number) {
    if (readUnit(value) === undefined) {
        throw new Error('expected px or % unit')
    }
}

export function validateAuto(value: any) {
    if (value !== 'auto') {
        throw new Error('expected auto')
    }
}

export function validateNone(value: any) {
    if (value !== 'none') {
        throw new Error('expected none')
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

export function validatePx(value: string | number) {
    const unit = readUnit(value)
    if (unit === undefined || unit.unit !== 'px' || unit.value < 0) {
        throw new Error('expected px unit')
    }
}

export function validateNonNegativeNumber(value: any) {
    validateNumber(value)
    if (value < 0) {
        throw new Error('expected non-negative number')
    }
}

export function validateNonNegativeUnit(value: string | number) {
    const unit = readUnit(value)
    if (unit === undefined) {
        validateUnit(value)
        return
    }

    if (unit.value < 0) {
        throw new Error('expected non-negative unit')
    }
}
