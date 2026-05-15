// Credits to pmndrs/uikit for this code:
// https://github.com/pmndrs/uikit/blob/main/packages/uikit/scripts/flex-generate-setter.ts

const POSITION_TYPE_LUT = {
    static: 0,
    relative: 1,
    absolute: 2,
}
const ALIGN_LUT = {
    auto: 0,
    'flex-start': 1,
    center: 2,
    'flex-end': 3,
    stretch: 4,
    baseline: 5,
    'space-between': 6,
    'space-around': 7,
    'space-evenly': 8,
}
const FLEX_DIRECTION_LUT = {
    column: 0,
    'column-reverse': 1,
    row: 2,
    'row-reverse': 3,
}
const WRAP_LUT = {
    'no-wrap': 0,
    wrap: 1,
    'wrap-reverse': 2,
}
const JUSTIFY_LUT = {
    'flex-start': 0,
    center: 1,
    'flex-end': 2,
    'space-between': 3,
    'space-around': 4,
    'space-evenly': 5,
}
const OVERFLOW_LUT = {
    visible: 0,
    hidden: 1,
    scroll: 2,
}
const DISPLAY_LUT = {
    flex: 0,
    none: 1,
    contents: 2,
}
const DIRECTION_LUT = {
    inherit: 0,
    ltr: 1,
    rtl: 2,
}
const BOX_SIZING_LUT = {
    'border-box': 0,
    'content-box': 1,
}

const EDGE = {
    left: 0,
    top: 1,
    right: 2,
    bottom: 3,
    start: 4,
    end: 5,
    horizontal: 6,
    vertical: 7,
    all: 8,
}

const GUTTER = {
    column: 0,
    row: 1,
    all: 2,
}

export function setYogaProperty(node, key, value) {
    setter[key](node, value)
}

export function isYogaProperty(key) {
    return setter.hasOwnProperty(key)
}

