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
    normalizeStyleKey,
    normalizeString,
    normalizeInteger,
    normalizeNumber,
    normalizePx,
    normalizePercent,
    normalizeStyleName,
} from './normalizers.ts'
import {
    validateColor,
    validateEnum,
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
    parseEnum,
    parseAuto,
    parseUnset,
    parseInteger,
    parseNumber,
    parsePx,
    parsePercent,
} from './parsers.ts'
import {
    createStyle,
    createEnumValidator,
    createEnumParser,
    runNormalizePipeline,
    runValidators,
    runParsePipeline,
} from './utils.ts'

export function resolveStyle(name: string, value: any) {
    // Validating name
    if (typeof name !== 'string') {
        throw new Error(`style name must be a string, got '${typeof name}'`)
    }
    const style = STYLE[normalizeStyleKey(name)]
    if (!style) {
        name = normalizeStyleName(name, STYLE)
        throw new Error(`unsupported property '${name}'`)
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

export const STYLE = {
    ZINDEX: createStyle('zIndex', {
        normalize: [normalizeInteger],
        validate: [validateInteger],
        parse: [parseInteger],
    }),

    BACKGROUNDCOLOR: createStyle('backgroundColor', {
        normalize: [normalizeString],
        validate: [validateColor],
        parse: [parseColor],
    }),

    BORDERRADIUS: createStyle('borderRadius', [
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
    ]),

    POSITION: createStyle('position', {
        normalize: [normalizeString],
        validate: [createEnumValidator(POSITION)],
        parse: [createEnumParser(POSITION)],
    }),

    TOP: createStyle('top', [
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
    ]),

    LEFT: createStyle('left', [
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
    ]),

    RIGHT: createStyle('right', [
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
    ]),

    BOTTOM: createStyle('bottom', [
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
    ]),

    ALIGNCONTENT: createStyle('alignContent', {
        normalize: [normalizeString],
        validate: [createEnumValidator(ALIGN_CONTENT)],
        parse: [createEnumParser(ALIGN_CONTENT)],
    }),

    ALIGNITEMS: createStyle('alignItems', {
        normalize: [normalizeString],
        validate: [createEnumValidator(ALIGN_ITEMS)],
        parse: [createEnumParser(ALIGN_ITEMS)],
    }),

    ALIGNSELF: createStyle('alignSelf', {
        normalize: [normalizeString],
        validate: [createEnumValidator(ALIGN_SELF)],
        parse: [createEnumParser(ALIGN_SELF)],
    }),

    FLEXDIRECTION: createStyle('flexDirection', {
        normalize: [normalizeString],
        validate: [createEnumValidator(FLEX_DIRECTION)],
        parse: [createEnumParser(FLEX_DIRECTION)],
    }),

    FLEXWRAP: createStyle('flexWrap', {
        normalize: [normalizeString],
        validate: [createEnumValidator(WRAP)],
        parse: [createEnumParser(WRAP)],
    }),

    JUSTIFYCONTENT: createStyle('justifyContent', {
        normalize: [normalizeString],
        validate: [createEnumValidator(JUSTIFY)],
        parse: [createEnumParser(JUSTIFY)],
    }),

    MARGINTOP: createStyle('marginTop', [
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
    ]),

    MARGINLEFT: createStyle('marginLeft', [
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
    ]),

    MARGINRIGHT: createStyle('marginRight', [
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
    ]),

    MARGINBOTTOM: createStyle('marginBottom', [
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
    ]),

    MARGIN: createStyle('margin', [
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
    ]),

    FLEX: createStyle('flex', [
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
    ]),

    FLEXBASIS: createStyle('flexBasis', [
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
    ]),

    FLEXGROW: createStyle('flexGrow', [
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
    ]),

    FLEXSHRINK: createStyle('flexShrink', [
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
    ]),

    WIDTH: createStyle('width', [
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
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

    HEIGHT: createStyle('height', [
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
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

    MINWIDTH: createStyle('minWidth', [
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
        {
            normalize: [normalizeString],
            validate: [validateUnset],
            parse: [parseUnset],
        },
    ]),

    MINHEIGHT: createStyle('minHeight', [
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
        {
            normalize: [normalizeString],
            validate: [validateUnset],
            parse: [parseUnset],
        },
    ]),

    MAXWIDTH: createStyle('maxWidth', [
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
        {
            normalize: [normalizeString],
            validate: [validateUnset],
            parse: [parseUnset],
        },
    ]),

    MAXHEIGHT: createStyle('maxHeight', [
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
        {
            normalize: [normalizeString],
            validate: [validateUnset],
            parse: [parseUnset],
        },
    ]),

    BOXSIZING: createStyle('boxSizing', {
        normalize: [normalizeString],
        validate: [createEnumValidator(BOX_SIZING)],
        parse: [createEnumParser(BOX_SIZING)],
    }),

    ASPECTRATIO: createStyle('aspectRatio', {
        normalize: [normalizeNumber],
        validate: [validateNumber, validateNonNegative],
        parse: [parseNumber],
    }),

    BORDERWIDTH: createStyle('borderWidth', {
        normalize: [normalizePx],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    }),

    BORDERTOPWIDTH: createStyle('borderTopWidth', {
        normalize: [normalizePx],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    }),

    BORDERLEFTWIDTH: createStyle('borderLeftWidth', {
        normalize: [normalizePx],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    }),

    BORDERRIGHTWIDTH: createStyle('borderRightWidth', {
        normalize: [normalizePx],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    }),

    BORDERBOTTOMWIDTH: createStyle('borderBottomWidth', {
        normalize: [normalizePx],
        validate: [validateNonNegative, validatePx],
        parse: [parsePx],
    }),

    BORDERSTYLE: createStyle('borderStyle', {
        normalize: [normalizeString],
        validate: [createEnumValidator(BORDER_STYLE)],
        parse: [createEnumParser(BORDER_STYLE)],
    }),

    BORDERTOPSTYLE: createStyle('borderTopStyle', {
        normalize: [normalizeString],
        validate: [createEnumValidator(BORDER_STYLE)],
        parse: [createEnumParser(BORDER_STYLE)],
    }),

    BORDERLEFTSTYLE: createStyle('borderLeftStyle', {
        normalize: [normalizeString],
        validate: [createEnumValidator(BORDER_STYLE)],
        parse: [createEnumParser(BORDER_STYLE)],
    }),

    BORDERRIGHTSTYLE: createStyle('borderRightStyle', {
        normalize: [normalizeString],
        validate: [createEnumValidator(BORDER_STYLE)],
        parse: [createEnumParser(BORDER_STYLE)],
    }),

    BORDERBOTTOMSTYLE: createStyle('borderBottomStyle', {
        normalize: [normalizeString],
        validate: [createEnumValidator(BORDER_STYLE)],
        parse: [createEnumParser(BORDER_STYLE)],
    }),

    BORDERCOLOR: createStyle('borderColor', {
        normalize: [normalizeString],
        validate: [validateColor],
        parse: [parseColor],
    }),

    BORDERTOPCOLOR: createStyle('borderTopColor', {
        normalize: [normalizeString],
        validate: [validateColor],
        parse: [parseColor],
    }),

    BORDERLEFTCOLOR: createStyle('borderLeftColor', {
        normalize: [normalizeString],
        validate: [validateColor],
        parse: [parseColor],
    }),

    BORDERRIGHTCOLOR: createStyle('borderRightColor', {
        normalize: [normalizeString],
        validate: [validateColor],
        parse: [parseColor],
    }),

    BORDERBOTTOMCOLOR: createStyle('borderBottomColor', {
        normalize: [normalizeString],
        validate: [validateColor],
        parse: [parseColor],
    }),

    OVERFLOW: createStyle('overflow', {
        normalize: [normalizeString],
        validate: [createEnumValidator(OVERFLOW)],
        parse: [createEnumParser(OVERFLOW)],
    }),

    DISPLAY: createStyle('display', {
        normalize: [normalizeString],
        validate: [createEnumValidator(DISPLAY)],
        parse: [createEnumParser(DISPLAY)],
    }),

    DIRECTION: createStyle('direction', {
        normalize: [normalizeString],
        validate: [createEnumValidator(DIRECTION)],
        parse: [createEnumParser(DIRECTION)],
    }),

    PADDINGTOP: createStyle('paddingTop', [
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
    ]),

    PADDINGLEFT: createStyle('paddingLeft', [
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
    ]),

    PADDINGRIGHT: createStyle('paddingRight', [
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
    ]),

    PADDINGBOTTOM: createStyle('paddingBottom', [
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
    ]),

    PADDING: createStyle('padding', [
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
    ]),

    GAP: createStyle('gap', [
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
        {
            normalize: [normalizeString],
            validate: [validateUnset],
            parse: [parseUnset],
        },
    ]),

    ROWGAP: createStyle('rowGap', [
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
        {
            normalize: [normalizeString],
            validate: [validateUnset],
            parse: [parseUnset],
        },
    ]),

    COLUMNGAP: createStyle('columnGap', [
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
        {
            normalize: [normalizeString],
            validate: [validateUnset],
            parse: [parseUnset],
        },
    ]),
}

export default {
    resolveStyle,
    STYLE,
}
