import { UNIT } from './consts.ts'
import { normalizeString } from './normalizers.ts'
import { parseEnum } from './parsers.ts'
import { validateEnum } from './validators.ts'

export function readUnit(value: string | number) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? { value, unit: UNIT.PX } : undefined
    }

    const match = value.match(/^(-?(?:\d+|\d*\.\d+))(px|%)?$/)
    if (!match) {
        return undefined
    }

    const number = Number(match[1])
    if (!Number.isFinite(number)) {
        return undefined
    }

    return { value: number, unit: match[2] === '%' ? UNIT.PERCENT : UNIT.PX }
}

export function readNumber(value: any) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined
    }

    if (typeof value !== 'string') {
        return undefined
    }

    const normalized = normalizeString(value)
    if (!/^-?(?:\d+|\d*\.\d+)$/.test(normalized)) {
        return undefined
    }

    const number = Number(normalized)
    return Number.isFinite(number) ? number : undefined
}

export function runNormalizePipeline(fns: [] = [], value: any) {
    return fns.reduce((current, fn) => fn(current), value)
}

export function runValidators(fns: [] = [], value: any) {
    for (const fn of fns) {
        fn(value)
    }
}

export function runParsePipeline(fns: ParseFn[], value: any) {
    return fns.reduce((current, fn) => fn(current), value)
}

export function createStyle(name: string, alternatives: any) {
    return {
        name,
        resolve(value: any) {
            let firstError: unknown

            if (!Array.isArray(alternatives)) {
                alternatives = [alternatives]
            }

            for (const alternative of alternatives) {
                const normalized = runNormalizePipeline(
                    alternative.normalize,
                    value,
                )

                try {
                    runValidators(alternative.validate, normalized)
                } catch (err) {
                    firstError ??= err
                    continue
                }

                const result = runParsePipeline(alternative.parse, normalized)
                return {
                    ...result,
                    value: String(result.value),
                }
            }

            throw firstError ?? new Error('expected valid style value')
        },
    }
}

export function createEnumValidator(values: Record<string, any>) {
    return (value: string) => validateEnum(value, values)
}

export function createEnumParser(values: Record<string, any>) {
    return (value: string) => parseEnum(value, values)
}
