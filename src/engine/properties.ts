export function isProperty(key) {
    return isStyleProperty(key) || isLayoutProperty(key)
}

// CSS
export function setStyleProperty(node, key, value) {
    CSS_SETTER[key](node, value)
}
export function isStyleProperty(key) {
    return CSS_SETTER.hasOwnProperty(key)
}
const CSS_SETTER = {
    zIndex: (node, input) => {
        node.props.zIndex = input
    },
}

// Yoga
export function setLayoutProperty(node, key, value) {
    YOGA_SETTER[key](node, value)
}
export function isLayoutProperty(key) {
    return YOGA_SETTER.hasOwnProperty(key)
}
const YOGA_SETTER = {
    positionType: (node, input) => {
        node.setPositionType(convertEnum(POSITION_TYPE_LUT, input, 1))
    },
    position: (node, input) => {
        node.setPositionType(convertEnum(POSITION_TYPE_LUT, input, 1))
    },
    positionTop: (node, input) => {
        node.setPosition(EDGE.top, formatEdgeUnit(node, input, root))
    },
    positionLeft: (node, input) => {
        node.setPosition(EDGE.left, formatEdgeUnit(node, input, root))
    },
    positionRight: (node, input) => {
        node.setPosition(EDGE.right, formatEdgeUnit(node, input, root))
    },
    positionBottom: (node, input) => {
        node.setPosition(EDGE.bottom, formatEdgeUnit(node, input, root))
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
        node.setMargin(EDGE.top, formatEdgeUnit(node, input, root))
    },
    marginLeft: (node, input) => {
        node.setMargin(EDGE.left, formatEdgeUnit(node, input, root))
    },
    marginRight: (node, input) => {
        node.setMargin(EDGE.right, formatEdgeUnit(node, input, root))
    },
    marginBottom: (node, input) => {
        node.setMargin(EDGE.bottom, formatEdgeUnit(node, input, root))
    },
    margin: (node, input) => {
        node.setMargin(EDGE.all, formatEdgeUnit(node, input, root))
    },
    marginHorizontal: (node, input) => {
        node.setMargin(EDGE.horizontal, formatEdgeUnit(node, input, root))
    },
    marginVertical: (node, input) => {
        node.setMargin(EDGE.vertical, formatEdgeUnit(node, input, root))
    },
    flexBasis: (node, input) => {
        node.setFlexBasis(formatUnit(node, input, root, NaN))
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
        node.setWidth(formatUnit(node, input, root, NaN))
    },
    widthAuto: (node) => {
        node.setWidthAuto()
    },
    widthPercent: (node, input) => {
        node.setWidthPercent(convertPercent(input))
    },
    height: (node, input) => {
        node.setHeight(formatUnit(node, input, root, NaN))
    },
    heightAuto: (node) => {
        node.setHeightAuto()
    },
    heightPercent: (node, input) => {
        node.setHeightPercent(convertPercent(input))
    },
    minWidth: (node, input) => {
        node.setMinWidth(formatUnit(node, input, root))
    },
    minWidthPercent: (node, input) => {
        node.setMinWidthPercent(convertPercent(input))
    },
    minHeight: (node, input) => {
        node.setMinHeight(formatUnit(node, input, root))
    },
    minHeightPercent: (node, input) => {
        node.setMinHeightPercent(convertPercent(input))
    },
    maxWidth: (node, input) => {
        node.setMaxWidth(formatUnit(node, input, root))
    },
    maxWidthPercent: (node, input) => {
        node.setMaxWidthPercent(convertPercent(input))
    },
    maxHeight: (node, input) => {
        node.setMaxHeight(formatUnit(node, input, root))
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
        node.setPadding(EDGE.top, formatEdgeUnit(node, input, root))
    },
    paddingLeft: (node, input) => {
        node.setPadding(EDGE.left, formatEdgeUnit(node, input, root))
    },
    paddingRight: (node, input) => {
        node.setPadding(EDGE.right, formatEdgeUnit(node, input, root))
    },
    paddingBottom: (node, input) => {
        node.setPadding(EDGE.bottom, formatEdgeUnit(node, input, root))
    },
    padding: (node, input) => {
        node.setPadding(EDGE.all, formatEdgeUnit(node, input, root))
    },
    paddingHorizontal: (node, input) => {
        node.setPadding(EDGE.horizontal, formatEdgeUnit(node, input, root))
    },
    paddingVertical: (node, input) => {
        node.setPadding(EDGE.vertical, formatEdgeUnit(node, input, root))
    },
    gapRow: (node, input) => {
        node.setGap(GUTTER.row, formatGap(node, input, root))
    },
    gapColumn: (node, input) => {
        node.setGap(GUTTER.column, formatGap(node, input, root))
    },
    rowGap: (node, input) => {
        node.setGap(GUTTER.row, formatGap(node, input, root))
    },
    columnGap: (node, input) => {
        node.setGap(GUTTER.column, formatGap(node, input, root))
    },
    gap: (node, input) => {
        node.setGap(GUTTER.all, formatGap(node, input, root))
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

function formatUnit(node, input, root, defaultValue) {
    const value = convertPoint(input, root)
    return value ?? defaultValue
}

function formatEdgeUnit(node, input, root) {
    return convertPoint(input, root)
}

function formatGap(node, input, root) {
    return convertPoint(input, root)
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
