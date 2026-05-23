import Node from '../Node.ts'

export default class NodeYoga extends Node {
    public yoga

    constructor({ id, yoga, styles, ui }) {
        super({ id, styles, ui })
        this.yoga = yoga
        this.applyStyles(styles)
    }

    protected getChildIndex() {
        return this.yoga.getChildCount()
    }

    protected appendChild(child, child_index) {
        this.yoga.insertChild(child.yoga, child_index)
    }

    protected removeChild(child) {
        this.yoga.removeChild(child.yoga)
    }

    protected setStyle(name, value) {
        const style = super.setStyle(name, value)
        // const style = Style.resolveStyle(key, value)
        // const result = setLayoutProperty(this.yoga, key, value)
        // console.log([key, value, result])
    }

    on(type, listener) {
        // no-op
    }

    off(type, listener) {
        // no-op
    }
}

// /Users/enzo/projects/uno/ui/node_modules/yoga-layout/src/wrapAssembly.ts
// const YOGA_SETTER = {
//     position: (node, input) => {
//         // const value = convertEnum(POSITION_TYPE, input, 1)
//         node.setPositionType(input)
//         // return value
//     },
//     top: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setPosition(EDGE.top, value)
//         return value
//     },
//     left: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setPosition(EDGE.left, value)
//         return value
//     },
//     right: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setPosition(EDGE.right, value)
//         return value
//     },
//     bottom: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setPosition(EDGE.bottom, value)
//         return value
//     },
//     alignContent: (node, input) => {
//         const value = convertEnum(ALIGN_LUT, input, 4)
//         node.setAlignContent(value)
//         return value
//     },
//     alignItems: (node, input) => {
//         const value = convertEnum(ALIGN_LUT, input, 4)
//         node.setAlignItems(value)
//         return value
//     },
//     alignSelf: (node, input) => {
//         const value = convertEnum(ALIGN_LUT, input, 0)
//         node.setAlignSelf(value)
//         return value
//     },
//     flexDirection: (node, input) => {
//         const value = convertEnum(FLEX_DIRECTION_LUT, input, 2)
//         node.setFlexDirection(value)
//         return value
//     },
//     flexWrap: (node, input) => {
//         const value = convertEnum(WRAP_LUT, input, 0)
//         node.setFlexWrap(value)
//         return value
//     },
//     justifyContent: (node, input) => {
//         const value = convertEnum(JUSTIFY_LUT, input, 0)
//         node.setJustifyContent(value)
//         return value
//     },
//     marginTop: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setMargin(EDGE.top, value)
//         return value
//     },
//     marginLeft: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setMargin(EDGE.left, value)
//         return value
//     },
//     marginRight: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setMargin(EDGE.right, value)
//         return value
//     },
//     marginBottom: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setMargin(EDGE.bottom, value)
//         return value
//     },
//     margin: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setMargin(EDGE.all, value)
//         return value
//     },
//     marginHorizontal: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setMargin(EDGE.horizontal, value)
//         return value
//     },
//     marginVertical: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setMargin(EDGE.vertical, value)
//         return value
//     },
//     flexBasis: (node, input) => {
//         const value = formatUnit(node, input, root, NaN)
//         node.setFlexBasis(value)
//         return value
//     },
//     flexBasisPercent: (node, input) => {
//         const value = convertPercent(input)
//         node.setFlexBasisPercent(value)
//         return value
//     },
//     flexBasisAuto: (node) => {
//         node.setFlexBasisAuto()
//     },
//     flex: (node, input) => {
//         node.setFlex(input)
//         return input
//     },
//     flexGrow: (node, input) => {
//         node.setFlexGrow(input)
//         return input
//     },
//     flexShrink: (node, input) => {
//         node.setFlexShrink(input)
//         return input
//     },
//     width: (node, input) => {
//         const value = formatUnit(node, input, root, NaN)
//         node.setWidth(value)
//         return value
//     },
//     widthAuto: (node) => {
//         node.setWidthAuto()
//     },
//     widthPercent: (node, input) => {
//         const value = convertPercent(input)
//         node.setWidthPercent(value)
//         return value
//     },
//     height: (node, input) => {
//         const value = formatUnit(node, input, root, NaN)
//         node.setHeight(value)
//         return value
//     },
//     heightAuto: (node) => {
//         node.setHeightAuto()
//     },
//     heightPercent: (node, input) => {
//         const value = convertPercent(input)
//         node.setHeightPercent(value)
//         return value
//     },
//     minWidth: (node, input) => {
//         const value = formatUnit(node, input, root)
//         node.setMinWidth(value)
//         return value
//     },
//     minWidthPercent: (node, input) => {
//         const value = convertPercent(input)
//         node.setMinWidthPercent(value)
//         return value
//     },
//     minHeight: (node, input) => {
//         const value = formatUnit(node, input, root)
//         node.setMinHeight(value)
//         return value
//     },
//     minHeightPercent: (node, input) => {
//         const value = convertPercent(input)
//         node.setMinHeightPercent(value)
//         return value
//     },
//     maxWidth: (node, input) => {
//         const value = formatUnit(node, input, root)
//         node.setMaxWidth(value)
//         return value
//     },
//     maxWidthPercent: (node, input) => {
//         const value = convertPercent(input)
//         node.setMaxWidthPercent(value)
//         return value
//     },
//     maxHeight: (node, input) => {
//         const value = formatUnit(node, input, root)
//         node.setMaxHeight(value)
//         return value
//     },
//     maxHeightPercent: (node, input) => {
//         const value = convertPercent(input)
//         node.setMaxHeightPercent(value)
//         return value
//     },
//     boxSizing: (node, input) => {
//         const value = convertEnum(BOX_SIZING_LUT, input, 0)
//         node.setBoxSizing(value)
//         return value
//     },
//     aspectRatio: (node, input) => {
//         node.setAspectRatio(input)
//         return input
//     },
//     isReferenceBaseline: (node, input) => {
//         node.setIsReferenceBaseline(Boolean(input))
//         return Boolean(input)
//     },
//     referenceBaseline: (node, input) => {
//         node.setIsReferenceBaseline(Boolean(input))
//         return Boolean(input)
//     },
//     borderTopWidth: (node, input) => {
//         const value = convertBorderWidth(input, root)
//         node.setBorder(EDGE.top, value)
//         return value
//     },
//     borderLeftWidth: (node, input) => {
//         const value = convertBorderWidth(input, root)
//         node.setBorder(EDGE.left, value)
//         return value
//     },
//     borderRightWidth: (node, input) => {
//         const value = convertBorderWidth(input, root)
//         node.setBorder(EDGE.right, value)
//         return value
//     },
//     borderBottomWidth: (node, input) => {
//         const value = convertBorderWidth(input, root)
//         node.setBorder(EDGE.bottom, value)
//         return value
//     },
//     borderWidth: (node, input) => {
//         const value = convertBorderWidth(input, root)
//         node.setBorder(EDGE.all, value)
//         return value
//     },
//     border: (node, input) => {
//         const value = convertBorderWidth(input, root)
//         node.setBorder(EDGE.all, value)
//         return value
//     },
//     overflow: (node, input) => {
//         const value = convertEnum(OVERFLOW_LUT, input, 0)
//         node.setOverflow(value)
//         return value
//     },
//     display: (node, input) => {
//         const value = convertEnum(DISPLAY_LUT, input, 0)
//         node.setDisplay(value)
//         return value
//     },
//     paddingTop: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setPadding(EDGE.top, value)
//         return value
//     },
//     paddingLeft: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setPadding(EDGE.left, value)
//         return value
//     },
//     paddingRight: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setPadding(EDGE.right, value)
//         return value
//     },
//     paddingBottom: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setPadding(EDGE.bottom, value)
//         return value
//     },
//     padding: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setPadding(EDGE.all, value)
//         return value
//     },
//     paddingHorizontal: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setPadding(EDGE.horizontal, value)
//         return value
//     },
//     paddingVertical: (node, input) => {
//         const value = formatEdgeUnit(node, input, root)
//         node.setPadding(EDGE.vertical, value)
//         return value
//     },
//     gapRow: (node, input) => {
//         const value = formatGap(node, input, root)
//         node.setGap(GUTTER.row, value)
//         return value
//     },
//     gapColumn: (node, input) => {
//         const value = formatGap(node, input, root)
//         node.setGap(GUTTER.column, value)
//         return value
//     },
//     rowGap: (node, input) => {
//         const value = formatGap(node, input, root)
//         node.setGap(GUTTER.row, value)
//         return value
//     },
//     columnGap: (node, input) => {
//         const value = formatGap(node, input, root)
//         node.setGap(GUTTER.column, value)
//         return value
//     },
//     gap: (node, input) => {
//         const value = formatGap(node, input, root)
//         node.setGap(GUTTER.all, value)
//         return value
//     },
//     gapPercent: (node, input) => {
//         const value = convertPercent(input)
//         node.setGapPercent(GUTTER.all, value)
//         return value
//     },
//     dirtiedFunc: (node, input) => {
//         if (input == null && node.unsetDirtiedFunc) {
//             node.unsetDirtiedFunc()
//             return
//         }
//         node.setDirtiedFunc(input)
//         return input
//     },
//     measureFunc: (node, input) => {
//         node.setMeasureFunc(input)
//         return input
//     },
//     direction: (node, input) => {
//         const value = convertEnum(DIRECTION_LUT, input, 0)
//         node.setDirection(value)
//         return value
//     },
// }
