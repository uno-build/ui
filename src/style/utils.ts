import { UNIT } from './constants'
import { parseEnum } from './parsers'
import { validateEnum } from './validators'

export function readUnit(value: string) {
    const regex = new RegExp(`^(-?(?:\\d+|\\d*\\.\\d+))(${Object.values(UNIT).join('|')})$`, 'i')
    const match = value.match(regex)

    if (!match) {
        return undefined
    }

    return { value: Number(match[1]), kind: match[2]! }
}

export function readNumber(value: string) {
    if (!/^-?(?:\d+|\d*\.\d+)$/.test(value)) {
        return undefined
    }

    const number = Number(value)
    return Number.isFinite(number) ? number : undefined
}

export function readInteger(value: string) {
    if (!/^-?\d+$/.test(value)) {
        return undefined
    }

    const integer = Number(value)
    return Number.isFinite(integer) && Number.isInteger(integer) ? integer : undefined
}

export function runPipeline<TValue, TResult = TValue>(fns: Array<(value: TValue, context?: unknown) => TResult> | undefined, value: TValue, context?: unknown): TResult
export function runPipeline(fns: Array<(value: any, context?: unknown) => any> = [], value: any, context?: unknown) {
    return fns.reduce((current, fn) => fn(current, context), value)
}

export function runValidators(fns: Array<(value: string) => void> = [], value: string) {
    for (const fn of fns) {
        fn(value)
    }
}

export function createEnumValidator(values: Record<string, number>) {
    return (value: string) => validateEnum(value, values)
}

export function createEnumParser(values: Record<string, number>) {
    return (value: string) => parseEnum(value, values)
}
