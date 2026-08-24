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
    POINTER_EVENTS,
    POSITION,
    TEXT_ALIGN,
    WRAP,
} from './consts'
import { normalizeTrim, normalizeToLowercase } from './normalizers'
import {
    validateColor,
    validateAuto,
    validateBoxShadow,
    validateTextShadow,
    validateTextStroke,
    validateInteger,
    validateNumber,
    validatePx,
    validatePercent,
    validateRem,
    validateVw,
    validateVh,
    validateNonNegative,
    validateMaxOne,
    validateImageSrc,
    validateUnset,
    validateNotUnset,
} from './validators'
import {
    parseString,
    parseBoxShadow,
    parseTextShadow,
    parseTextStroke,
    parseColor,
    parseAuto,
    parseInteger,
    parseNumber,
    parsePx,
    parsePercent,
    parseRem,
    parseVw,
    parseVh,
    parseUnset,
} from './parsers'
import { createEnumValidator, createEnumParser } from './utils'

export const UNSET_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateUnset],
        parse: [parseUnset],
    },
]

export const INTEGER_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateInteger],
        parse: [parseInteger],
    },
    ...UNSET_DEFINITION,
]

export const COLOR_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateColor],
        parse: [parseColor],
    },
    ...UNSET_DEFINITION,
]

export const OPACITY_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNumber, validateNonNegative, validateMaxOne],
        parse: [parseNumber],
    },
    ...UNSET_DEFINITION,
]

export const BOX_SHADOW_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateBoxShadow],
        parse: [parseBoxShadow],
    },
    ...UNSET_DEFINITION,
]

export const TEXT_SHADOW_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateTextShadow],
        parse: [parseTextShadow],
    },
    ...UNSET_DEFINITION,
]

export const TEXT_STROKE_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateTextStroke],
        parse: [parseTextStroke],
    },
    ...UNSET_DEFINITION,
]

export const FONT_FAMILY_DEFINITION = [
    {
        normalize: [normalizeTrim],
        validate: [validateNotUnset],
        parse: [parseString],
    },
    ...UNSET_DEFINITION,
]

export const FONT_SIZE_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateRem],
        parse: [parseRem],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateVw],
        parse: [parseVw],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateVh],
        parse: [parseVh],
    },
    ...UNSET_DEFINITION,
]

export const LINE_HEIGHT_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateNumber],
        parse: [parseNumber],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateRem],
        parse: [parseRem],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateVw],
        parse: [parseVw],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateVh],
        parse: [parseVh],
    },
    ...UNSET_DEFINITION,
]

export const LETTER_SPACING_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateRem],
        parse: [parseRem],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateVw],
        parse: [parseVw],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateVh],
        parse: [parseVh],
    },
    ...UNSET_DEFINITION,
]

export const TEXT_ALIGN_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(TEXT_ALIGN)],
        parse: [createEnumParser(TEXT_ALIGN)],
    },
    ...UNSET_DEFINITION,
]

const PX_PERCENT_VALUE_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateRem],
        parse: [parseRem],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateVw],
        parse: [parseVw],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateVh],
        parse: [parseVh],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validatePercent],
        parse: [parsePercent],
    },
]

export const PX_PERCENT_DEFINITION = [...PX_PERCENT_VALUE_DEFINITION, ...UNSET_DEFINITION]

export const OFFSET_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateRem],
        parse: [parseRem],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateVw],
        parse: [parseVw],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateVh],
        parse: [parseVh],
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
    ...UNSET_DEFINITION,
]

export const OVERFLOW_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(OVERFLOW)],
        parse: [createEnumParser(OVERFLOW)],
    },
    ...UNSET_DEFINITION,
]

export const POSITION_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(POSITION)],
        parse: [createEnumParser(POSITION)],
    },
    ...UNSET_DEFINITION,
]

export const ALIGN_CONTENT_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(ALIGN_CONTENT)],
        parse: [createEnumParser(ALIGN_CONTENT)],
    },
    ...UNSET_DEFINITION,
]

