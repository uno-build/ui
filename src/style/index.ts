import { normalizeStyleKey, normalizeStyleName } from './normalizers.ts'
import { runNormalizePipeline, runValidators, runParsePipeline } from './utils.ts'
import {
    ALIGN_CONTENT_DEFINITION,
    ALIGN_ITEMS_DEFINITION,
    ALIGN_SELF_DEFINITION,
    BORDER_DEFINITION,
    BORDER_WIDTH_DEFINITION,
    BOX_SIZING_DEFINITION,
    COLOR_DEFINITION,
    DIRECTION_DEFINITION,
    DISPLAY_DEFINITION,
    FLEX_BASIS_DEFINITION,
    FLEX_DIRECTION_DEFINITION,
    FLEX_WRAP_DEFINITION,
    JUSTIFY_CONTENT_DEFINITION,
    MARGIN_DEFINITION,
    MIN_MAX_SIZE_DEFINITION,
    NUMBER_UNSET_DEFINITION,
    OFFSET_DEFINITION,
    OVERFLOW_DEFINITION,
    POSITION_DEFINITION,
    PX_PERCENT_DEFINITION,
    SIZE_DEFINITION,
    INTEGER_DEFINITION,
} from './definitions.ts'

export function resolveStyle(name: string, value: any) {
    // Validating name
    if (typeof name !== 'string') {
        throw new Error(`style name must be a string, got '${typeof name}'`)
    }

    name = normalizeStyleName(name, STYLE)
    const StyleParser = STYLE[normalizeStyleKey(name)]

    if (!StyleParser) {
        throw new Error(`unsupported property '${name}'`)
    }

    try {
        return StyleParser.resolve(value)
    } catch (err) {
        const message = err instanceof Error ? err.message : err
        const suffix = message ? `: ${message}` : ''
        throw new Error(`invalid value '${value}' for property '${name}'${suffix}`)
    }
}

function createStyle(name, shorthandCallback) {
    return {
        name,
        resolve(value) {
            let firstError: unknown
            const style_shorthand = shorthandCallback(name, value)
            const styles = []

            for (const { name, value, definition } of style_shorthand) {
                for (const definition_item of definition) {
                    const normalized = runNormalizePipeline(definition_item.normalize, value)

                    try {
                        runValidators(definition_item.validate, normalized)
                    } catch (err) {
                        firstError ??= err
                        continue
                    }

                    const result = runParsePipeline(definition_item.parse, normalized)
                    styles.push({
                        name,
                        ...result,
                        value: String(result.value),
                    })
                }
            }

            return styles
        },
    }
}

