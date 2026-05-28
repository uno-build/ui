import { UNIT, EDGE, GUTTER } from './consts.ts'

// /Users/enzo/projects/uno/ui/node_modules/yoga-layout/src/wrapAssembly.ts
export const YOGA_SETTER = {
    width: (node, { value, parsed }) => {
        if (parsed.unit === UNIT.PX) {
            node.setWidth(parsed.value)
        } else if (parsed.unit === UNIT.PERCENT) {
            node.setWidthPercent(parsed.value)
        } else if (parsed.unit === UNIT.AUTO) {
            node.setWidthAuto()
        }
    },
    height: (node, { value, parsed }) => {
        if (parsed.unit === UNIT.PX) {
            node.setHeight(value)
        } else if (parsed.unit === UNIT.PERCENT) {
            node.setHeightPercent(parsed.value)
        } else if (parsed.unit === UNIT.AUTO) {
            node.setHeightAuto()
        }
    },
    minWidth: (node, { parsed }) => {
        if (parsed.unit === UNIT.PX) {
            node.setMinWidth(parsed.value)
        } else if (parsed.unit === UNIT.PERCENT) {
            node.setMinWidthPercent(parsed.value)
        } else if (parsed.unit === UNIT.UNSET) {
            node.setMinWidth(undefined)
        }
    },
    minHeight: (node, { parsed }) => {
        if (parsed.unit === UNIT.PX) {
            node.setMinHeight(parsed.value)
        } else if (parsed.unit === UNIT.PERCENT) {
            node.setMinHeightPercent(parsed.value)
        } else if (parsed.unit === UNIT.UNSET) {
            node.setMinHeight(undefined)
        }
    },
    maxWidth: (node, { parsed }) => {
        if (parsed.unit === UNIT.PX) {
            node.setMaxWidth(parsed.value)
        } else if (parsed.unit === UNIT.PERCENT) {
            node.setMaxWidthPercent(parsed.value)
        } else if (parsed.unit === UNIT.UNSET) {
            node.setMaxWidth(undefined)
        }
    },
    maxHeight: (node, { parsed }) => {
        if (parsed.unit === UNIT.PX) {
            node.setMaxHeight(parsed.value)
        } else if (parsed.unit === UNIT.PERCENT) {
            node.setMaxHeightPercent(parsed.value)
        } else if (parsed.unit === UNIT.UNSET) {
            node.setMaxHeight(undefined)
        }
    },
    position: (node, { parsed }) => {
        node.setPositionType(parsed.enum)
    },
    top: (node, { parsed }) => {
        setPosition(node, EDGE.top, parsed)
    },
    left: (node, { parsed }) => {
        setPosition(node, EDGE.left, parsed)
    },
    right: (node, { parsed }) => {
        setPosition(node, EDGE.right, parsed)
    },
    bottom: (node, { parsed }) => {
        setPosition(node, EDGE.bottom, parsed)
    },
    alignContent: (node, { parsed }) => {
        node.setAlignContent(parsed.enum)
    },
    alignItems: (node, { parsed }) => {
        node.setAlignItems(parsed.enum)
    },
    alignSelf: (node, { parsed }) => {
        node.setAlignSelf(parsed.enum)
    },
    flexDirection: (node, { parsed }) => {
        node.setFlexDirection(parsed.enum)
    },
    flexWrap: (node, { parsed }) => {
        node.setFlexWrap(parsed.enum)
    },
    justifyContent: (node, { parsed }) => {
        node.setJustifyContent(parsed.enum)
    },
    margin: (node, { value }) => {
        node.setMargin(EDGE.all, value)
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
    marginBottom: (node, { value }) => {
        node.setMargin(EDGE.bottom, value)
    },
    // marginHorizontal: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setMargin(EDGE.horizontal, value)
    // },
    // marginVertical: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setMargin(EDGE.vertical, value)
    // },
    flex: (node, { value }) => {
        node.setFlex(value)
    },
    flexGrow: (node, { value }) => {
        node.setFlexGrow(value)
    },
    flexShrink: (node, { value }) => {
        node.setFlexShrink(value)
    },
    // flexBasis: (node, { value }) => {
    //     const value = formatUnit(node, input, root, NaN)
    //     node.setFlexBasis(value)
    // },
    // flexBasisPercent: (node, { value }) => {
    //     const value = convertPercent(input)
    //     node.setFlexBasisPercent(value)
    // },
    // flexBasisAuto: (node) => {
    //     node.setFlexBasisAuto()
    // },
    // boxSizing: (node, { value }) => {
    //     const value = convertEnum(BOX_SIZING_LUT, input, 0)
    //     node.setBoxSizing(value)
    // },
    borderWidth: (node, { parsed }) => {
        node.setBorder(EDGE.all, parsed.value)
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
    gap: (node, { parsed }) => {
        if (parsed.unit === UNIT.PERCENT) {
            node.setGapPercent(GUTTER.all, parsed.value)
        } else if (parsed.unit === UNIT.PX) {
            node.setGap(GUTTER.all, parsed.value)
        }
    },
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

function setPosition(node, edge, parsed) {
    if (parsed.unit === UNIT.PX) {
        node.setPosition(edge, parsed.value)
    } else if (parsed.unit === UNIT.PERCENT) {
        node.setPositionPercent(edge, parsed.value)
    } else if (parsed.unit === UNIT.AUTO) {
        node.setPositionAuto(edge)
    } else if (parsed.unit === UNIT.UNSET) {
        node.setPosition(edge, undefined)
    }
}
