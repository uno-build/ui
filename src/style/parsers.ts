import { UNIT } from './consts.ts'
import { readUnit } from './utils.ts'

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

export function parseNumber(value: number) {
    return { value, parsed: { value } }
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
export function parseEnum(value: string, values: Record<string, any>) {
    return { value, parsed: { enum: values[value] } }
}

export function parseUnit(value: string | number) {
    const unit = readUnit(value)!
    return {
        value: `${String(unit.value)}${unit.unit}`,
        parsed: unit,
    }
}
