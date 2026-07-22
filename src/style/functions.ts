import { UNIT } from './consts'

export const NUMERIC_FUNCTION_KIND = 'function'

const CLAMP_UNITS = [UNIT.PX, UNIT.REM, UNIT.VW, UNIT.VH]

const NUMERIC_FUNCTIONS = {
    clamp: {
        parse(arguments_, parse_argument) {
            if (arguments_.length !== 3) {
                throw new Error('expected clamp(minimum, preferred, maximum)')
            }

            return arguments_.map((argument) => {
                const parsed_argument = parse_argument(argument)

                if (parsed_argument === undefined || !CLAMP_UNITS.includes(parsed_argument.kind)) {
                    throw new Error('expected clamp arguments with px, rem, vw, or vh units')
                }

                return parsed_argument
            })
        },
        compute([minimum, preferred, maximum]) {
            return Math.max(minimum, Math.min(preferred, maximum))
        },
    },
}

export function readCssFunction(value: string) {
    const opening_parenthesis = value.indexOf('(')

    if (
        opening_parenthesis <= 0 ||
        value[value.length - 1] !== ')' ||
        !/^[a-z][a-z0-9-]*$/i.test(value.slice(0, opening_parenthesis))
    ) {
        return undefined
    }

    const arguments_ = []
    let argument_start = opening_parenthesis + 1
    let depth = 0

    for (let index = argument_start; index < value.length - 1; index++) {
        const character = value[index]

        if (character === '(') {
            depth++
        } else if (character === ')') {
            if (depth === 0) {
                return undefined
            }
            depth--
        } else if (character === ',' && depth === 0) {
            const argument = value.slice(argument_start, index).trim()
            if (argument === '') {
                return undefined
            }
            arguments_.push(argument)
            argument_start = index + 1
        }
    }

    const argument = value.slice(argument_start, -1).trim()
    if (depth !== 0 || argument === '') {
        return undefined
    }
    arguments_.push(argument)

    return {
        name: value.slice(0, opening_parenthesis).toLowerCase(),
        arguments: arguments_,
    }
}

export function parseNumericFunction(value: string, parse_argument) {
    const css_function = readCssFunction(value)

    if (css_function === undefined) {
        throw new Error('expected numeric function')
    }

    if (!Object.prototype.hasOwnProperty.call(NUMERIC_FUNCTIONS, css_function.name)) {
        throw new Error(`unsupported numeric function '${css_function.name}'`)
    }
    const definition = NUMERIC_FUNCTIONS[css_function.name]

    return {
        kind: NUMERIC_FUNCTION_KIND,
        name: css_function.name,
        arguments: definition.parse(css_function.arguments, parse_argument),
    }
}

export function readNumericFunction(value: string, parse_argument) {
    try {
        return parseNumericFunction(value, parse_argument)
    } catch {
        return undefined
    }
}

export function computeNumericFunction(value, compute_argument) {
    const definition = NUMERIC_FUNCTIONS[value.name]
    return definition.compute(value.arguments.map(compute_argument))
}
