/**
 * @param {string} name
 * @param {any} value
 */
export function validateStyle(name: string, value: any): any;
/**
 * @param {string} name
 * @param {any} value
 */
export function resolveStyle(name: string, value: any): {
    name: string;
    value: any;
    expanded: any;
};
export function isPaintStyle(name: any): boolean;
export function computeStyleValue(style: any, context: any): any;
export namespace STYLE {
    namespace ZINDEX {
        let name: "zIndex";
        let record_parts: number;
        let painter: boolean | undefined;
        let resolve: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
    }
    namespace OVERFLOW {
        let name_1: "overflow";
        export { name_1 as name };
        let record_parts_1: number;
        export { record_parts_1 as record_parts };
        let painter_1: boolean | undefined;
        export { painter_1 as painter };
        let resolve_1: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_1 as resolve };
    }
    namespace OVERFLOWX {
        let name_2: "overflowX";
        export { name_2 as name };
        let resolve_2: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_2 as resolve };
    }
    namespace OVERFLOWY {
        let name_3: "overflowY";
        export { name_3 as name };
        let resolve_3: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_3 as resolve };
    }
    namespace OPACITY {
        let name_4: "opacity";
        export { name_4 as name };
        let resolve_4: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_4 as resolve };
    }
    namespace BOXSHADOW {
        let name_5: "boxShadow";
        export { name_5 as name };
        let resolve_5: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_5 as resolve };
    }
    namespace TEXTSHADOW {
        let name_6: "textShadow";
        export { name_6 as name };
        let resolve_6: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_6 as resolve };
    }
    namespace TEXTSTROKE {
        let name_7: "textStroke";
        export { name_7 as name };
        let resolve_7: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_7 as resolve };
    }
    namespace BORDER {
        let name_8: "border";
        export { name_8 as name };
        let resolve_8: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_8 as resolve };
    }
    namespace BORDERRADIUS {
        let name_9: "borderRadius";
        export { name_9 as name };
        let resolve_9: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_9 as resolve };
    }
    namespace BORDERTOPLEFTRADIUS {
        let name_10: "borderTopLeftRadius";
        export { name_10 as name };
        let resolve_10: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_10 as resolve };
    }
    namespace BORDERTOPRIGHTRADIUS {
        let name_11: "borderTopRightRadius";
        export { name_11 as name };
        let resolve_11: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_11 as resolve };
    }
    namespace BORDERBOTTOMLEFTRADIUS {
        let name_12: "borderBottomLeftRadius";
        export { name_12 as name };
        let resolve_12: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_12 as resolve };
    }
    namespace BORDERBOTTOMRIGHTRADIUS {
        let name_13: "borderBottomRightRadius";
        export { name_13 as name };
        let resolve_13: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_13 as resolve };
    }
    namespace BORDERTOPSTYLE {
        let name_14: "borderTopStyle";
        export { name_14 as name };
        let resolve_14: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_14 as resolve };
    }
    namespace BORDERLEFTSTYLE {
        let name_15: "borderLeftStyle";
        export { name_15 as name };
        let resolve_15: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_15 as resolve };
    }
    namespace BORDERRIGHTSTYLE {
        let name_16: "borderRightStyle";
        export { name_16 as name };
        let resolve_16: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_16 as resolve };
    }
    namespace BORDERBOTTOMSTYLE {
        let name_17: "borderBottomStyle";
        export { name_17 as name };
        let resolve_17: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_17 as resolve };
    }
    namespace BORDERTOPCOLOR {
        let name_18: "borderTopColor";
        export { name_18 as name };
        let resolve_18: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_18 as resolve };
    }
    namespace BORDERLEFTCOLOR {
        let name_19: "borderLeftColor";
        export { name_19 as name };
        let resolve_19: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_19 as resolve };
    }
    namespace BORDERRIGHTCOLOR {
        let name_20: "borderRightColor";
        export { name_20 as name };
        let resolve_20: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_20 as resolve };
    }
    namespace BORDERBOTTOMCOLOR {
        let name_21: "borderBottomColor";
        export { name_21 as name };
        let resolve_21: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_21 as resolve };
    }
    namespace BACKGROUNDCOLOR {
        let name_22: "backgroundColor";
        export { name_22 as name };
        let resolve_22: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_22 as resolve };
    }
    namespace BACKGROUNDIMAGE {
        let name_23: "backgroundImage";
        export { name_23 as name };
        let resolve_23: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_23 as resolve };
    }
    namespace BACKGROUNDSIZE {
        let name_24: "backgroundSize";
        export { name_24 as name };
        let resolve_24: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_24 as resolve };
    }
    namespace BACKGROUNDSIZEWIDTH {
        let name_25: "backgroundSizeWidth";
        export { name_25 as name };
        let resolve_25: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_25 as resolve };
    }
    namespace BACKGROUNDSIZEHEIGHT {
        let name_26: "backgroundSizeHeight";
        export { name_26 as name };
        let resolve_26: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_26 as resolve };
    }
    namespace BACKGROUNDPOSITION {
        let name_27: "backgroundPosition";
        export { name_27 as name };
        let resolve_27: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_27 as resolve };
    }
    namespace BACKGROUNDPOSITIONX {
        let name_28: "backgroundPositionX";
        export { name_28 as name };
        let resolve_28: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_28 as resolve };
    }
    namespace BACKGROUNDPOSITIONY {
        let name_29: "backgroundPositionY";
        export { name_29 as name };
        let resolve_29: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_29 as resolve };
    }
    namespace BACKGROUNDREPEAT {
        let name_30: "backgroundRepeat";
        export { name_30 as name };
        let resolve_30: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_30 as resolve };
    }
    namespace COLOR {
        let name_31: "color";
        export { name_31 as name };
        let resolve_31: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_31 as resolve };
    }
    namespace FONTFAMILY {
        let name_32: "fontFamily";
        export { name_32 as name };
        let resolve_32: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_32 as resolve };
    }
    namespace FONTSIZE {
        let name_33: "fontSize";
        export { name_33 as name };
        let resolve_33: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_33 as resolve };
    }
    namespace LINEHEIGHT {
        let name_34: "lineHeight";
        export { name_34 as name };
        let resolve_34: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_34 as resolve };
    }
    namespace LETTERSPACING {
        let name_35: "letterSpacing";
        export { name_35 as name };
        let resolve_35: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_35 as resolve };
    }
    namespace TEXTALIGN {
        let name_36: "textAlign";
        export { name_36 as name };
        let resolve_36: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_36 as resolve };
    }
    namespace WHITESPACE {
        let name_37: "whiteSpace";
        export { name_37 as name };
        let resolve_37: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_37 as resolve };
    }
    namespace POSITION {
        let name_38: "position";
        export { name_38 as name };
        let resolve_38: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_38 as resolve };
    }
    namespace TOP {
        let name_39: "top";
        export { name_39 as name };
        let resolve_39: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_39 as resolve };
    }
    namespace LEFT {
        let name_40: "left";
        export { name_40 as name };
        let resolve_40: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_40 as resolve };
    }
    namespace RIGHT {
        let name_41: "right";
        export { name_41 as name };
        let resolve_41: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_41 as resolve };
    }
    namespace BOTTOM {
        let name_42: "bottom";
        export { name_42 as name };
        let resolve_42: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_42 as resolve };
    }
    namespace ALIGNCONTENT {
        let name_43: "alignContent";
        export { name_43 as name };
        let resolve_43: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_43 as resolve };
    }
    namespace ALIGNITEMS {
        let name_44: "alignItems";
        export { name_44 as name };
        let resolve_44: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_44 as resolve };
    }
    namespace ALIGNSELF {
        let name_45: "alignSelf";
        export { name_45 as name };
        let resolve_45: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_45 as resolve };
    }
    namespace FLEXDIRECTION {
        let name_46: "flexDirection";
        export { name_46 as name };
        let resolve_46: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_46 as resolve };
    }
    namespace FLEXWRAP {
        let name_47: "flexWrap";
        export { name_47 as name };
        let resolve_47: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_47 as resolve };
    }
    namespace JUSTIFYCONTENT {
        let name_48: "justifyContent";
        export { name_48 as name };
        let resolve_48: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_48 as resolve };
    }
    namespace MARGIN {
        let name_49: "margin";
        export { name_49 as name };
        let resolve_49: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_49 as resolve };
    }
    namespace MARGINTOP {
        let name_50: "marginTop";
        export { name_50 as name };
        let resolve_50: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_50 as resolve };
    }
    namespace MARGINLEFT {
        let name_51: "marginLeft";
        export { name_51 as name };
        let resolve_51: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_51 as resolve };
    }
    namespace MARGINRIGHT {
        let name_52: "marginRight";
        export { name_52 as name };
        let resolve_52: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_52 as resolve };
    }
    namespace MARGINBOTTOM {
        let name_53: "marginBottom";
        export { name_53 as name };
        let resolve_53: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_53 as resolve };
    }
    namespace FLEX {
        let name_54: "flex";
        export { name_54 as name };
        let resolve_54: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_54 as resolve };
    }
    namespace FLEXGROW {
        let name_55: "flexGrow";
        export { name_55 as name };
        let resolve_55: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_55 as resolve };
    }
    namespace FLEXSHRINK {
        let name_56: "flexShrink";
        export { name_56 as name };
        let resolve_56: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_56 as resolve };
    }
    namespace FLEXBASIS {
        let name_57: "flexBasis";
        export { name_57 as name };
        let resolve_57: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_57 as resolve };
    }
    namespace WIDTH {
        let name_58: "width";
        export { name_58 as name };
        let resolve_58: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_58 as resolve };
    }
    namespace HEIGHT {
        let name_59: "height";
        export { name_59 as name };
        let resolve_59: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_59 as resolve };
    }
    namespace MINWIDTH {
        let name_60: "minWidth";
        export { name_60 as name };
        let resolve_60: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_60 as resolve };
    }
    namespace MINHEIGHT {
        let name_61: "minHeight";
        export { name_61 as name };
        let resolve_61: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_61 as resolve };
    }
    namespace MAXWIDTH {
        let name_62: "maxWidth";
        export { name_62 as name };
        let resolve_62: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_62 as resolve };
    }
    namespace MAXHEIGHT {
        let name_63: "maxHeight";
        export { name_63 as name };
        let resolve_63: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_63 as resolve };
    }
    namespace BOXSIZING {
        let name_64: "boxSizing";
        export { name_64 as name };
        let resolve_64: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_64 as resolve };
    }
    namespace ASPECTRATIO {
        let name_65: "aspectRatio";
        export { name_65 as name };
        let resolve_65: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_65 as resolve };
    }
    namespace BORDERTOPWIDTH {
        let name_66: "borderTopWidth";
        export { name_66 as name };
        let resolve_66: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_66 as resolve };
    }
    namespace BORDERLEFTWIDTH {
        let name_67: "borderLeftWidth";
        export { name_67 as name };
        let resolve_67: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_67 as resolve };
    }
    namespace BORDERRIGHTWIDTH {
        let name_68: "borderRightWidth";
        export { name_68 as name };
        let resolve_68: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_68 as resolve };
    }
    namespace BORDERBOTTOMWIDTH {
        let name_69: "borderBottomWidth";
        export { name_69 as name };
        let resolve_69: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_69 as resolve };
    }
    namespace DISPLAY {
        let name_70: "display";
        export { name_70 as name };
        let resolve_70: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_70 as resolve };
    }
    namespace POINTEREVENTS {
        let name_71: "pointerEvents";
        export { name_71 as name };
        let resolve_71: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_71 as resolve };
    }
    namespace DIRECTION {
        let name_72: "direction";
        export { name_72 as name };
        let resolve_72: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_72 as resolve };
    }
    namespace PADDING {
        let name_73: "padding";
        export { name_73 as name };
        let resolve_73: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_73 as resolve };
    }
    namespace PADDINGTOP {
        let name_74: "paddingTop";
        export { name_74 as name };
        let resolve_74: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_74 as resolve };
    }
    namespace PADDINGLEFT {
        let name_75: "paddingLeft";
        export { name_75 as name };
        let resolve_75: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_75 as resolve };
    }
    namespace PADDINGRIGHT {
        let name_76: "paddingRight";
        export { name_76 as name };
        let resolve_76: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_76 as resolve };
    }
    namespace PADDINGBOTTOM {
        let name_77: "paddingBottom";
        export { name_77 as name };
        let resolve_77: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_77 as resolve };
    }
    namespace GAP {
        let name_78: "gap";
        export { name_78 as name };
        let resolve_78: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_78 as resolve };
    }
    namespace ROWGAP {
        let name_79: "rowGap";
        export { name_79 as name };
        let resolve_79: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_79 as resolve };
    }
    namespace COLUMNGAP {
        let name_80: "columnGap";
        export { name_80 as name };
        let resolve_80: (value: string) => {
            name: string;
            value: string;
            parsed: unknown;
        }[];
        export { resolve_80 as resolve };
    }
}
export const STYLE_BY_NAME: {
    [k: string]: StyleDefinition<"zIndex"> | StyleDefinition<"overflow"> | StyleDefinition<"overflowX"> | StyleDefinition<"overflowY"> | StyleDefinition<"opacity"> | StyleDefinition<"boxShadow"> | StyleDefinition<"textShadow"> | StyleDefinition<"textStroke"> | StyleDefinition<"border"> | StyleDefinition<"borderRadius"> | StyleDefinition<"borderTopLeftRadius"> | StyleDefinition<"borderTopRightRadius"> | StyleDefinition<"borderBottomLeftRadius"> | StyleDefinition<"borderBottomRightRadius"> | StyleDefinition<"borderTopStyle"> | StyleDefinition<"borderLeftStyle"> | StyleDefinition<"borderRightStyle"> | StyleDefinition<"borderBottomStyle"> | StyleDefinition<"borderTopColor"> | StyleDefinition<"borderLeftColor"> | StyleDefinition<"borderRightColor"> | StyleDefinition<"borderBottomColor"> | StyleDefinition<"backgroundColor"> | StyleDefinition<"backgroundImage"> | StyleDefinition<"backgroundSize"> | StyleDefinition<"backgroundSizeWidth"> | StyleDefinition<"backgroundSizeHeight"> | StyleDefinition<"backgroundPosition"> | StyleDefinition<"backgroundPositionX"> | StyleDefinition<"backgroundPositionY"> | StyleDefinition<"backgroundRepeat"> | StyleDefinition<"color"> | StyleDefinition<"fontFamily"> | StyleDefinition<"fontSize"> | StyleDefinition<"lineHeight"> | StyleDefinition<"letterSpacing"> | StyleDefinition<"textAlign"> | StyleDefinition<"whiteSpace"> | StyleDefinition<"position"> | StyleDefinition<"top"> | StyleDefinition<"left"> | StyleDefinition<"right"> | StyleDefinition<"bottom"> | StyleDefinition<"alignContent"> | StyleDefinition<"alignItems"> | StyleDefinition<"alignSelf"> | StyleDefinition<"flexDirection"> | StyleDefinition<"flexWrap"> | StyleDefinition<"justifyContent"> | StyleDefinition<"margin"> | StyleDefinition<"marginTop"> | StyleDefinition<"marginLeft"> | StyleDefinition<"marginRight"> | StyleDefinition<"marginBottom"> | StyleDefinition<"flex"> | StyleDefinition<"flexGrow"> | StyleDefinition<"flexShrink"> | StyleDefinition<"flexBasis"> | StyleDefinition<"width"> | StyleDefinition<"height"> | StyleDefinition<"minWidth"> | StyleDefinition<"minHeight"> | StyleDefinition<"maxWidth"> | StyleDefinition<"maxHeight"> | StyleDefinition<"boxSizing"> | StyleDefinition<"aspectRatio"> | StyleDefinition<"borderTopWidth"> | StyleDefinition<"borderLeftWidth"> | StyleDefinition<"borderRightWidth"> | StyleDefinition<"borderBottomWidth"> | StyleDefinition<"display"> | StyleDefinition<"pointerEvents"> | StyleDefinition<"direction"> | StyleDefinition<"padding"> | StyleDefinition<"paddingTop"> | StyleDefinition<"paddingLeft"> | StyleDefinition<"paddingRight"> | StyleDefinition<"paddingBottom"> | StyleDefinition<"gap"> | StyleDefinition<"rowGap"> | StyleDefinition<"columnGap">;
};
declare namespace _default {
    export { validateStyle };
    export { resolveStyle };
    export { computeStyleValue };
    export { STYLE };
}
export default _default;
export type StyleDefinition<TName extends string> = {
    name: TName;
    record_parts: number;
    painter?: boolean | undefined;
    resolve: (value: string) => Array<{
        name: string;
        value: string;
        parsed: unknown;
    }>;
};
