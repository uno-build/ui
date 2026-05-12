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

export function setProperty(node, key, value, root = node) {
    if (setter.hasOwnProperty(key)) {
        setter[key](root, node, value)
    } else {
        console.warn(`unsupported property ${key}`)
    }
    return node
}

const setter = {
    positionType: (root, node, input) => {
        node.setPositionType(convertEnum(POSITION_TYPE_LUT, input, 1))
    },
    position: (root, node, input) => {
        node.setPositionType(convertEnum(POSITION_TYPE_LUT, input, 1))
    },
    positionTop: (root, node, input) => {
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
    positionLeft: (root, node, input) => {
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
    positionRight: (root, node, input) => {
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
    positionBottom: (root, node, input) => {
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
    alignContent: (root, node, input) => {
        node.setAlignContent(convertEnum(ALIGN_LUT, input, 4))
    },
    alignItems: (root, node, input) => {
        node.setAlignItems(convertEnum(ALIGN_LUT, input, 4))
    },
    alignSelf: (root, node, input) => {
        node.setAlignSelf(convertEnum(ALIGN_LUT, input, 0))
    },
    flexDirection: (root, node, input) => {
        node.setFlexDirection(convertEnum(FLEX_DIRECTION_LUT, input, 2))
    },
    flexWrap: (root, node, input) => {
        node.setFlexWrap(convertEnum(WRAP_LUT, input, 0))
    },
    justifyContent: (root, node, input) => {
        node.setJustifyContent(convertEnum(JUSTIFY_LUT, input, 0))
    },
    marginTop: (root, node, input) => {
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
    marginLeft: (root, node, input) => {
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
    marginRight: (root, node, input) => {
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
    marginBottom: (root, node, input) => {
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
    margin: (root, node, input) => {
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
    marginHorizontal: (root, node, input) => {
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
    marginVertical: (root, node, input) => {
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
    flexBasis: (root, node, input) => {
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
    flexBasisPercent: (root, node, input) => {
        node.setFlexBasisPercent(convertPercent(input))
    },
    flexBasisAuto: (root, node) => {
        node.setFlexBasisAuto()
    },
    flex: (root, node, input) => {
        node.setFlex(input)
    },
    flexGrow: (root, node, input) => {
        node.setFlexGrow(input)
    },
    flexShrink: (root, node, input) => {
        node.setFlexShrink(input)
    },
    width: (root, node, input) => {
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
    widthAuto: (root, node) => {
        node.setWidthAuto()
    },
    widthPercent: (root, node, input) => {
        node.setWidthPercent(convertPercent(input))
    },
    height: (root, node, input) => {
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
    heightAuto: (root, node) => {
        node.setHeightAuto()
    },
    heightPercent: (root, node, input) => {
        node.setHeightPercent(convertPercent(input))
    },
    minWidth: (root, node, input) => {
        setUnit(node, 'setMinWidth', 'setMinWidthPercent', null, input, root)
    },
    minWidthPercent: (root, node, input) => {
        node.setMinWidthPercent(convertPercent(input))
    },
    minHeight: (root, node, input) => {
        setUnit(node, 'setMinHeight', 'setMinHeightPercent', null, input, root)
    },
    minHeightPercent: (root, node, input) => {
        node.setMinHeightPercent(convertPercent(input))
    },
    maxWidth: (root, node, input) => {
        setUnit(node, 'setMaxWidth', 'setMaxWidthPercent', null, input, root)
    },
    maxWidthPercent: (root, node, input) => {
        node.setMaxWidthPercent(convertPercent(input))
    },
    maxHeight: (root, node, input) => {
        setUnit(node, 'setMaxHeight', 'setMaxHeightPercent', null, input, root)
    },
    maxHeightPercent: (root, node, input) => {
        node.setMaxHeightPercent(convertPercent(input))
    },
    boxSizing: (root, node, input) => {
        node.setBoxSizing(convertEnum(BOX_SIZING_LUT, input, 0))
    },
    aspectRatio: (root, node, input) => {
        node.setAspectRatio(input)
    },
    isReferenceBaseline: (root, node, input) => {
        node.setIsReferenceBaseline(Boolean(input))
    },
    referenceBaseline: (root, node, input) => {
        node.setIsReferenceBaseline(Boolean(input))
    },
    borderTopWidth: (root, node, input) => {
        node.setBorder(EDGE.top, input)
    },
    borderLeftWidth: (root, node, input) => {
        node.setBorder(EDGE.left, input)
    },
    borderRightWidth: (root, node, input) => {
        node.setBorder(EDGE.right, input)
    },
    borderBottomWidth: (root, node, input) => {
        node.setBorder(EDGE.bottom, input)
    },
    borderWidth: (root, node, input) => {
        node.setBorder(EDGE.all, input)
    },
    border: (root, node, input) => {
        node.setBorder(EDGE.all, input)
    },
    overflow: (root, node, input) => {
        node.setOverflow(convertEnum(OVERFLOW_LUT, input, 0))
    },
    display: (root, node, input) => {
        node.setDisplay(convertEnum(DISPLAY_LUT, input, 0))
    },
    paddingTop: (root, node, input) => {
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
    paddingLeft: (root, node, input) => {
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
    paddingRight: (root, node, input) => {
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
    paddingBottom: (root, node, input) => {
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
    padding: (root, node, input) => {
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
    paddingHorizontal: (root, node, input) => {
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
    paddingVertical: (root, node, input) => {
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
    gapRow: (root, node, input) => {
        setGap(node, GUTTER.row, input, root)
    },
    gapColumn: (root, node, input) => {
        setGap(node, GUTTER.column, input, root)
    },
    rowGap: (root, node, input) => {
        setGap(node, GUTTER.row, input, root)
    },
    columnGap: (root, node, input) => {
        setGap(node, GUTTER.column, input, root)
    },
    gap: (root, node, input) => {
        setGap(node, GUTTER.all, input, root)
    },
    gapPercent: (root, node, input) => {
        node.setGapPercent(GUTTER.all, convertPercent(input))
    },
    dirtiedFunc: (root, node, input) => {
        if (input == null && node.unsetDirtiedFunc) {
            node.unsetDirtiedFunc()
            return
        }
        node.setDirtiedFunc(input)
    },
    measureFunc: (root, node, input) => {
        node.setMeasureFunc(input)
    },
    direction: (root, node, input) => {
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

function convertPoint(input, root) {
    if (input == null || typeof input != 'string') {
        return input
    }
    if (input.endsWith('vw')) {
        return (
            ((root.component?.size.value?.[0] ?? 0) * parseFloat(input)) / 100
        )
    }
    if (input.endsWith('vh')) {
        return (
            ((root.component?.size.value?.[1] ?? 0) * parseFloat(input)) / 100
        )
    }
    return input
}
