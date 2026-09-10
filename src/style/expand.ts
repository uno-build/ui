// https://github.com/robinweser/inline-style-expand-shorthand/blob/master/src/expand.js
import { BACKGROUND_SIZE, BORDER_STYLE, KEYWORD } from './constants'
import { normalizeTrim, normalizeToLowercase } from './normalizers'
import { validateNumber, validatePx, validateRem, validateVw, validateVh } from './validators'

export function expandProperty(property: string, value: string): Record<string, string> | null | undefined
export function expandProperty(property: string, value: string[]): Record<string, string[]> | null
export function expandProperty(property: string, value: string | string[]) {
    if (Array.isArray(value)) {
        const result: Record<string, string[]> = {}

        value.forEach((item) => {
            const item_result = expand(property, item)

            if (item_result) {
                Object.keys(item_result).forEach((item_property) => {
                    result[item_property] = result[item_property] || []
                    result[item_property]!.push(item_result[item_property]!)
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

function expand(property: string, value: string): Record<string, string> | undefined {
    if (property === 'flex') {
        return expandFlex(value)
    }

    if (property === 'padding') {
        return expandEdges(value, (key) => 'padding' + key)
    }

    if (property === 'margin') {
        return expandEdges(value, (key) => 'margin' + key)
    }

    if (property === 'border') {
        return expandBorder(value)
    }

    if (property === 'borderRadius') {
        return expandBorderRadius(value)
    }

    if (property === 'backgroundSize') {
        return expandBackgroundSize(value)
    }

    if (property === 'backgroundPosition') {
        return expandBackgroundPosition(value)
    }
}

function splitShorthand(value: string) {
    let values = ['']
    let open_parens_count = 0

    const trimmed_value = normalizeTrim(value)

    for (let index = 0; index < trimmed_value.length; index += 1) {
        if (trimmed_value.charAt(index) === ' ' && open_parens_count === 0) {
            // Add new value
            values.push('')
        } else {
            // Add the current character to the current value
            values[values.length - 1] = values[values.length - 1] + trimmed_value.charAt(index)
        }

        // Keep track of the number of parentheses that are yet to be closed.
        // This is done to avoid splitting at whitespaces within CSS functions.
        // E.g.: `calc(1px + 1em)`
        if (trimmed_value.charAt(index) === '(') {
            open_parens_count++
        } else if (trimmed_value.charAt(index) === ')') {
            open_parens_count--
        }
    }

    return values
}

function isValid(value: string, validate: (value: string) => void) {
    try {
        validate(value)
        return true
    } catch {
        return false
    }
}

function parseBorder(value: string, resolve: (key: string) => string) {
    const values = splitShorthand(value)
    const longhands: Record<string, string> = {}

    values.forEach((val) => {
        if (BORDER_STYLE.hasOwnProperty(val)) {
            longhands[resolve('Style')] = val
        } else if (
            val === '0' ||
            isValid(val, validatePx) ||
            isValid(val, validateRem) ||
            isValid(val, validateVw) ||
            isValid(val, validateVh)
        ) {
            longhands[resolve('Width')] = val
        } else {
            longhands[resolve('Color')] = val
        }
    })

    return longhands
}

function expandBorder(value: string) {
    if (normalizeToLowercase(normalizeTrim(value)) === KEYWORD.UNSET) {
        const result: Record<string, string> = {}
        for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
            for (const property of ['Width', 'Style', 'Color']) {
                result[`border${side}${property}`] = KEYWORD.UNSET
            }
        }
        return result
    }

    const values = parseBorder(value, (key) => key)
    const result: Record<string, string> = {}

    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
        for (const key of Object.keys(values)) {
            result['border' + side + key] = values[key]!
        }
    }

    return result
}

function expandEdges(value: string, resolve: (key: string) => string) {
    const [top, right = top, bottom = top, left = right] = splitShorthand(value) as [string, ...string[]]

    return {
        [resolve('Top')]: top,
        [resolve('Right')]: right,
        [resolve('Bottom')]: bottom,
        [resolve('Left')]: left,
    }
}

function groupBy(values: string[], divider: string) {
    const groups: string[][] = [[]]

    values.forEach((val) => {
        if (val === divider) {
            groups.push([])
        } else {
            groups[groups.length - 1]!.push(val)
        }
    })

    return groups
}

function expandBorderRadius(value: string) {
    const [first = [], second = []] = groupBy(splitShorthand(value), '/')
    const [top, right = top, bottom = top, left = right] = first
    const [top2, right2 = top2, bottom2 = top2, left2 = right2] = second

    return {
        borderTopLeftRadius: [top, top2].filter(Boolean).join(' '),
        borderTopRightRadius: [right, right2].filter(Boolean).join(' '),
        borderBottomRightRadius: [bottom, bottom2].filter(Boolean).join(' '),
        borderBottomLeftRadius: [left, left2].filter(Boolean).join(' '),
    }
}

function expandBackgroundSize(value: string): Record<string, string> {
    const normalized_value = normalizeToLowercase(normalizeTrim(value))

    if (normalized_value === KEYWORD.UNSET) {
        return {
            backgroundSizeWidth: KEYWORD.UNSET,
            backgroundSizeHeight: KEYWORD.UNSET,
        }
    }

    if (BACKGROUND_SIZE.hasOwnProperty(normalized_value)) {
        return {
            backgroundSizeWidth: normalized_value,
            backgroundSizeHeight: normalized_value,
        }
    }

    const [width, height, ...rest] = splitShorthand(value)

    if (width === undefined || width === '' || rest.length > 0) {
        throw new Error('expected one or two background size values')
    }

    const normalized_width = normalizeToLowercase(width)
    const normalized_height = height === undefined ? undefined : normalizeToLowercase(height)

    if (
        BACKGROUND_SIZE.hasOwnProperty(normalized_width) ||
        (normalized_height !== undefined && BACKGROUND_SIZE.hasOwnProperty(normalized_height))
    ) {
        throw new Error('expected cover or contain alone')
    }

    if (height === undefined) {
        return {
            backgroundSizeWidth: width,
        }
    }

    return {
        backgroundSizeWidth: width,
        backgroundSizeHeight: height,
    }
}

function expandBackgroundPosition(value: string) {
    if (normalizeToLowercase(normalizeTrim(value)) === KEYWORD.UNSET) {
        return {
            backgroundPositionX: KEYWORD.UNSET,
            backgroundPositionY: KEYWORD.UNSET,
        }
    }

    const [x, y = '50%', ...rest] = splitShorthand(value)

    if (x === undefined || x === '' || y === '' || rest.length > 0) {
        throw new Error('expected one or two background position values')
    }

    return {
        backgroundPositionX: x,
        backgroundPositionY: y,
    }
}

function expandFlex(value: string) {
    let values = ['']

    // https://developer.mozilla.org/en-US/docs/Web/CSS/flex#values
    switch (normalizeToLowercase(normalizeTrim(value))) {
        case KEYWORD.UNSET:
            values = splitShorthand('unset unset unset')
            break

        case KEYWORD.AUTO:
            values = splitShorthand('1 1 auto')
            break

        // case 'none':
        //     values = splitShorthand('0 0 auto')
        //     break

        default:
            values = splitShorthand(value)
            break
    }

    // https://developer.mozilla.org/en-US/docs/Web/CSS/flex#syntax
    // https://www.w3.org/TR/css-flexbox-1/

    // Expand one-value syntax to three-value syntax
    if (values.length === 1) {
        // One-value syntax
        const val = values[0]!
        if (isValid(val, validateNumber)) {
            // flex value
            values = splitShorthand(val + ' 1 0%')
        } else {
            // It is a width value (flex-basis)
            values = splitShorthand('1 1 ' + val)
        }
    }

    const longhands: Record<string, string> = {}

    if (values.length === 2) {
        // Two-value syntax
        longhands.flexGrow = values[0]!

        if (isValid(values[1]!, validateNumber)) {
            // The second value appears to be a shrink factor
            longhands.flexShrink = values[1]!
        } else {
            // The second value appears to be width
            longhands.flexBasis = values[1]!
        }
    } else {
        // Three-value syntax
        longhands.flexGrow = values[0]!
        longhands.flexShrink = values[1]!
        longhands.flexBasis = values[2]!
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
