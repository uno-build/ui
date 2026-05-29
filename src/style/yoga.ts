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

    flex: (node, { value, parsed }) => {
        if (parsed.unit === UNIT.UNSET) {
            node.setFlex(undefined)
        } else {
            node.setFlex(value)
        }
    },
    flexGrow: (node, { value, parsed }) => {
        if (parsed.unit === UNIT.UNSET) {
            node.setFlexGrow(undefined)
        } else {
            node.setFlexGrow(value)
        }
    },
    flexShrink: (node, { value, parsed }) => {
        if (parsed.unit === UNIT.UNSET) {
            node.setFlexShrink(undefined)
        } else {
            node.setFlexShrink(value)
        }
    },
    flexBasis: (node, { parsed }) => {
        if (parsed.unit === UNIT.PX) {
            node.setFlexBasis(parsed.value)
        } else if (parsed.unit === UNIT.PERCENT) {
            node.setFlexBasisPercent(parsed.value)
        } else if (parsed.unit === UNIT.AUTO) {
            node.setFlexBasisAuto()
        } else if (parsed.unit === UNIT.UNSET) {
            node.setFlexBasis(undefined)
        }
    },
    flexDirection: (node, { parsed }) => {
        node.setFlexDirection(parsed.enum)
    },
    flexWrap: (node, { parsed }) => {
        node.setFlexWrap(parsed.enum)
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
    justifyContent: (node, { parsed }) => {
        node.setJustifyContent(parsed.enum)
    },

    margin: (node, { parsed }) => {
        setMargin(node, EDGE.all, parsed)
    },
    marginTop: (node, { parsed }) => {
        setMargin(node, EDGE.top, parsed)
    },
    marginLeft: (node, { parsed }) => {
        setMargin(node, EDGE.left, parsed)
    },
    marginRight: (node, { parsed }) => {
        setMargin(node, EDGE.right, parsed)
    },
    marginBottom: (node, { parsed }) => {
        setMargin(node, EDGE.bottom, parsed)
    },
    // marginHorizontal: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setMargin(EDGE.horizontal, value)
    // },
    // marginVertical: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setMargin(EDGE.vertical, value)
    // },
    // boxSizing: (node, { value }) => {
    //     const value = convertEnum(BOX_SIZING_LUT, input, 0)
    //     node.setBoxSizing(value)
    // },
    borderWidth: (node, { parsed }) => {
        node.setBorder(EDGE.all, parsed.value)
    },
    borderTopWidth: (node, { parsed }) => {
        node.setBorder(EDGE.top, parsed.value)
    },
    borderLeftWidth: (node, { parsed }) => {
        node.setBorder(EDGE.left, parsed.value)
    },
    borderRightWidth: (node, { parsed }) => {
        node.setBorder(EDGE.right, parsed.value)
    },
    borderBottomWidth: (node, { parsed }) => {
        node.setBorder(EDGE.bottom, parsed.value)
    },
    // overflow: (node, { parsed }) => {
    //     node.setOverflow(parsed.enum)
    // },
    display: (node, { parsed }) => {
        node.setDisplay(parsed.enum)
    },
    padding: (node, { parsed }) => {
        setPadding(node, EDGE.all, parsed)
    },
    paddingTop: (node, { parsed }) => {
        setPadding(node, EDGE.top, parsed)
    },
    paddingLeft: (node, { parsed }) => {
        setPadding(node, EDGE.left, parsed)
    },
    paddingRight: (node, { parsed }) => {
        setPadding(node, EDGE.right, parsed)
    },
    paddingBottom: (node, { parsed }) => {
        setPadding(node, EDGE.bottom, parsed)
    },
    // paddingHorizontal: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setPadding(EDGE.horizontal, value)
    // },
    // paddingVertical: (node, { value }) => {
    //     const value = formatEdgeUnit(node, input, root)
    //     node.setPadding(EDGE.vertical, value)
    // },
    gap: (node, { parsed }) => {
        if (parsed.unit === UNIT.PX) {
            node.setGap(GUTTER.all, parsed.value)
        } else if (parsed.unit === UNIT.PERCENT) {
            node.setGapPercent(GUTTER.all, parsed.value)
        }
    },
    rowGap: (node, { parsed }) => {
        if (parsed.unit === UNIT.PX) {
            node.setGap(GUTTER.row, parsed.value)
        } else if (parsed.unit === UNIT.PERCENT) {
            node.setGapPercent(GUTTER.row, parsed.value)
        }
    },
    columnGap: (node, { parsed }) => {
        if (parsed.unit === UNIT.PX) {
            node.setGap(GUTTER.column, parsed.value)
        } else if (parsed.unit === UNIT.PERCENT) {
            node.setGapPercent(GUTTER.column, parsed.value)
        }
    },

    direction: (node, { parsed }) => {
        node.setDirection(parsed.enum)
    },
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

function setMargin(node, edge, parsed) {
    if (parsed.unit === UNIT.PX) {
        node.setMargin(edge, parsed.value)
    } else if (parsed.unit === UNIT.PERCENT) {
        node.setMarginPercent(edge, parsed.value)
    } else if (parsed.unit === UNIT.AUTO) {
        node.setMarginAuto(edge)
    }
}

function setPadding(node, edge, parsed) {
    if (parsed.unit === UNIT.PX) {
        node.setPadding(edge, parsed.value)
    } else if (parsed.unit === UNIT.PERCENT) {
        node.setPaddingPercent(edge, parsed.value)
    }
}
