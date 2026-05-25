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
    normalizeUnit,
    normalizeNumber,
    normalizeStyleName,
} from './normalizers.ts'
import {
    validateColor,
    validateEnum,
    validateUnit,
    validateAuto,
    validateNone,
    validateNumber,
    validateNonNegativeNumber,
    validatePx,
    validateNonNegativeUnit,
} from './validators.ts'
import {
    parseColor,
    parseEnum,
    parseUnit,
    parseAuto,
    parseNone,
    parseNumber,
} from './parsers.ts'
import {
    createStyle,
    createEnumValidator,
    createEnumParser,
    runNormalizePipeline,
    runValidators,
    runParsePipeline,
} from './utils.ts'

// if (typeof window !== 'undefined') {
//     window.Style = {
//         resolveStyle,
//     }
// }

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

export const STYLE = {
    BACKGROUNDCOLOR: createStyle('backgroundColor', {
        normalize: [normalizeString],
        validate: [validateColor],
        parse: [parseColor],
    }),
    BORDERRADIUS: createStyle('borderRadius', {
        normalize: [normalizeUnit],
        validate: [validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    POSITION: createStyle('position', {
        normalize: [normalizeString],
        validate: [createEnumValidator(POSITION)],
        parse: [createEnumParser(POSITION)],
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

    FLEX: createStyle('flex', {
        normalize: [normalizeNumber],
        validate: [validateNumber, validateNonNegativeNumber],
        parse: [parseNumber],
    }),

    FLEXBASIS: createStyle('flexBasis', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit, validateNonNegativeUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateAuto],
            parse: [parseAuto],
        },
    ]),

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
            validate: [validateUnit, validateNonNegativeUnit],
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
            validate: [validateUnit, validateNonNegativeUnit],
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
        validate: [validateUnit, validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    MINHEIGHT: createStyle('minHeight', {
        normalize: [normalizeUnit],
        validate: [validateUnit, validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    MAXWIDTH: createStyle('maxWidth', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit, validateNonNegativeUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateNone],
            parse: [parseNone],
        },
    ]),

    MAXHEIGHT: createStyle('maxHeight', [
        {
            normalize: [normalizeUnit],
            validate: [validateUnit, validateNonNegativeUnit],
            parse: [parseUnit],
        },
        {
            normalize: [normalizeString],
            validate: [validateNone],
            parse: [parseNone],
        },
    ]),

    BOXSIZING: createStyle('boxSizing', {
        normalize: [normalizeString],
        validate: [createEnumValidator(BOX_SIZING)],
        parse: [createEnumParser(BOX_SIZING)],
    }),

    ASPECTRATIO: createStyle('aspectRatio', {
        normalize: [normalizeNumber],
        validate: [validateNumber, validateNonNegativeNumber],
        parse: [parseNumber],
    }),

    BORDERWIDTH: createStyle('borderWidth', {
        normalize: [normalizeUnit],
        validate: [validatePx, validateNonNegativeUnit],
        parse: [parseUnit],
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

    BORDERSTYLE: createStyle('borderStyle', {
        normalize: [normalizeString],
        validate: [createEnumValidator(BORDER_STYLE)],
        parse: [createEnumParser(BORDER_STYLE)],
    }),

    BORDERCOLOR: createStyle('borderColor', {
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

    PADDINGTOP: createStyle('paddingTop', {
        normalize: [normalizeUnit],
        validate: [validateUnit, validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    PADDINGLEFT: createStyle('paddingLeft', {
        normalize: [normalizeUnit],
        validate: [validateUnit, validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    PADDINGRIGHT: createStyle('paddingRight', {
        normalize: [normalizeUnit],
        validate: [validateUnit, validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    PADDINGBOTTOM: createStyle('paddingBottom', {
        normalize: [normalizeUnit],
        validate: [validateUnit, validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    PADDING: createStyle('padding', {
        normalize: [normalizeUnit],
        validate: [validateUnit, validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    ROWGAP: createStyle('rowGap', {
        normalize: [normalizeUnit],
        validate: [validateUnit, validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    COLUMNGAP: createStyle('columnGap', {
        normalize: [normalizeUnit],
        validate: [validateUnit, validateNonNegativeUnit],
        parse: [parseUnit],
    }),

    GAP: createStyle('gap', {
        normalize: [normalizeUnit],
        validate: [validateUnit, validateNonNegativeUnit],
        parse: [parseUnit],
    }),
}

export default {
    resolveStyle,
    STYLE,
}
