import { KEYWORD } from './consts'
import { readInteger, readNumber, readPercent, readPx } from './utils'

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
export function parseEnum(value: string, values: Record<string, any>) {
    return { value, parsed: { enum: values[value] } }
}

export function parsePx(value: string) {
    const unit = readPx(value)!
    return {
        value: `${String(unit.value)}${unit.kind}`,
        parsed: unit,
    }
}

export function parsePercent(value: string) {
    const unit = readPercent(value)!
    return {
        value: `${String(unit.value)}${unit.kind}`,
        parsed: unit,
    }
}

export function parseImage(value: any) {
    return { value: value.src, parsed: value }
}
