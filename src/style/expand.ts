// https://github.com/robinweser/inline-style-expand-shorthand/blob/master/src/expand.js
import { BORDER_STYLE } from './consts'

const NUMBER = /^-?(?:\d+|\d*\.\d+)$/
const BORDER_WIDTH = /^-?(?:\d+|\d*\.\d+)px$|^0$/

export function expandProperty(property: string, value: string | string[]) {
    if (Array.isArray(value)) {
        const result = {}

        value.forEach((item) => {
            const itemResult = expand(property, item)

            if (itemResult) {
                Object.keys(itemResult).forEach((itemProperty) => {
                    result[itemProperty] = result[itemProperty] || []
                    result[itemProperty].push(itemResult[itemProperty])
                })
            }
        })

        if (Object.keys(result).length) {
            return result
        }

        return null
    }

    return expand(property, value)
}

function expand(property: string, value: string) {
    if (property === 'flex') {
        return parseFlex(value)
    }

    if (property === 'padding') {
        return parseEdges(value, (key) => 'padding' + key)
    }

    if (property === 'margin') {
        return parseEdges(value, (key) => 'margin' + key)
    }

    if (property === 'border') {
        return expandBorder(value)
    }

    if (property === 'borderRadius') {
        return parseBorderRadius(value)
    }
}

function splitShorthand(value: string) {
    let values = ['']
    let openParensCount = 0

    const trimmedValue = value.trim()

    for (let index = 0; index < trimmedValue.length; index += 1) {
        if (trimmedValue.charAt(index) === ' ' && openParensCount === 0) {
            // Add new value
            values.push('')
        } else {
            // Add the current character to the current value
            values[values.length - 1] = values[values.length - 1] + trimmedValue.charAt(index)
        }

        // Keep track of the number of parentheses that are yet to be closed.
        // This is done to avoid splitting at whitespaces within CSS functions.
        // E.g.: `calc(1px + 1em)`
        if (trimmedValue.charAt(index) === '(') {
            openParensCount++
        } else if (trimmedValue.charAt(index) === ')') {
            openParensCount--
        }
    }

    return values
}

function parseBorder(value: string, resolve) {
    const values = splitShorthand(value)
    const longhands = {}

    values.forEach((val) => {
        if (BORDER_STYLE.hasOwnProperty(val)) {
            longhands[resolve('Style')] = val
        } else if (BORDER_WIDTH.test(val)) {
            longhands[resolve('Width')] = val
        } else {
            longhands[resolve('Color')] = val
        }
    })

    return longhands
}

function expandBorder(value: string) {
    const values = parseBorder(value, (key) => key)
    const result = {}

    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
        for (const key of Object.keys(values)) {
            result['border' + side + key] = values[key]
        }
    }

    return result
}

function parseEdges(value: string, resolve) {
    const [Top, Right = Top, Bottom = Top, Left = Right] = splitShorthand(value)

    return {
        [resolve('Top')]: Top,
        [resolve('Right')]: Right,
        [resolve('Bottom')]: Bottom,
        [resolve('Left')]: Left,
    }
}

function groupBy(values: string[], divider: string) {
    const groups = [[]]

    values.forEach((val) => {
        if (val === divider) {
            groups.push([])
        } else {
            groups[groups.length - 1].push(val)
        }
    })

    return groups
}

function parseBorderRadius(value: string) {
    const [first = [], second = []] = groupBy(splitShorthand(value), '/')
    const [Top, Right = Top, Bottom = Top, Left = Right] = first
    const [Top2, Right2 = Top2, Bottom2 = Top2, Left2 = Right2] = second

    return {
        borderTopLeftRadius: [Top, Top2].filter(Boolean).join(' '),
        borderTopRightRadius: [Right, Right2].filter(Boolean).join(' '),
        borderBottomRightRadius: [Bottom, Bottom2].filter(Boolean).join(' '),
        borderBottomLeftRadius: [Left, Left2].filter(Boolean).join(' '),
    }
}

function parseFlex(value: string) {
    let values = ['']

    // https://developer.mozilla.org/en-US/docs/Web/CSS/flex#values
    switch (value.trim().toLowerCase()) {
        case 'unset':
            values = splitShorthand('unset unset unset')
            break

        case 'auto':
            values = splitShorthand('1 1 auto')
            break

        case 'none':
            values = splitShorthand('0 0 auto')
            break

        default:
            values = splitShorthand(value)
            break
    }

    // https://developer.mozilla.org/en-US/docs/Web/CSS/flex#syntax
    // https://www.w3.org/TR/css-flexbox-1/

    // Expand one-value syntax to three-value syntax
    if (values.length === 1) {
        // One-value syntax
        const val = values[0]
        if (NUMBER.test(val)) {
            // flex value
            values = splitShorthand(val + ' 1 0%')
        } else {
            // It is a width value (flex-basis)
            values = splitShorthand('1 1 ' + val)
        }
    }

    const longhands = {}

    if (values.length === 2) {
        // Two-value syntax
        longhands.flexGrow = values[0]

        if (values[1].match(NUMBER) !== null) {
            // The second value appears to be a shrink factor
            longhands.flexShrink = values[1]
        } else {
            // The second value appears to be width
            longhands.flexBasis = values[1]
        }
    } else {
        // Three-value syntax
        longhands.flexGrow = values[0]
        longhands.flexShrink = values[1]
        longhands.flexBasis = values[2]
    }

    // According to the spec: Authors are encouraged to control flexibility using the flex shorthand rather than with its longhand
    // properties directly, as the shorthand correctly resets any unspecified components to accommodate common uses.
    //
    // Thus in order to maintain the correct behavior, we have to reset any unspecified longhand properties to their default values.

    // Add default value, initialized value is "0 1 auto"
    if (typeof longhands.flexGrow === 'undefined') {
        longhands.flexGrow = '0'
    }
    if (typeof longhands.flexShrink === 'undefined') {
        longhands.flexShrink = '1'
    }
    if (typeof longhands.flexBasis === 'undefined') {
        longhands.flexBasis = 'auto'
    }

    return longhands
}
