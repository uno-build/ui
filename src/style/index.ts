import { normalizeStyleKey, normalizeStyleName } from './normalizers.ts'
import { createStyle } from './utils.ts'
import {
    ALIGN_CONTENT_VALUE,
    ALIGN_ITEMS_VALUE,
    ALIGN_SELF_VALUE,
    BORDER_VALUE,
    BORDER_WIDTH_VALUE,
    BOX_SIZING_VALUE,
    COLOR_VALUE,
    DIRECTION_VALUE,
    DISPLAY_VALUE,
    FLEX_BASIS_VALUE,
    FLEX_DIRECTION_VALUE,
    FLEX_WRAP_VALUE,
    JUSTIFY_CONTENT_VALUE,
    MARGIN_VALUE,
    MIN_MAX_SIZE_VALUE,
    NUMBER_UNSET_VALUE,
    OFFSET_VALUE,
    OVERFLOW_VALUE,
    POSITION_VALUE,
    PX_PERCENT_VALUE,
    SIZE_VALUE,
    INTEGER_VALUE,
} from './values.ts'

export function resolveStyle(name: string, value: any) {
    // Validating name
    if (typeof name !== 'string') {
        throw new Error(`style name must be a string, got '${typeof name}'`)
    }

    name = normalizeStyleName(name, STYLE)
    const style = STYLE[normalizeStyleKey(name)]

    if (!style) {
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
        throw new Error(`invalid value '${value}' for property '${style.name}'${suffix}`)
    }
}

export const STYLE = {
    ZINDEX: createStyle('zIndex', INTEGER_VALUE),
    OVERFLOW: createStyle('overflow', OVERFLOW_VALUE),
    BACKGROUNDCOLOR: createStyle('backgroundColor', COLOR_VALUE),
    BORDERTOPLEFTRADIUS: createStyle('borderTopLeftRadius', PX_PERCENT_VALUE),
    BORDERTOPRIGHTRADIUS: createStyle('borderTopRightRadius', PX_PERCENT_VALUE),
    BORDERBOTTOMLEFTRADIUS: createStyle('borderBottomLeftRadius', PX_PERCENT_VALUE),
    BORDERBOTTOMRIGHTRADIUS: createStyle('borderBottomRightRadius', PX_PERCENT_VALUE),

    // YOGA PROPERTIES
    POSITION: createStyle('position', POSITION_VALUE),
    TOP: createStyle('top', OFFSET_VALUE),
    LEFT: createStyle('left', OFFSET_VALUE),
    RIGHT: createStyle('right', OFFSET_VALUE),
    BOTTOM: createStyle('bottom', OFFSET_VALUE),
    ALIGNCONTENT: createStyle('alignContent', ALIGN_CONTENT_VALUE),
    ALIGNITEMS: createStyle('alignItems', ALIGN_ITEMS_VALUE),
    ALIGNSELF: createStyle('alignSelf', ALIGN_SELF_VALUE),
    FLEXDIRECTION: createStyle('flexDirection', FLEX_DIRECTION_VALUE),
    FLEXWRAP: createStyle('flexWrap', FLEX_WRAP_VALUE),
    JUSTIFYCONTENT: createStyle('justifyContent', JUSTIFY_CONTENT_VALUE),
    MARGIN: createStyle('margin', MARGIN_VALUE),
    MARGINTOP: createStyle('marginTop', MARGIN_VALUE),
    MARGINLEFT: createStyle('marginLeft', MARGIN_VALUE),
    MARGINRIGHT: createStyle('marginRight', MARGIN_VALUE),
    MARGINBOTTOM: createStyle('marginBottom', MARGIN_VALUE),
    FLEX: createStyle('flex', NUMBER_UNSET_VALUE),
    FLEXBASIS: createStyle('flexBasis', FLEX_BASIS_VALUE),
    FLEXGROW: createStyle('flexGrow', NUMBER_UNSET_VALUE),
    FLEXSHRINK: createStyle('flexShrink', NUMBER_UNSET_VALUE),
    WIDTH: createStyle('width', SIZE_VALUE),
    HEIGHT: createStyle('height', SIZE_VALUE),
    MINWIDTH: createStyle('minWidth', MIN_MAX_SIZE_VALUE),
    MINHEIGHT: createStyle('minHeight', MIN_MAX_SIZE_VALUE),
    MAXWIDTH: createStyle('maxWidth', MIN_MAX_SIZE_VALUE),
    MAXHEIGHT: createStyle('maxHeight', MIN_MAX_SIZE_VALUE),
    BOXSIZING: createStyle('boxSizing', BOX_SIZING_VALUE),
    ASPECTRATIO: createStyle('aspectRatio', NUMBER_UNSET_VALUE),
    BORDERWIDTH: createStyle('borderWidth', BORDER_WIDTH_VALUE),
    BORDERTOPWIDTH: createStyle('borderTopWidth', BORDER_WIDTH_VALUE),
    BORDERLEFTWIDTH: createStyle('borderLeftWidth', BORDER_WIDTH_VALUE),
    BORDERRIGHTWIDTH: createStyle('borderRightWidth', BORDER_WIDTH_VALUE),
    BORDERBOTTOMWIDTH: createStyle('borderBottomWidth', BORDER_WIDTH_VALUE),
    BORDERSTYLE: createStyle('borderStyle', BORDER_VALUE),
    BORDERTOPSTYLE: createStyle('borderTopStyle', BORDER_VALUE),
    BORDERLEFTSTYLE: createStyle('borderLeftStyle', BORDER_VALUE),
    BORDERRIGHTSTYLE: createStyle('borderRightStyle', BORDER_VALUE),
    BORDERBOTTOMSTYLE: createStyle('borderBottomStyle', BORDER_VALUE),
    BORDERCOLOR: createStyle('borderColor', COLOR_VALUE),
    BORDERTOPCOLOR: createStyle('borderTopColor', COLOR_VALUE),
    BORDERLEFTCOLOR: createStyle('borderLeftColor', COLOR_VALUE),
    BORDERRIGHTCOLOR: createStyle('borderRightColor', COLOR_VALUE),
    BORDERBOTTOMCOLOR: createStyle('borderBottomColor', COLOR_VALUE),
    DISPLAY: createStyle('display', DISPLAY_VALUE),
    DIRECTION: createStyle('direction', DIRECTION_VALUE),
    PADDING: createStyle('padding', PX_PERCENT_VALUE),
    PADDINGTOP: createStyle('paddingTop', PX_PERCENT_VALUE),
    PADDINGLEFT: createStyle('paddingLeft', PX_PERCENT_VALUE),
    PADDINGRIGHT: createStyle('paddingRight', PX_PERCENT_VALUE),
    PADDINGBOTTOM: createStyle('paddingBottom', PX_PERCENT_VALUE),
    GAP: createStyle('gap', PX_PERCENT_VALUE),
    ROWGAP: createStyle('rowGap', PX_PERCENT_VALUE),
    COLUMNGAP: createStyle('columnGap', PX_PERCENT_VALUE),
}

export default {
    resolveStyle,
    STYLE,
}
