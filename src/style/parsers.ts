import { UNIT } from './consts.ts'
import { readInteger, readNumber, readPercent, readPx } from './utils.ts'

export function parseAuto(value: string) {
    return {
        value,
        parsed: { unit: UNIT.AUTO },
    }
}

export function parseNone(value: string) {
    return {
        value,
        parsed: { unit: 'none' },
    }
}

export function parseUnset(value: string) {
    return {
        value,
        parsed: { unit: UNIT.UNSET },
    }
}

export function parseNumber(value: string) {
    const number = readNumber(value)!
    return { value: number, parsed: { value: number } }
}

export function parseInteger(value: string) {
    const integer = readInteger(value)!
    return { value: integer, parsed: { value: integer } }
}

export function parseRgba(value: string) {
    const hex = value.slice(1)
    const channels =
        hex.length <= 4
            ? hex.split('').map((channel) => parseInt(channel + channel, 16))
            : hex.match(/../g)!.map((channel) => parseInt(channel, 16))

    return [
        channels[0] / 255,
        channels[1] / 255,
        channels[2] / 255,
        channels[3] == null ? 1 : channels[3] / 255,
    ]
}

export function parseColor(value: string) {
    return { value, parsed: { rgba: parseRgba(value) } }
}

export function parseImage(value: any) {
    return { value: value.src, parsed: value }
}

export function parseEnum(value: string, values: Record<string, any>) {
    return { value, parsed: { enum: values[value] } }
}

export function parsePx(value: string) {
    const unit = readPx(value)!
    return {
        value: `${String(unit.value)}${unit.unit}`,
        parsed: unit,
    }
}

export function parsePercent(value: string) {
    const unit = readPercent(value)!
    return {
        value: `${String(unit.value)}${unit.unit}`,
        parsed: unit,
    }
}
