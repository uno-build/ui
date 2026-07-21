import { KEYWORD } from './consts'
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
    const number = readNumber(value)!
    return { value: String(number), parsed: { value: number } }
}

export function parseInteger(value: string) {
    const integer = readInteger(value)!
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
    if (value === KEYWORD.UNSET) {
        return {
            value,
            parsed: {
                box_shadow: {
                    offset_x: 0,
                    offset_y: 0,
                    blur: 0,
                    spread: 0,
                    color: [0, 0, 0, 0],
                },
            },
        }
    }

    const values = value.split(/\s+/)

    return {
        value,
        parsed: {
            box_shadow: {
                offset_x: readUnit(values[0])!.value,
                offset_y: readUnit(values[1])!.value,
                blur: readUnit(values[2])!.value,
                spread: readUnit(values[3])!.value,
                color: parseRgba(values[4] ?? '#000000FF'),
            },
        },
    }
}

export function parseTextShadow(value: string) {
    if (value === KEYWORD.UNSET) {
        return {
            value,
            parsed: {
                text_shadow: {
                    offset_x: 0,
                    offset_y: 0,
                    blur: 0,
                    color: [0, 0, 0, 0],
                },
            },
        }
    }

    const values = value.split(/\s+/)

    return {
        value,
        parsed: {
            text_shadow: {
                offset_x: readUnit(values[0])!.value,
                offset_y: readUnit(values[1])!.value,
                blur: readUnit(values[2])!.value,
                color: parseRgba(values[3] ?? '#000000FF'),
            },
        },
    }
}

export function parseTextStroke(value: string) {
    if (value === KEYWORD.UNSET) {
        return {
            value,
            parsed: {
                text_stroke: {
                    width: 0,
                    color: [0, 0, 0, 0],
                },
            },
        }
    }

    const values = value.split(/\s+/)

    return {
        value,
        parsed: {
            text_stroke: {
                width: readUnit(values[0])!.value,
                color: parseRgba(values[1]),
            },
        },
    }
}
export function parseEnum(value: string, values: Record<string, any>) {
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

export function parseImage(value: any) {
    return { value: value.src, parsed: value }
}
