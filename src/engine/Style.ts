export default {
    resolveStyle,
    normalizeStyleName,
}

if (typeof window !== 'undefined') {
    window.Style = {
        resolveStyle,
        normalizeStyleName,
    }
}

export function resolveStyle(name: string, value: any) {
    // Validating name
    if (typeof name !== 'string') {
        throw new Error(`style name must be a string, got '${typeof name}'`)
    }
    const style = STYLE[normalizeStyleKey(name)]
    if (!style) {
        name = normalizeStyleName(name)
        throw new Error(`unsupported property '${name}'`)
    }

    // Validating value
    if (typeof value === 'undefined') {
        throw new Error(
            `style value for property '${style.name}' cannot be undefined`,
        )
    }
    try {
        const result = style.resolve(value)
        return {
            name: style.name,
            ...result,
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : err
        const suffix = message ? `: ${message}` : ''
        throw new Error(
            `invalid value '${value}' for property '${style.name}'${suffix}`,
        )
    }
}

export function normalizeStyleName(name: string) {
    const style = STYLE[normalizeStyleKey(name)]
    if (style) {
        return style.name
    }

    name = name.trim()

    if (name.includes('-')) {
        return name
            .toLowerCase()
            .replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    }

    return name.charAt(0).toLowerCase() + name.slice(1)
}

function normalizeStyleKey(name: string) {
    return name.trim().replace(/-/g, '').toUpperCase()
}

function normalizeString(value: any) {
    return String(value).trim().toLowerCase()
}

function normalizeUnit(value: any) {
    return typeof value === 'number' ? value : normalizeString(value)
}

function validateColor(value: string) {
    if (!/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
        throw new Error('expected hex color')
    }
}

function parseColor(value: string) {
    return { value, parsed: { rgba: parseRgba(value) } }
}

function validateEnum(value: string, values: Record<string, any>) {
    if (!Object.prototype.hasOwnProperty.call(values, value)) {
        throw new Error(`expected one of ${Object.keys(values).join(', ')}`)
    }
}

function parseEnum(value: string, values: Record<string, any>) {
    return { value, parsed: { enum: values[value] } }
}

function validateUnit(value: string | number) {
    if (readUnit(value) === undefined) {
        throw new Error('expected px or % unit')
    }
}

function parseUnit(value: string | number) {
    const unit = readUnit(value)!
    return {
        value: `${String(unit.value)}${unit.unit}`,
        parsed: { ...unit, value: Math.abs(unit.value) },
    }
}

function readUnit(value: string | number) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? { value, unit: 'px' } : undefined
    }

    const match = value.match(/^(-?(?:\d+|\d*\.\d+))(px|%)?$/)
    if (!match) {
        return undefined
    }

    const number = Number(match[1])
    if (!Number.isFinite(number)) {
        return undefined
    }

    return { value: number, unit: match[2] ?? 'px' }
}

function parseRgba(value: string) {
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

const OPTION_POSITION = {
    static: 0,
    relative: 1,
    absolute: 2,
}
const OPTION_ALIGN_CONTENT = {
    'flex-start': 1,
    center: 2,
    'flex-end': 3,
    stretch: 4,
    baseline: 5,
    'space-between': 6,
    'space-around': 7,
    'space-evenly': 8,
}
const OPTION_ALIGN_ITEMS = {
    normal: 0,
    'flex-start': 1,
    center: 2,
    'flex-end': 3,
    stretch: 4,
    baseline: 5,
}
const OPTION_ALIGN_SELF = {
    auto: 0,
    normal: 0,
    'flex-start': 1,
    center: 2,
    'flex-end': 3,
    stretch: 4,
    baseline: 5,
}
const OPTION_FLEX_DIRECTION = {
    column: 0,
    'column-reverse': 1,
    row: 2,
    'row-reverse': 3,
}
const OPTION_WRAP = {
    nowrap: 0,
    wrap: 1,
    'wrap-reverse': 2,
}
const OPTION_JUSTIFY = {
    'flex-start': 0,
    center: 1,
    'flex-end': 2,
    'space-between': 3,
    'space-around': 4,
    'space-evenly': 5,
}
const OPTION_OVERFLOW = {
    visible: 0,
    hidden: 1,
    scroll: 2,
}
const OPTION_DISPLAY = {
    flex: 0,
    none: 1,
    contents: 2,
}
const OPTION_DIRECTION = {
    inherit: 0,
    ltr: 1,
    rtl: 2,
}
const OPTION_BOX_SIZING = {
    'border-box': 0,
    'content-box': 1,
}

type StyleParseResult = {
    value: any
    parsed?: Record<string, any>
}

type NormalizeFn = (value: any) => any
type ValidateFn = (value: any) => void
type ParseFn = (value: any) => any

type StyleAlternative = {
    normalize?: NormalizeFn[]
    validate?: ValidateFn[]
    parse: ParseFn[]
}

function runNormalizePipeline(fns: NormalizeFn[] = [], value: any) {
    return fns.reduce((current, fn) => fn(current), value)
}

function normalizeNumber(value: any) {
    const number = readNumber(value)
    return number === undefined ? value : number
}

function runValidators(fns: ValidateFn[] = [], value: any) {
    for (const fn of fns) {
        fn(value)
    }
}

function runParsePipeline(fns: ParseFn[], value: any) {
    return fns.reduce((current, fn) => fn(current), value) as StyleParseResult
}

function createStyle(name: string, alternatives: any) {
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

                return runParsePipeline(alternative.parse, normalized)
            }

            throw firstError ?? new Error('expected valid style value')
        },
    }
}

