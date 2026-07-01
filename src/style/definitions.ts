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
} from './consts'
import {
    validateColor,
    validateAuto,
    validateUnset,
    validateInteger,
    validateNumber,
    validatePx,
    validatePercent,
    validateNonNegative,
    validateMaxOne,
} from './validators'
import { parseColor, parseAuto, parseUnset, parseInteger, parseNumber, parsePx, parsePercent } from './parsers'
import { createEnumValidator, createEnumParser } from './utils'

export const INTEGER_DEFINITION = [
    {
        validate: [validateInteger],
        parse: [parseInteger],
    },
]

export const COLOR_DEFINITION = [
    {
        validate: [validateColor],
        parse: [parseColor],
    },
]

export const OPACITY_DEFINITION = [
    {
        validate: [validateNumber, validateNonNegative, validateMaxOne],
        parse: [parseNumber],
    },
]

export const PX_PERCENT_DEFINITION = [
    {
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    },
    {
        validate: [validateNonNegative, validatePercent],
        parse: [parsePercent],
    },
]

export const OFFSET_DEFINITION = [
    {
        validate: [validatePx],
        parse: [parsePx],
    },
    {
        validate: [validatePercent],
        parse: [parsePercent],
    },
    {
        validate: [validateAuto],
        parse: [parseAuto],
    },
    {
        validate: [validateUnset],
        parse: [parseUnset],
    },
]

export const OVERFLOW_DEFINITION = [
    {
        validate: [createEnumValidator(OVERFLOW)],
        parse: [createEnumParser(OVERFLOW)],
    },
]

export const POSITION_DEFINITION = [
    {
        validate: [createEnumValidator(POSITION)],
        parse: [createEnumParser(POSITION)],
    },
]

export const ALIGN_CONTENT_DEFINITION = [
    {
        validate: [createEnumValidator(ALIGN_CONTENT)],
        parse: [createEnumParser(ALIGN_CONTENT)],
    },
]

export const ALIGN_ITEMS_DEFINITION = [
    {
        validate: [createEnumValidator(ALIGN_ITEMS)],
        parse: [createEnumParser(ALIGN_ITEMS)],
    },
]

export const ALIGN_SELF_DEFINITION = [
    {
        validate: [createEnumValidator(ALIGN_SELF)],
        parse: [createEnumParser(ALIGN_SELF)],
    },
]

export const FLEX_DIRECTION_DEFINITION = [
    {
        validate: [createEnumValidator(FLEX_DIRECTION)],
        parse: [createEnumParser(FLEX_DIRECTION)],
    },
]

export const FLEX_WRAP_DEFINITION = [
    {
        validate: [createEnumValidator(WRAP)],
        parse: [createEnumParser(WRAP)],
    },
]

export const JUSTIFY_CONTENT_DEFINITION = [
    {
        validate: [createEnumValidator(JUSTIFY)],
        parse: [createEnumParser(JUSTIFY)],
    },
]

export const MARGIN_DEFINITION = [
    {
        validate: [validatePx],
        parse: [parsePx],
    },
    {
        validate: [validatePercent],
        parse: [parsePercent],
    },
    {
        validate: [validateAuto],
        parse: [parseAuto],
    },
]

export const NUMBER_UNSET_DEFINITION = [
    {
        validate: [validateNumber, validateNonNegative],
        parse: [parseNumber],
    },
    {
        validate: [validateUnset],
        parse: [parseUnset],
    },
]

export const FLEX_BASIS_DEFINITION = [
    ...PX_PERCENT_DEFINITION,
    {
        validate: [validateAuto],
        parse: [parseAuto],
    },
    {
        validate: [validateUnset],
        parse: [parseUnset],
    },
]

export const SIZE_DEFINITION = [
    ...PX_PERCENT_DEFINITION,
    {
        validate: [validateAuto],
        parse: [parseAuto],
    },
]

export const MIN_MAX_SIZE_DEFINITION = [
    ...PX_PERCENT_DEFINITION,
    {
        validate: [validateUnset],
        parse: [parseUnset],
    },
]

export const BORDER_WIDTH_DEFINITION = [
    {
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    },
]

export const BORDER_DEFINITION = [
    {
        validate: [createEnumValidator(BORDER_STYLE)],
        parse: [createEnumParser(BORDER_STYLE)],
    },
]

export const BOX_SIZING_DEFINITION = [
    {
        validate: [createEnumValidator(BOX_SIZING)],
        parse: [createEnumParser(BOX_SIZING)],
    },
]

export const DISPLAY_DEFINITION = [
    {
        validate: [createEnumValidator(DISPLAY)],
        parse: [createEnumParser(DISPLAY)],
    },
]

export const DIRECTION_DEFINITION = [
    {
        validate: [createEnumValidator(DIRECTION)],
        parse: [createEnumParser(DIRECTION)],
    },
]

export const BACKGROUNDIMAGE_DEFINITION = [
    {
        validate: [validateUnset],
        parse: [parseUnset],
    },
]