/* prettier-ignore */
export const STYLE = {
    ZINDEX: createStyle('zIndex', (name, value) => [
        { name, value, definition: INTEGER_DEFINITION },
    ]),
    OVERFLOW: createStyle('overflow', (name, value) => [
        { name, value, definition: OVERFLOW_DEFINITION },
    ]),
    BACKGROUNDCOLOR: createStyle('backgroundColor', (name, value) => [
        { name, value, definition: COLOR_DEFINITION },
    ]),
    BORDERTOPLEFTRADIUS: createStyle('borderTopLeftRadius', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    BORDERTOPRIGHTRADIUS: createStyle('borderTopRightRadius', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    BORDERBOTTOMLEFTRADIUS: createStyle('borderBottomLeftRadius', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    BORDERBOTTOMRIGHTRADIUS: createStyle('borderBottomRightRadius', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    BORDERTOPSTYLE: createStyle('borderTopStyle', (name, value) => [
        { name, value, definition: BORDER_DEFINITION },
    ]),
    BORDERLEFTSTYLE: createStyle('borderLeftStyle', (name, value) => [
        { name, value, definition: BORDER_DEFINITION },
    ]),
    BORDERRIGHTSTYLE: createStyle('borderRightStyle', (name, value) => [
        { name, value, definition: BORDER_DEFINITION },
    ]),
    BORDERBOTTOMSTYLE: createStyle('borderBottomStyle', (name, value) => [
        { name, value, definition: BORDER_DEFINITION },
    ]),
    BORDERTOPCOLOR: createStyle('borderTopColor', (name, value) => [
        { name, value, definition: COLOR_DEFINITION },
    ]),
    BORDERLEFTCOLOR: createStyle('borderLeftColor', (name, value) => [
        { name, value, definition: COLOR_DEFINITION },
    ]),
    BORDERRIGHTCOLOR: createStyle('borderRightColor', (name, value) => [
        { name, value, definition: COLOR_DEFINITION },
    ]),
    BORDERBOTTOMCOLOR: createStyle('borderBottomColor', (name, value) => [
        { name, value, definition: COLOR_DEFINITION },
    ]),

    // YOGA PROPERTIES
    POSITION: createStyle('position', (name, value) => [
        { name, value, definition: POSITION_DEFINITION },
    ]),
    TOP: createStyle('top', (name, value) => [
        { name, value, definition: OFFSET_DEFINITION }
    ]),
    LEFT: createStyle('left', (name, value) => [
        { name, value, definition: OFFSET_DEFINITION }
    ]),
    RIGHT: createStyle('right', (name, value) => [
        { name, value, definition: OFFSET_DEFINITION }
    ]),
    BOTTOM: createStyle('bottom', (name, value) => [
        { name, value, definition: OFFSET_DEFINITION },
    ]),
    ALIGNCONTENT: createStyle('alignContent', (name, value) => [
        { name, value, definition: ALIGN_CONTENT_DEFINITION },
    ]),
    ALIGNITEMS: createStyle('alignItems', (name, value) => [
        { name, value, definition: ALIGN_ITEMS_DEFINITION },
    ]),
    ALIGNSELF: createStyle('alignSelf', (name, value) => [
        { name, value, definition: ALIGN_SELF_DEFINITION },
    ]),
    FLEXDIRECTION: createStyle('flexDirection', (name, value) => [
        { name, value, definition: FLEX_DIRECTION_DEFINITION },
    ]),
    FLEXWRAP: createStyle('flexWrap', (name, value) => [
        { name, value, definition: FLEX_WRAP_DEFINITION },
    ]),
    JUSTIFYCONTENT: createStyle('justifyContent', (name, value) => [
        { name, value, definition: JUSTIFY_CONTENT_DEFINITION },
    ]),
    MARGIN: createStyle('margin', (name, value) => [
        { name, value, definition: MARGIN_DEFINITION },
    ]),
    MARGINTOP: createStyle('marginTop', (name, value) => [
        { name, value, definition: MARGIN_DEFINITION },
    ]),
    MARGINLEFT: createStyle('marginLeft', (name, value) => [
        { name, value, definition: MARGIN_DEFINITION },
    ]),
    MARGINRIGHT: createStyle('marginRight', (name, value) => [
        { name, value, definition: MARGIN_DEFINITION },
    ]),
    MARGINBOTTOM: createStyle('marginBottom', (name, value) => [
        { name, value, definition: MARGIN_DEFINITION },
    ]),
    FLEX: createStyle('flex', (name, value) => [
        { name, value, definition: NUMBER_UNSET_DEFINITION },
    ]),
    FLEXGROW: createStyle('flexGrow', (name, value) => [
        { name, value, definition: NUMBER_UNSET_DEFINITION },
    ]),
    FLEXSHRINK: createStyle('flexShrink', (name, value) => [
        { name, value, definition: NUMBER_UNSET_DEFINITION },
    ]),
    FLEXBASIS: createStyle('flexBasis', (name, value) => [
        { name, value, definition: FLEX_BASIS_DEFINITION },
    ]),
    WIDTH: createStyle('width', (name, value) => [
        { name, value, definition: SIZE_DEFINITION }
    ]),
    HEIGHT: createStyle('height', (name, value) => [
        { name, value, definition: SIZE_DEFINITION }
    ]),
    MINWIDTH: createStyle('minWidth', (name, value) => [
        { name, value, definition: MIN_MAX_SIZE_DEFINITION },
    ]),
    MINHEIGHT: createStyle('minHeight', (name, value) => [
        { name, value, definition: MIN_MAX_SIZE_DEFINITION },
    ]),
    MAXWIDTH: createStyle('maxWidth', (name, value) => [
        { name, value, definition: MIN_MAX_SIZE_DEFINITION },
    ]),
    MAXHEIGHT: createStyle('maxHeight', (name, value) => [
        { name, value, definition: MIN_MAX_SIZE_DEFINITION },
    ]),
    BOXSIZING: createStyle('boxSizing', (name, value) => [
        { name, value, definition: BOX_SIZING_DEFINITION },
    ]),
    ASPECTRATIO: createStyle('aspectRatio', (name, value) => [
        { name, value, definition: NUMBER_UNSET_DEFINITION },
    ]),
    BORDERTOPWIDTH: createStyle('borderTopWidth', (name, value) => [
        { name, value, definition: BORDER_WIDTH_DEFINITION },
    ]),
    BORDERLEFTWIDTH: createStyle('borderLeftWidth', (name, value) => [
        { name, value, definition: BORDER_WIDTH_DEFINITION },
    ]),
    BORDERRIGHTWIDTH: createStyle('borderRightWidth', (name, value) => [
        { name, value, definition: BORDER_WIDTH_DEFINITION },
    ]),
    BORDERBOTTOMWIDTH: createStyle('borderBottomWidth', (name, value) => [
        { name, value, definition: BORDER_WIDTH_DEFINITION },
    ]),
    DISPLAY: createStyle('display', (name, value) => [
        { name, value, definition: DISPLAY_DEFINITION },
    ]),
    DIRECTION: createStyle('direction', (name, value) => [
        { name, value, definition: DIRECTION_DEFINITION },
    ]),
    PADDING: createStyle('padding', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    PADDINGTOP: createStyle('paddingTop', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    PADDINGLEFT: createStyle('paddingLeft', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    PADDINGRIGHT: createStyle('paddingRight', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    PADDINGBOTTOM: createStyle('paddingBottom', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    GAP: createStyle('gap', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION }
    ]),
    ROWGAP: createStyle('rowGap', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
    COLUMNGAP: createStyle('columnGap', (name, value) => [
        { name, value, definition: PX_PERCENT_DEFINITION },
    ]),
}

export default {
    resolveStyle,
    STYLE,
}
