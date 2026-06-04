import {
    ALIGN_CONTENT,
    ALIGN_ITEMS,
    ALIGN_SELF,
    BORDER_STYLE,
    BOX_SIZING,
    DIRECTION,
    DISPLAY,
    FLEX_DIRECTION,
    JUSTIFY,
    OVERFLOW,
    POSITION,
    WRAP,
} from './consts.ts'
import {
    normalizeString,
    normalizeInteger,
    normalizeNumber,
    normalizePx,
    normalizePercent,
} from './normalizers.ts'
import {
    validateColor,
    validateAuto,
    validateUnset,
    validateInteger,
    validateNumber,
    validatePx,
    validatePercent,
    validateNonNegative,
} from './validators.ts'
import {
    parseColor,
    parseAuto,
    parseUnset,
    parseInteger,
    parseNumber,
    parsePx,
    parsePercent,
} from './parsers.ts'
import { createEnumValidator, createEnumParser } from './utils.ts'

export const INTEGER_VALUE = [
    {
        normalize: [normalizeInteger],
        validate: [validateInteger],
        parse: [parseInteger],
    },
]

export const COLOR_VALUE = [
    {
        normalize: [normalizeString],
        validate: [validateColor],
        parse: [parseColor],
    },
]

export const PX_PERCENT_VALUE = [
    {
        normalize: [normalizePx],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizePercent],
        validate: [validateNonNegative, validatePercent],
        parse: [parsePercent],
    },
]

export const OFFSET_VALUE = [
    {
        normalize: [normalizePx],
        validate: [validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizePercent],
        validate: [validatePercent],
        parse: [parsePercent],
    },
    {
        normalize: [normalizeString],
        validate: [validateAuto],
        parse: [parseAuto],
    },
    {
        normalize: [normalizeString],
        validate: [validateUnset],
        parse: [parseUnset],
    },
]

export const OVERFLOW_VALUE = [
    {
        normalize: [normalizeString],
        validate: [createEnumValidator(OVERFLOW)],
        parse: [createEnumParser(OVERFLOW)],
    },
]

export const POSITION_VALUE = [
    {
        normalize: [normalizeString],
        validate: [createEnumValidator(POSITION)],
        parse: [createEnumParser(POSITION)],
    },
]

export const ALIGN_CONTENT_VALUE = [
    {
        normalize: [normalizeString],
        validate: [createEnumValidator(ALIGN_CONTENT)],
        parse: [createEnumParser(ALIGN_CONTENT)],
    },
]

export const ALIGN_ITEMS_VALUE = [
    {
        normalize: [normalizeString],
        validate: [createEnumValidator(ALIGN_ITEMS)],
        parse: [createEnumParser(ALIGN_ITEMS)],
    },
]

export const ALIGN_SELF_VALUE = [
    {
        normalize: [normalizeString],
        validate: [createEnumValidator(ALIGN_SELF)],
        parse: [createEnumParser(ALIGN_SELF)],
    },
]

export const FLEX_DIRECTION_VALUE = [
    {
        normalize: [normalizeString],
        validate: [createEnumValidator(FLEX_DIRECTION)],
        parse: [createEnumParser(FLEX_DIRECTION)],
    },
]

export const FLEX_WRAP_VALUE = [
    {
        normalize: [normalizeString],
        validate: [createEnumValidator(WRAP)],
        parse: [createEnumParser(WRAP)],
    },
]

export const JUSTIFY_CONTENT_VALUE = [
    {
        normalize: [normalizeString],
        validate: [createEnumValidator(JUSTIFY)],
        parse: [createEnumParser(JUSTIFY)],
    },
]

export const MARGIN_VALUE = [
    {
        normalize: [normalizePx],
        validate: [validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizePercent],
        validate: [validatePercent],
        parse: [parsePercent],
    },
    {
        normalize: [normalizeString],
        validate: [validateAuto],
        parse: [parseAuto],
    },
]

export const NUMBER_UNSET_VALUE = [
    {
        normalize: [normalizeNumber],
        validate: [validateNumber, validateNonNegative],
        parse: [parseNumber],
    },
    {
        normalize: [normalizeString],
        validate: [validateUnset],
        parse: [parseUnset],
    },
]

export const FLEX_BASIS_VALUE = [
    ...PX_PERCENT_VALUE,
    {
        normalize: [normalizeString],
        validate: [validateAuto],
        parse: [parseAuto],
    },
    {
        normalize: [normalizeString],
        validate: [validateUnset],
        parse: [parseUnset],
    },
]

export const SIZE_VALUE = [
    ...PX_PERCENT_VALUE,
    {
        normalize: [normalizeString],
        validate: [validateAuto],
        parse: [parseAuto],
    },
]

export const MIN_MAX_SIZE_VALUE = [
    ...PX_PERCENT_VALUE,
    {
        normalize: [normalizeString],
        validate: [validateUnset],
        parse: [parseUnset],
    },
]

export const BORDER_WIDTH_VALUE = [
    {
        normalize: [normalizePx],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    },
]

export const BORDER_VALUE = [
    {
        normalize: [normalizeString],
        validate: [createEnumValidator(BORDER_STYLE)],
        parse: [createEnumParser(BORDER_STYLE)],
    },
]

export const BOX_SIZING_VALUE = [
    {
        normalize: [normalizeString],
        validate: [createEnumValidator(BOX_SIZING)],
        parse: [createEnumParser(BOX_SIZING)],
    },
]

export const DISPLAY_VALUE = [
    {
        normalize: [normalizeString],
        validate: [createEnumValidator(DISPLAY)],
        parse: [createEnumParser(DISPLAY)],
    },
]

export const DIRECTION_VALUE = [
    {
        normalize: [normalizeString],
        validate: [createEnumValidator(DIRECTION)],
        parse: [createEnumParser(DIRECTION)],
    },
]
