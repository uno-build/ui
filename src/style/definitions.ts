import {
    ALIGN_CONTENT,
    ALIGN_ITEMS,
    ALIGN_SELF,
    BACKGROUND_REPEAT,
    BACKGROUND_SIZE,
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
import { normalizeTrim, normalizeToLowercase } from './normalizers'
import {
    validateColor,
    validateAuto,
    validateBoxShadow,
    validateUnset,
    validateInteger,
    validateNumber,
    validatePx,
    validatePercent,
    validateNonNegative,
    validateMaxOne,
    validateImageSrc,
} from './validators'
import {
    parseString,
    parseBoxShadow,
    parseColor,
    parseAuto,
    parseUnset,
    parseInteger,
    parseNumber,
    parsePx,
    parsePercent,
} from './parsers'
import { createEnumValidator, createEnumParser } from './utils'

export const INTEGER_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateInteger],
        parse: [parseInteger],
    },
]

export const COLOR_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateColor],
        parse: [parseColor],
    },
]

export const OPACITY_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNumber, validateNonNegative, validateMaxOne],
        parse: [parseNumber],
    },
]

export const BOX_SHADOW_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateBoxShadow],
        parse: [parseBoxShadow],
    },
]

export const FONT_FAMILY_DEFINITION = [
    {
        normalize: [normalizeTrim],
        validate: [],
        parse: [parseString],
    },
]

export const FONT_SIZE_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    },
]

export const PX_PERCENT_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validatePercent],
        parse: [parsePercent],
    },
]

export const OFFSET_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validatePercent],
        parse: [parsePercent],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateAuto],
        parse: [parseAuto],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateUnset],
        parse: [parseUnset],
    },
]

export const OVERFLOW_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(OVERFLOW)],
        parse: [createEnumParser(OVERFLOW)],
    },
]

export const POSITION_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(POSITION)],
        parse: [createEnumParser(POSITION)],
    },
]

export const ALIGN_CONTENT_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(ALIGN_CONTENT)],
        parse: [createEnumParser(ALIGN_CONTENT)],
    },
]

export const ALIGN_ITEMS_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(ALIGN_ITEMS)],
        parse: [createEnumParser(ALIGN_ITEMS)],
    },
]

export const ALIGN_SELF_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(ALIGN_SELF)],
        parse: [createEnumParser(ALIGN_SELF)],
    },
]

export const FLEX_DIRECTION_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(FLEX_DIRECTION)],
        parse: [createEnumParser(FLEX_DIRECTION)],
    },
]

export const FLEX_WRAP_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(WRAP)],
        parse: [createEnumParser(WRAP)],
    },
]

export const JUSTIFY_CONTENT_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(JUSTIFY)],
        parse: [createEnumParser(JUSTIFY)],
    },
]

export const MARGIN_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validatePercent],
        parse: [parsePercent],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateAuto],
        parse: [parseAuto],
    },
]

export const NUMBER_UNSET_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNumber, validateNonNegative],
        parse: [parseNumber],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateUnset],
        parse: [parseUnset],
    },
]

export const FLEX_BASIS_DEFINITION = [
    ...PX_PERCENT_DEFINITION,
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateAuto],
        parse: [parseAuto],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateUnset],
        parse: [parseUnset],
    },
]

export const SIZE_DEFINITION = [
    ...PX_PERCENT_DEFINITION,
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateAuto],
        parse: [parseAuto],
    },
]

export const MIN_MAX_SIZE_DEFINITION = [
    ...PX_PERCENT_DEFINITION,
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateUnset],
        parse: [parseUnset],
    },
]

export const BORDER_WIDTH_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    },
]

export const BORDER_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(BORDER_STYLE)],
        parse: [createEnumParser(BORDER_STYLE)],
    },
]

export const BOX_SIZING_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(BOX_SIZING)],
        parse: [createEnumParser(BOX_SIZING)],
    },
]

export const DISPLAY_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(DISPLAY)],
        parse: [createEnumParser(DISPLAY)],
    },
]

export const DIRECTION_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(DIRECTION)],
        parse: [createEnumParser(DIRECTION)],
    },
]

export const BACKGROUNDIMAGE_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateUnset],
        parse: [parseUnset],
    },
    {
        normalize: [normalizeTrim],
        validate: [validateImageSrc],
        parse: [parseString],
    },
]

export const BACKGROUND_SIZE_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validatePercent],
        parse: [parsePercent],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(BACKGROUND_SIZE)],
        parse: [createEnumParser(BACKGROUND_SIZE)],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateUnset],
        parse: [parseUnset],
    },
]

export const BACKGROUND_REPEAT_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(BACKGROUND_REPEAT)],
        parse: [createEnumParser(BACKGROUND_REPEAT)],
    },
]

export const BACKGROUND_POSITION_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validatePercent],
        parse: [parsePercent],
    },
]
