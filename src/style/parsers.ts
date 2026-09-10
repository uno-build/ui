import { KEYWORD, UNIT } from './constants'
import { readInteger, readNumber, readUnit } from './utils'

export function parseString(value: string) {
    return {
        value,
        parsed: {},
    }
}

export function parseAuto(value: string) {
    return {
        value,
        parsed: { kind: KEYWORD.AUTO },
    }
}

export function parseUnset(value: string) {
    return {
        value,
        parsed: { kind: KEYWORD.UNSET },
    }
}

export function parseNumber(value: string) {
    const number = readNumber(value)
    return { value: String(number), parsed: { value: number } }
}

export function parseInteger(value: string) {
    const integer = readInteger(value)
    return { value: String(integer), parsed: { value: integer } }
}

export function parseRgba(value: string) {
    const hex = value.slice(1)
    const channels =
        hex.length <= 4
            ? hex.split('').map((channel) => parseInt(channel + channel, 16))
            : hex.match(/../g)!.map((channel) => parseInt(channel, 16))

    if (channels[3] === undefined) {
        channels[3] = 255
    }

    return channels
}

export function parseColor(value: string) {
    return { value, parsed: { rgba: parseRgba(value) } }
}

export function parseBoxShadow(value: string) {
    const values = value.split(/\s+/)

    return {
        value,
        parsed: {
            box_shadow: {
                offset_x: readUnit(values[0]!),
                offset_y: readUnit(values[1]!),
                blur: readUnit(values[2]!),
                spread: readUnit(values[3]!),
                color: parseRgba(values[4] ?? '#000000FF'),
            },
        },
    }
}

export function parseTextShadow(value: string) {
    const values = value.split(/\s+/)

    return {
        value,
        parsed: {
            text_shadow: {
                offset_x: readUnit(values[0]!),
                offset_y: readUnit(values[1]!),
                blur: readUnit(values[2]!),
                color: parseRgba(values[3] ?? '#000000FF'),
            },
        },
    }
}

export function parseTextStroke(value: string) {
    const values = value.split(/\s+/)

    return {
        value,
        parsed: {
            text_stroke: {
                width: readUnit(values[0]!),
                color: parseRgba(values[1]!),
            },
        },
    }
}
export function parseEnum(value: string, values: Record<string, number>) {
    return { value, parsed: { enum: values[value] } }
}

export function parsePx(value: string) {
    const unit = readUnit(value)
    return {
        value,
        parsed: unit,
    }
}

export function parsePercent(value: string) {
    const unit = readUnit(value)
    return {
        value,
        parsed: unit,
    }
}

export function parseRem(value: string) {
    const unit = readUnit(value)
    return {
        value,
        parsed: unit,
    }
}

export function parseVw(value: string) {
    const unit = readUnit(value)
    return {
        value,
        parsed: unit,
    }
}

export function parseVh(value: string) {
    const unit = readUnit(value)
    return {
        value,
        parsed: unit,
    }
}

export function parseImage<TImage extends { src: string }>(value: TImage) {
    return { value: value.src, parsed: value }
}
