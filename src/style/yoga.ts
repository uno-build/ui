import { UNIT, EDGE, GUTTER } from './consts.ts'

// /Users/enzo/projects/uno/ui/node_modules/yoga-layout/src/wrapAssembly.ts
// https://github.com/Josema/uno-ui/blob/3a403f9b0bebd10dd63a4a272fc75ca772216bfe/src/engine/properties.ts
export const YOGA_SETTER = {
    borderRadius: (node, { value }) => {
        console.warn('borderRadius is not supported in Yoga, ignoring')
    },
    backgroundColor: (node, { value }) => {
        console.warn('backgroundColor is not supported in Yoga, ignoring')
    },
    borderStyle: (node, { value }) => {
        console.warn('borderStyle is not supported in Yoga, ignoring')
    },
    borderColor: (node, { value }) => {
        console.warn('borderColor is not supported in Yoga, ignoring')
    },

    width: (node, { value, parsed }) => {
        if (parsed.unit === UNIT.AUTO) {
            node.setWidthAuto()
        } else if (parsed.unit === UNIT.PERCENT) {
            node.setWidthPercent(parsed.value)
        } else if (parsed.unit === UNIT.PX) {
            node.setWidth(parsed.value)
        }
    },
    height: (node, { value, parsed }) => {
        if (parsed.unit === UNIT.AUTO) {
            node.setHeightAuto()
        } else if (parsed.unit === UNIT.PERCENT) {
            node.setHeightPercent(value)
        } else if (parsed.unit === UNIT.PX) {
            node.setHeight(value)
        }
    },
    // minWidth: (node, { value }) => {
    //     const value = formatUnit(node, input, root)
    //     node.setMinWidth(value)
    // },
    // minWidthPercent: (node, { value }) => {
    //     const value = convertPercent(input)
    //     node.setMinWidthPercent(value)
    // },
    // minHeight: (node, { value }) => {
    //     const value = formatUnit(node, input, root)
    //     node.setMinHeight(value)
    // },
    // minHeightPercent: (node, { value }) => {
    //     const value = convertPercent(input)
    //     node.setMinHeightPercent(value)
    // },
    // maxWidth: (node, { value }) => {
    //     const value = formatUnit(node, input, root)
    //     node.setMaxWidth(value)
    // },
    // maxWidthPercent: (node, { value }) => {
    //     const value = convertPercent(input)
    //     node.setMaxWidthPercent(value)
    // },
    // maxHeight: (node, { value }) => {
    //     const value = formatUnit(node, input, root)
    //     node.setMaxHeight(value)
    // },
    // maxHeightPercent: (node, { value }) => {
    //     const value = convertPercent(input)
    //     node.setMaxHeightPercent(value)
    // },
    position: (node, { parsed }) => {
        node.setPositionType(parsed.enum)
    },
    top: (node, { value }) => {
        node.setPosition(EDGE.top, value)
    },
    left: (node, { value }) => {
        node.setPosition(EDGE.left, value)
    },
    right: (node, { value }) => {
        node.setPosition(EDGE.right, value)
    },
    bottom: (node, { value }) => {
        node.setPosition(EDGE.bottom, value)
    },
    // alignContent: (node, { value }) => {
    //     const value = convertEnum(ALIGN_LUT, input, 4)
    //     node.setAlignContent(value)
    // },
    alignItems: (node, { parsed }) => {
        node.setAlignItems(parsed.enum)
    },
    // alignSelf: (node, { value }) => {
    //     const value = convertEnum(ALIGN_LUT, input, 0)
    //     node.setAlignSelf(value)
    // },
    flexDirection: (node, { parsed }) => {
        node.setFlexDirection(parsed.enum)
    },
    // flexWrap: (node, { value }) => {
    //     const value = convertEnum(WRAP_LUT, input, 0)
    //     node.setFlexWrap(value)
    // },
    justifyContent: (node, { parsed }) => {
        node.setJustifyContent(parsed.enum)
    },
    marginTop: (node, { value }) => {
        node.setMargin(EDGE.top, value)
    },
    marginLeft: (node, { value }) => {
        node.setMargin(EDGE.left, value)
    },
    marginRight: (node, { value }) => {
        node.setMargin(EDGE.right, value)
    },
    // marginBottom: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setMargin(EDGE.bottom, value)
    // },
    // margin: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setMargin(EDGE.all, value)
    // },
    // marginHorizontal: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setMargin(EDGE.horizontal, value)
    // },
    // marginVertical: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setMargin(EDGE.vertical, value)
    // },
    // flexBasis: (node, { value }) => {
    //     const value = formatUnit(node, input, root, NaN)
    //     node.setFlexBasis(value)
    // },
    // flexBasisPercent: (node, { value }) => {
    //     const value = convertPercent(input)
    //     node.setFlexBasisPercent(value)
    // },
    flexBasisAuto: (node) => {
        node.setFlexBasisAuto()
    },
    flex: (node, { value }) => {
        node.setFlex(value)
    },
    flexGrow: (node, { value }) => {
        node.setFlexGrow(value)
    },
    flexShrink: (node, { value }) => {
        node.setFlexShrink(value)
    },
    // boxSizing: (node, { value }) => {
    //     const value = convertEnum(BOX_SIZING_LUT, input, 0)
    //     node.setBoxSizing(value)
    // },
    borderWidth: (node, { value }) => {
        node.setBorder(EDGE.all, value)
    },
    // borderTopWidth: (node, { value }) => {
    //     const value = convertBorderWidth(input, root)
    //     node.setBorder(EDGE.top, value)
    // },
    // borderLeftWidth: (node, { value }) => {
    //     const value = convertBorderWidth(input, root)
    //     node.setBorder(EDGE.left, value)
    // },
    // borderRightWidth: (node, { value }) => {
    //     const value = convertBorderWidth(input, root)
    //     node.setBorder(EDGE.right, value)
    // },
    // borderBottomWidth: (node, { value }) => {
    //     const value = convertBorderWidth(input, root)
    //     node.setBorder(EDGE.bottom, value)
    // },
    // borderWidth: (node, { value }) => {
    //     const value = convertBorderWidth(input, root)
    //     node.setBorder(EDGE.all, value)
    // },
    // overflow: (node, { value }) => {
    //     const value = convertEnum(OVERFLOW_LUT, input, 0)
    //     node.setOverflow(value)
    // },
    // display: (node, { value }) => {
    //     const value = convertEnum(DISPLAY_LUT, input, 0)
    //     node.setDisplay(value)
    // },
    padding: (node, { value, parsed }) => {
        node.setPadding(EDGE.all, value)
    },
    // paddingTop: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setPadding(EDGE.top, value)
    // },
    // paddingLeft: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setPadding(EDGE.left, value)
    // },
    // paddingRight: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setPadding(EDGE.right, value)
    // },
    // paddingBottom: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setPadding(EDGE.bottom, value)
    // },
    // paddingHorizontal: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setPadding(EDGE.horizontal, value)
    // },
    // paddingVertical: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setPadding(EDGE.vertical, value)
    // },
    // gapRow: (node, { value }) => {
    //     const value = formatGap(node, input, root)
    //     node.setGap(GUTTER.row, value)
    // },
    // gapColumn: (node, { value }) => {
    //     const value = formatGap(node, input, root)
    //     node.setGap(GUTTER.column, value)
    // },
    // rowGap: (node, { value }) => {
    //     const value = formatGap(node, input, root)
    //     node.setGap(GUTTER.row, value)
    // },
    // columnGap: (node, { value }) => {
    //     const value = formatGap(node, input, root)
    //     node.setGap(GUTTER.column, value)
    // },
    gap: (node, { parsed }) => {
        if (parsed.unit === UNIT.PERCENT) {
            node.setGapPercent(GUTTER.all, parsed.value)
        } else if (parsed.unit === UNIT.PX) {
            node.setGap(GUTTER.all, parsed.value)
        }
    },
    // direction: (node, { value }) => {
    //     const value = convertEnum(DIRECTION_LUT, input, 0)
    //     node.setDirection(value)
    // },
    // aspectRatio: (node, { value }) => {
    //     node.setAspectRatio(input)
    //     return input
    // },
    // isReferenceBaseline: (node, { value }) => {
    //     node.setIsReferenceBaseline(Boolean(input))
    //     return Boolean(input)
    // },
    // referenceBaseline: (node, { value }) => {
    //     node.setIsReferenceBaseline(Boolean(input))
    //     return Boolean(input)
    // },
}
