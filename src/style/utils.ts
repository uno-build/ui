import { UNIT } from './consts'
import { parseEnum } from './parsers'
import { validateEnum } from './validators'

export function readUnit(value: string) {
    const regex = new RegExp(`^(-?(?:\\d+|\\d*\\.\\d+))(${Object.values(UNIT).join('|')})$`, 'i')
    const match = value.match(regex)

    if (!match) {
        return undefined
    }

    return { value: Number(match[1]), kind: match[2] }
}

export function readNumber(value: any) {
    if (!/^-?(?:\d+|\d*\.\d+)$/.test(value)) {
        return undefined
    }

    const number = Number(value)
    return Number.isFinite(number) ? number : undefined
}

export function readInteger(value: any) {
    if (!/^-?\d+$/.test(value)) {
        return undefined
    }

    const integer = Number(value)
    return Number.isFinite(integer) && Number.isInteger(integer) ? integer : undefined
}

export function runPipeline(fns: [] = [], value: any, context: any) {
    return fns.reduce((current, fn) => fn(current, context), value)
}

export function runValidators(fns: [] = [], value: any) {
    for (const fn of fns) {
        fn(value)
    }
}

export function createEnumValidator(values: Record<string, any>) {
    return (value: string) => validateEnum(value, values)
}

export function createEnumParser(values: Record<string, any>) {
    return (value: string) => parseEnum(value, values)
}