const setter = {
    positionType: (node, input) => {
        node.setPositionType(convertEnum(POSITION_TYPE_LUT, input, 1))
    },
    position: (node, input) => {
        node.setPositionType(convertEnum(POSITION_TYPE_LUT, input, 1))
    },
    positionTop: (node, input) => {
        setEdgeUnit(
            node,
            'setPosition',
            'setPositionPercent',
            'setPositionAuto',
            EDGE.top,
            input,
            root,
        )
    },
    positionLeft: (node, input) => {
        setEdgeUnit(
            node,
            'setPosition',
            'setPositionPercent',
            'setPositionAuto',
            EDGE.left,
            input,
            root,
        )
    },
    positionRight: (node, input) => {
        setEdgeUnit(
            node,
            'setPosition',
            'setPositionPercent',
            'setPositionAuto',
            EDGE.right,
            input,
            root,
        )
    },
    positionBottom: (node, input) => {
        setEdgeUnit(
            node,
            'setPosition',
            'setPositionPercent',
            'setPositionAuto',
            EDGE.bottom,
            input,
            root,
        )
    },
    alignContent: (node, input) => {
        node.setAlignContent(convertEnum(ALIGN_LUT, input, 4))
    },
    alignItems: (node, input) => {
        node.setAlignItems(convertEnum(ALIGN_LUT, input, 4))
    },
    alignSelf: (node, input) => {
        node.setAlignSelf(convertEnum(ALIGN_LUT, input, 0))
    },
    flexDirection: (node, input) => {
        node.setFlexDirection(convertEnum(FLEX_DIRECTION_LUT, input, 2))
    },
    flexWrap: (node, input) => {
        node.setFlexWrap(convertEnum(WRAP_LUT, input, 0))
    },
    justifyContent: (node, input) => {
        node.setJustifyContent(convertEnum(JUSTIFY_LUT, input, 0))
    },
    marginTop: (node, input) => {
        setEdgeUnit(
            node,
            'setMargin',
            'setMarginPercent',
            'setMarginAuto',
            EDGE.top,
            input,
            root,
        )
    },
    marginLeft: (node, input) => {
        setEdgeUnit(
            node,
            'setMargin',
            'setMarginPercent',
            'setMarginAuto',
            EDGE.left,
            input,
            root,
        )
    },
    marginRight: (node, input) => {
        setEdgeUnit(
            node,
            'setMargin',
            'setMarginPercent',
            'setMarginAuto',
            EDGE.right,
            input,
            root,
        )
    },
    marginBottom: (node, input) => {
        setEdgeUnit(
            node,
            'setMargin',
            'setMarginPercent',
            'setMarginAuto',
            EDGE.bottom,
            input,
            root,
        )
    },
    margin: (node, input) => {
        setEdgeUnit(
            node,
            'setMargin',
            'setMarginPercent',
            'setMarginAuto',
            EDGE.all,
            input,
            root,
        )
    },
    marginHorizontal: (node, input) => {
        setEdgeUnit(
            node,
            'setMargin',
            'setMarginPercent',
            'setMarginAuto',
            EDGE.horizontal,
            input,
            root,
        )
    },
    marginVertical: (node, input) => {
        setEdgeUnit(
            node,
            'setMargin',
            'setMarginPercent',
            'setMarginAuto',
            EDGE.vertical,
            input,
            root,
        )
    },
    flexBasis: (node, input) => {
        setUnit(
            node,
            'setFlexBasis',
            'setFlexBasisPercent',
            'setFlexBasisAuto',
            input,
            root,
            NaN,
        )
    },
    flexBasisPercent: (node, input) => {
        node.setFlexBasisPercent(convertPercent(input))
    },
    flexBasisAuto: (node) => {
        node.setFlexBasisAuto()
    },
    flex: (node, input) => {
        node.setFlex(input)
    },
    flexGrow: (node, input) => {
        node.setFlexGrow(input)
    },
    flexShrink: (node, input) => {
        node.setFlexShrink(input)
    },
    width: (node, input) => {
        setUnit(
            node,
            'setWidth',
            'setWidthPercent',
            'setWidthAuto',
            input,
            root,
            NaN,
        )
    },
    widthAuto: (node) => {
        node.setWidthAuto()
    },
    widthPercent: (node, input) => {
        node.setWidthPercent(convertPercent(input))
    },
    height: (node, input) => {
        setUnit(
            node,
            'setHeight',
            'setHeightPercent',
            'setHeightAuto',
            input,
            root,
            NaN,
        )
    },
    heightAuto: (node) => {
        node.setHeightAuto()
    },
    heightPercent: (node, input) => {
        node.setHeightPercent(convertPercent(input))
    },
    minWidth: (node, input) => {
        setUnit(node, 'setMinWidth', 'setMinWidthPercent', null, input, root)
    },
    minWidthPercent: (node, input) => {
        node.setMinWidthPercent(convertPercent(input))
    },
    minHeight: (node, input) => {
        setUnit(node, 'setMinHeight', 'setMinHeightPercent', null, input, root)
    },
    minHeightPercent: (node, input) => {
        node.setMinHeightPercent(convertPercent(input))
    },
    maxWidth: (node, input) => {
        setUnit(node, 'setMaxWidth', 'setMaxWidthPercent', null, input, root)
    },
    maxWidthPercent: (node, input) => {
        node.setMaxWidthPercent(convertPercent(input))
    },
    maxHeight: (node, input) => {
        setUnit(node, 'setMaxHeight', 'setMaxHeightPercent', null, input, root)
    },
    maxHeightPercent: (node, input) => {
        node.setMaxHeightPercent(convertPercent(input))
    },
    boxSizing: (node, input) => {
        node.setBoxSizing(convertEnum(BOX_SIZING_LUT, input, 0))
    },
    aspectRatio: (node, input) => {
        node.setAspectRatio(input)
    },
    isReferenceBaseline: (node, input) => {
        node.setIsReferenceBaseline(Boolean(input))
    },
    referenceBaseline: (node, input) => {
        node.setIsReferenceBaseline(Boolean(input))
    },
    borderTopWidth: (node, input) => {
        node.setBorder(EDGE.top, convertBorderWidth(input, root))
    },
    borderLeftWidth: (node, input) => {
        node.setBorder(EDGE.left, convertBorderWidth(input, root))
    },
    borderRightWidth: (node, input) => {
        node.setBorder(EDGE.right, convertBorderWidth(input, root))
    },
    borderBottomWidth: (node, input) => {
        node.setBorder(EDGE.bottom, convertBorderWidth(input, root))
    },
    borderWidth: (node, input) => {
        node.setBorder(EDGE.all, convertBorderWidth(input, root))
    },
    border: (node, input) => {
        node.setBorder(EDGE.all, convertBorderWidth(input, root))
    },
    overflow: (node, input) => {
        node.setOverflow(convertEnum(OVERFLOW_LUT, input, 0))
    },
    display: (node, input) => {
        node.setDisplay(convertEnum(DISPLAY_LUT, input, 0))
    },
    paddingTop: (node, input) => {
        setEdgeUnit(
            node,
            'setPadding',
            'setPaddingPercent',
            null,
            EDGE.top,
            input,
            root,
        )
    },
    paddingLeft: (node, input) => {
        setEdgeUnit(
            node,
            'setPadding',
            'setPaddingPercent',
            null,
            EDGE.left,
            input,
            root,
        )
    },
    paddingRight: (node, input) => {
        setEdgeUnit(
            node,
            'setPadding',
            'setPaddingPercent',
            null,
            EDGE.right,
            input,
            root,
        )
    },
    paddingBottom: (node, input) => {
        setEdgeUnit(
            node,
            'setPadding',
            'setPaddingPercent',
            null,
            EDGE.bottom,
            input,
            root,
        )
    },
    padding: (node, input) => {
        setEdgeUnit(
            node,
            'setPadding',
            'setPaddingPercent',
            null,
            EDGE.all,
            input,
            root,
        )
    },
    paddingHorizontal: (node, input) => {
        setEdgeUnit(
            node,
            'setPadding',
            'setPaddingPercent',
            null,
            EDGE.horizontal,
            input,
            root,
        )
    },
    paddingVertical: (node, input) => {
        setEdgeUnit(
            node,
            'setPadding',
            'setPaddingPercent',
            null,
            EDGE.vertical,
            input,
            root,
        )
    },
    gapRow: (node, input) => {
        setGap(node, GUTTER.row, input, root)
    },
    gapColumn: (node, input) => {
        setGap(node, GUTTER.column, input, root)
    },
    rowGap: (node, input) => {
        setGap(node, GUTTER.row, input, root)
    },
    columnGap: (node, input) => {
        setGap(node, GUTTER.column, input, root)
    },
    gap: (node, input) => {
        setGap(node, GUTTER.all, input, root)
    },
    gapPercent: (node, input) => {
        node.setGapPercent(GUTTER.all, convertPercent(input))
    },
    dirtiedFunc: (node, input) => {
        if (input == null && node.unsetDirtiedFunc) {
            node.unsetDirtiedFunc()
            return
        }
        node.setDirtiedFunc(input)
    },
    measureFunc: (node, input) => {
        node.setMeasureFunc(input)
    },
    direction: (node, input) => {
        node.setDirection(convertEnum(DIRECTION_LUT, input, 0))
    },
}