export const ALIGN_ITEMS_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(ALIGN_ITEMS)],
        parse: [createEnumParser(ALIGN_ITEMS)],
    },
    ...UNSET_DEFINITION,
]

export const ALIGN_SELF_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(ALIGN_SELF)],
        parse: [createEnumParser(ALIGN_SELF)],
    },
    ...UNSET_DEFINITION,
]

export const FLEX_DIRECTION_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(FLEX_DIRECTION)],
        parse: [createEnumParser(FLEX_DIRECTION)],
    },
    ...UNSET_DEFINITION,
]

export const FLEX_WRAP_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(WRAP)],
        parse: [createEnumParser(WRAP)],
    },
    ...UNSET_DEFINITION,
]

export const JUSTIFY_CONTENT_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(JUSTIFY)],
        parse: [createEnumParser(JUSTIFY)],
    },
    ...UNSET_DEFINITION,
]

export const MARGIN_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateRem],
        parse: [parseRem],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateVw],
        parse: [parseVw],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateVh],
        parse: [parseVh],
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
    ...UNSET_DEFINITION,
]

export const NUMBER_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNumber, validateNonNegative],
        parse: [parseNumber],
    },
    ...UNSET_DEFINITION,
]

export const FLEX_BASIS_DEFINITION = [
    ...PX_PERCENT_VALUE_DEFINITION,
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateAuto],
        parse: [parseAuto],
    },
    ...UNSET_DEFINITION,
]

export const SIZE_DEFINITION = [
    ...PX_PERCENT_VALUE_DEFINITION,
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateAuto],
        parse: [parseAuto],
    },
    ...UNSET_DEFINITION,
]

export const MIN_MAX_SIZE_DEFINITION = [...PX_PERCENT_VALUE_DEFINITION, ...UNSET_DEFINITION]

export const BORDER_WIDTH_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateRem],
        parse: [parseRem],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateVw],
        parse: [parseVw],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateVh],
        parse: [parseVh],
    },
    ...UNSET_DEFINITION,
]

export const BORDER_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(BORDER_STYLE)],
        parse: [createEnumParser(BORDER_STYLE)],
    },
    ...UNSET_DEFINITION,
]

export const BOX_SIZING_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(BOX_SIZING)],
        parse: [createEnumParser(BOX_SIZING)],
    },
    ...UNSET_DEFINITION,
]

export const DISPLAY_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(DISPLAY)],
        parse: [createEnumParser(DISPLAY)],
    },
    ...UNSET_DEFINITION,
]

export const POINTER_EVENTS_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(POINTER_EVENTS)],
        parse: [createEnumParser(POINTER_EVENTS)],
    },
    ...UNSET_DEFINITION,
]

export const DIRECTION_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(DIRECTION)],
        parse: [createEnumParser(DIRECTION)],
    },
    ...UNSET_DEFINITION,
]

export const BACKGROUNDIMAGE_DEFINITION = [
    {
        normalize: [normalizeTrim],
        validate: [validateImageSrc],
        parse: [parseString],
    },
    ...UNSET_DEFINITION,
]

export const BACKGROUND_SIZE_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateRem],
        parse: [parseRem],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateVw],
        parse: [parseVw],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateNonNegative, validateVh],
        parse: [parseVh],
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
    ...UNSET_DEFINITION,
]

export const BACKGROUND_REPEAT_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [createEnumValidator(BACKGROUND_REPEAT)],
        parse: [createEnumParser(BACKGROUND_REPEAT)],
    },
    ...UNSET_DEFINITION,
]

export const BACKGROUND_POSITION_DEFINITION = [
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validatePx],
        parse: [parsePx],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateRem],
        parse: [parseRem],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateVw],
        parse: [parseVw],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validateVh],
        parse: [parseVh],
    },
    {
        normalize: [normalizeTrim, normalizeToLowercase],
        validate: [validatePercent],
        parse: [parsePercent],
    },
    ...UNSET_DEFINITION,
]
