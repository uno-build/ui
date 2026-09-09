import { KEYWORD, UNIT } from './constants'
import { readInteger, readNumber, readUnit } from './utils'

/**
 * @param {string} value
 */
export function parseString(value) {
    return {
        value,
        parsed: {},
    }
}

/**
 * @param {string} value
 */
export function parseAuto(value) {
    return {
        value,
        parsed: { kind: KEYWORD.AUTO },
    }
}

/**
 * @param {string} value
 */
export function parseUnset(value) {
    return {
        value,
        parsed: { kind: KEYWORD.UNSET },
    }
}

/**
 * @param {string} value
 */
export function parseNumber(value) {
    const number = readNumber(value)
    return { value: String(number), parsed: { value: number } }
}

/**
 * @param {string} value
 */
export function parseInteger(value) {
    const integer = readInteger(value)
    return { value: String(integer), parsed: { value: integer } }
}

/**
 * @param {string} value
 */
export function parseRgba(value) {
    const hex = value.slice(1)
    const channels =
        hex.length <= 4
            ? hex.split('').map((channel) => parseInt(channel + channel, 16))
            : hex.match(/../g).map((channel) => parseInt(channel, 16))

    if (channels[3] === undefined) {
        channels[3] = 255
    }

    return channels
}

/**
 * @param {string} value
 */
export function parseColor(value) {
    return { value, parsed: { rgba: parseRgba(value) } }
}

/**
 * @param {string} value
 */
export function parseBoxShadow(value) {
    const values = value.split(/\s+/)

    return {
        value,
        parsed: {
            box_shadow: {
                offset_x: readUnit(values[0]),
                offset_y: readUnit(values[1]),
                blur: readUnit(values[2]),
                spread: readUnit(values[3]),
                color: parseRgba(values[4] ?? '#000000FF'),
            },
        },
    }
}

/**
 * @param {string} value
 */
export function parseTextShadow(value) {
    const values = value.split(/\s+/)

    return {
        value,
        parsed: {
            text_shadow: {
                offset_x: readUnit(values[0]),
                offset_y: readUnit(values[1]),
                blur: readUnit(values[2]),
                color: parseRgba(values[3] ?? '#000000FF'),
            },
        },
    }
}

/**
 * @param {string} value
 */
export function parseTextStroke(value) {
    const values = value.split(/\s+/)

    return {
        value,
        parsed: {
            text_stroke: {
                width: readUnit(values[0]),
                color: parseRgba(values[1]),
            },
        },
    }
}
/**
 * @param {string} value
 * @param {Record<string, any>} values
 */
export function parseEnum(value, values) {
    return { value, parsed: { enum: values[value] } }
}

/**
 * @param {string} value
 */
export function parsePx(value) {
    const unit = readUnit(value)
    return {
        value,
        parsed: unit,
    }
}

/**
 * @param {string} value
 */
export function parsePercent(value) {
    const unit = readUnit(value)
    return {
        value,
        parsed: unit,
    }
}

/**
 * @param {string} value
 */
export function parseRem(value) {
    const unit = readUnit(value)
    return {
        value,
        parsed: unit,
    }
}

/**
 * @param {string} value
 */
export function parseVw(value) {
    const unit = readUnit(value)
    return {
        value,
        parsed: unit,
    }
}

/**
 * @param {string} value
 */
export function parseVh(value) {
    const unit = readUnit(value)
    return {
        value,
        parsed: unit,
    }
}

/**
 * @param {any} value
 */
export function parseImage(value) {
    return { value: value.src, parsed: value }
}