function convertEnum(lut, input, defaultValue) {
    if (input == null) {
        return defaultValue
    }
    if (typeof input === 'number') {
        return input
    }
    const resolvedValue = lut[input]
    if (resolvedValue == null) {
        throw new Error(
            `unexpected value ${input}, expected ${Object.keys(lut).join(', ')}`,
        )
    }
    return resolvedValue
}

function setUnit(
    node,
    pointMethod,
    percentMethod,
    autoMethod,
    input,
    root,
    defaultValue,
) {
    if (input === 'auto' && autoMethod != null) {
        node[autoMethod]()
        return
    }

    const value = convertPoint(input, root)
    if (isPercent(value) && percentMethod != null) {
        node[percentMethod](convertPercent(value))
        return
    }

    node[pointMethod](value ?? defaultValue)
}

function setEdgeUnit(
    node,
    pointMethod,
    percentMethod,
    autoMethod,
    edge,
    input,
    root,
) {
    if (input === 'auto' && autoMethod != null) {
        node[autoMethod](edge)
        return
    }

    const value = convertPoint(input, root)
    if (isPercent(value) && percentMethod != null) {
        node[percentMethod](edge, convertPercent(value))
        return
    }

    node[pointMethod](edge, value)
}

function setGap(node, gutter, input, root) {
    const value = convertPoint(input, root)
    if (isPercent(value)) {
        return node.setGapPercent(gutter, convertPercent(value))
    }
    return node.setGap(gutter, value)
}

function isPercent(input) {
    return typeof input === 'string' && input.endsWith('%')
}

function convertPercent(input) {
    if (input == null || typeof input !== 'string') {
        return input
    }
    return parseFloat(input)
}

function convertBorderWidth(input, root) {
    const value = convertPoint(input, root)
    if (value == null || typeof value !== 'string') {
        return value
    }
    return parseFloat(value)
}

function convertPoint(input, root) {
    if (input == null || typeof input != 'string') {
        return input
    }
    // if (input.endsWith('vw')) {
    //     return (
    //         ((root.component?.size.value?.[0] ?? 0) * parseFloat(input)) / 100
    //     )
    // }
    // if (input.endsWith('vh')) {
    //     return (
    //         ((root.component?.size.value?.[1] ?? 0) * parseFloat(input)) / 100
    //     )
    // }
    return input
}