function validateAuto(value: any) {
    if (value !== 'auto') {
        throw new Error('expected auto')
    }
}

function validateNumber(value: any) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error('expected number')
    }
}

function validateNonNegativeNumber(value: any) {
    validateNumber(value)
    if (value < 0) {
        throw new Error('expected non-negative number')
    }
}

function validatePx(value: string | number) {
    const unit = readUnit(value)
    if (unit === undefined || unit.unit !== 'px' || unit.value < 0) {
        throw new Error('expected px unit')
    }
}

function validateNonNegativeUnit(value: string | number) {
    const unit = readUnit(value)
    if (unit === undefined) {
        validateUnit(value)
        return
    }

    if (unit.value < 0) {
        throw new Error('expected non-negative unit')
    }
}

function parseAuto(value: string) {
    return {
        value,
        parsed: { unit: 'auto' },
    }
}

function parseNumber(value: number) {
    return { value, parsed: { value } }
}

function readNumber(value: any) {
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

function createEnumValidator(values: Record<string, any>) {
    return (value: string) => validateEnum(value, values)
}

function createEnumParser(values: Record<string, any>) {
    return (value: string) => parseEnum(value, values)
}

const STYLE = {
    BACKGROUNDCOLOR: createStyle('backgroundColor', {
        normalize: [normalizeString],
        validate: [validateColor],
        parse: [parseColor],
    }),

    POSITION: createStyle('position', {
        normalize: [normalizeString],
        validate: [createEnumValidator(OPTION_POSITION)],
        parse: [createEnumParser(OPTION_POSITION)],
    }),

    TOP: createStyle('top', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

    LEFT: createStyle('left', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

    RIGHT: createStyle('right', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

    BOTTOM: createStyle('bottom', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

    ALIGNCONTENT: createStyle('alignContent', {
        normalize: [normalizeString],
        validate: [createEnumValidator(OPTION_ALIGN_CONTENT)],
        parse: [createEnumParser(OPTION_ALIGN_CONTENT)],
    }),

    ALIGNITEMS: createStyle('alignItems', {
        normalize: [normalizeString],
        validate: [createEnumValidator(OPTION_ALIGN_ITEMS)],
        parse: [createEnumParser(OPTION_ALIGN_ITEMS)],
    }),

    ALIGNSELF: createStyle('alignSelf', {
        normalize: [normalizeString],
        validate: [createEnumValidator(OPTION_ALIGN_SELF)],
        parse: [createEnumParser(OPTION_ALIGN_SELF)],
    }),

    FLEXDIRECTION: createStyle('flexDirection', {
        normalize: [normalizeString],
        validate: [createEnumValidator(OPTION_FLEX_DIRECTION)],
        parse: [createEnumParser(OPTION_FLEX_DIRECTION)],
    }),

    FLEXWRAP: createStyle('flexWrap', {
        normalize: [normalizeString],
        validate: [createEnumValidator(OPTION_WRAP)],
        parse: [createEnumParser(OPTION_WRAP)],
    }),

    JUSTIFYCONTENT: createStyle('justifyContent', {
        normalize: [normalizeString],
        validate: [createEnumValidator(OPTION_JUSTIFY)],
        parse: [createEnumParser(OPTION_JUSTIFY)],
    }),

    MARGINTOP: createStyle('marginTop', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

    MARGINLEFT: createStyle('marginLeft', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

    MARGINRIGHT: createStyle('marginRight', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

    MARGINBOTTOM: createStyle('marginBottom', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

    MARGIN: createStyle('margin', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

    FLEXBASIS: createStyle('flexBasis', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

    FLEX: createStyle('flex', {
        normalize: [normalizeNumber],
        validate: [validateNumber],
        parse: [parseNumber],
    }),

    FLEXGROW: createStyle('flexGrow', {
        normalize: [normalizeNumber],
        validate: [validateNumber, validateNonNegativeNumber],
        parse: [parseNumber],
    }),

    FLEXSHRINK: createStyle('flexShrink', {
        normalize: [normalizeNumber],
        validate: [validateNumber, validateNonNegativeNumber],
        parse: [parseNumber],
    }),

    WIDTH: createStyle('width', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

    HEIGHT: createStyle('height', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

    MINWIDTH: createStyle('minWidth', {
        normalize: [normalizeUnit],
        validate: [validateUnit],
        parse: [parseUnit],
    }),

    MINHEIGHT: createStyle('minHeight', {
        normalize: [normalizeUnit],
        validate: [validateUnit],
        parse: [parseUnit],
    }),

    MAXWIDTH: createStyle('maxWidth', {
        normalize: [normalizeUnit],
        validate: [validateUnit],
        parse: [parseUnit],
    }),

    MAXHEIGHT: createStyle('maxHeight', {
        normalize: [normalizeUnit],
        validate: [validateUnit],
        parse: [parseUnit],
    }),

    BOXSIZING: createStyle('boxSizing', {
        normalize: [normalizeString],
        validate: [createEnumValidator(OPTION_BOX_SIZING)],
        parse: [createEnumParser(OPTION_BOX_SIZING)],
    }),

    ASPECTRATIO: createStyle('aspectRatio', {
        normalize: [normalizeNumber],
        validate: [validateNumber, validateNonNegativeNumber],
        parse: [parseNumber],
    }),

    BORDERTOPWIDTH: createStyle('borderTopWidth', {
        normalize: [normalizeUnit],
        validate: [validatePx, validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    BORDERLEFTWIDTH: createStyle('borderLeftWidth', {
        normalize: [normalizeUnit],
        validate: [validatePx, validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    BORDERRIGHTWIDTH: createStyle('borderRightWidth', {
        normalize: [normalizeUnit],
        validate: [validatePx, validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    BORDERBOTTOMWIDTH: createStyle('borderBottomWidth', {
        normalize: [normalizeUnit],
        validate: [validatePx, validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    BORDERWIDTH: createStyle('borderWidth', {
        normalize: [normalizeUnit],
        validate: [validatePx, validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    OVERFLOW: createStyle('overflow', {
        normalize: [normalizeString],
        validate: [createEnumValidator(OPTION_OVERFLOW)],
        parse: [createEnumParser(OPTION_OVERFLOW)],
    }),

    DISPLAY: createStyle('display', {
        normalize: [normalizeString],
        validate: [createEnumValidator(OPTION_DISPLAY)],
        parse: [createEnumParser(OPTION_DISPLAY)],
    }),

    DIRECTION: createStyle('direction', {
        normalize: [normalizeString],
        validate: [createEnumValidator(OPTION_DIRECTION)],
        parse: [createEnumParser(OPTION_DIRECTION)],
    }),

    PADDINGTOP: createStyle('paddingTop', {
        normalize: [normalizeUnit],
        validate: [validateUnit],
        parse: [parseUnit],
    }),

    PADDINGLEFT: createStyle('paddingLeft', {
        normalize: [normalizeUnit],
        validate: [validateUnit],
        parse: [parseUnit],
    }),

    PADDINGRIGHT: createStyle('paddingRight', {
        normalize: [normalizeUnit],
        validate: [validateUnit],
        parse: [parseUnit],
    }),

    PADDINGBOTTOM: createStyle('paddingBottom', {
        normalize: [normalizeUnit],
        validate: [validateUnit],
        parse: [parseUnit],
    }),

    PADDING: createStyle('padding', {
        normalize: [normalizeUnit],
        validate: [validateUnit],
        parse: [parseUnit],
    }),

    ROWGAP: createStyle('rowGap', {
        normalize: [normalizeUnit],
        validate: [validateUnit],
        parse: [parseUnit],
    }),

    COLUMNGAP: createStyle('columnGap', {
        normalize: [normalizeUnit],
        validate: [validateUnit],
        parse: [parseUnit],
    }),

    GAP: createStyle('gap', {
        normalize: [normalizeUnit],
        validate: [validateUnit],
        parse: [parseUnit],
    }),
}
