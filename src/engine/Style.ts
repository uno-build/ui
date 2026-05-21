export default {
    validateStyle,
    parseStyleName,
    parseStyleValue,
}

if (typeof window !== 'undefined') {
    console.log('style module loaded')
    window.validateStyle = validateStyle
}

export function validateStyle(name: string, value: any) {
    // Validating name
    if (typeof name !== 'string') {
        throw new Error(`style name must be a string, got '${typeof name}'`)
    }
    name = parseStyleName(name)
    if (STYLE.hasOwnProperty(name) === false) {
        throw new Error(`unsupported property '${name}'`)
    }

    // Validating value
    if (typeof value === 'undefined') {
        throw new Error(
            `style value for property '${name}' cannot be undefined`,
        )
    }
    try {
        value = parseStyleValue(value)
        const result = { name, value }
        const _value = STYLE[name](value)
        if (typeof _value !== 'undefined') {
            result.value = _value
        }
        return result
    } catch (err) {
        let message = `invalid value '${value}' for property '${name}'`
        if (err !== '') message += `: ${err}`
        throw new Error(message)
    }
}

export function parseStyleName(name: string) {
    name = name.trim()
    if (name.includes('-')) {
        return name
            .toLowerCase()
            .replace(/-([a-z])/g, (_, char) => char.toUpperCase())
    }
    return name.charAt(0).toLowerCase() + name.slice(1)
}

export function parseStyleValue(value: any) {
    return String(value).trim().toLowerCase()
}

const STYLE = {
    backgroundColor: (value: string) => {
        if (!validateColor(value)) {
            throw ``
        }
    },
    position: (value: string) => {
        if (!POSITION_TYPE.hasOwnProperty(value)) {
            throw `expected one of ${Object.keys(POSITION_TYPE).join(', ')}`
        }
    },
}

function validateColor(value: string) {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/i.test(
        value,
    )
}

///
const YOGA_SETTER = {
    position: (node, input) => {
        // const value = convertEnum(POSITION_TYPE, input, 1)
        node.setPositionType(input)
        // return value
    },
    top: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPosition(EDGE.top, value)
        return value
    },
    left: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPosition(EDGE.left, value)
        return value
    },
    right: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPosition(EDGE.right, value)
        return value
    },
    bottom: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPosition(EDGE.bottom, value)
        return value
    },
    alignContent: (node, input) => {
        const value = convertEnum(ALIGN_LUT, input, 4)
        node.setAlignContent(value)
        return value
    },
    alignItems: (node, input) => {
        const value = convertEnum(ALIGN_LUT, input, 4)
        node.setAlignItems(value)
        return value
    },
    alignSelf: (node, input) => {
        const value = convertEnum(ALIGN_LUT, input, 0)
        node.setAlignSelf(value)
        return value
    },
    flexDirection: (node, input) => {
        const value = convertEnum(FLEX_DIRECTION_LUT, input, 2)
        node.setFlexDirection(value)
        return value
    },
    flexWrap: (node, input) => {
        const value = convertEnum(WRAP_LUT, input, 0)
        node.setFlexWrap(value)
        return value
    },
    justifyContent: (node, input) => {
        const value = convertEnum(JUSTIFY_LUT, input, 0)
        node.setJustifyContent(value)
        return value
    },
    marginTop: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setMargin(EDGE.top, value)
        return value
    },
    marginLeft: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setMargin(EDGE.left, value)
        return value
    },
    marginRight: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setMargin(EDGE.right, value)
        return value
    },
    marginBottom: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setMargin(EDGE.bottom, value)
        return value
    },
    margin: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setMargin(EDGE.all, value)
        return value
    },
    marginHorizontal: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setMargin(EDGE.horizontal, value)
        return value
    },
    marginVertical: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setMargin(EDGE.vertical, value)
        return value
    },
    flexBasis: (node, input) => {
        const value = formatUnit(node, input, root, NaN)
        node.setFlexBasis(value)
        return value
    },
    flexBasisPercent: (node, input) => {
        const value = convertPercent(input)
        node.setFlexBasisPercent(value)
        return value
    },
    flexBasisAuto: (node) => {
        node.setFlexBasisAuto()
    },
    flex: (node, input) => {
        node.setFlex(input)
        return input
    },
    flexGrow: (node, input) => {
        node.setFlexGrow(input)
        return input
    },
    flexShrink: (node, input) => {
        node.setFlexShrink(input)
        return input
    },
    width: (node, input) => {
        const value = formatUnit(node, input, root, NaN)
        node.setWidth(value)
        return value
    },
    widthAuto: (node) => {
        node.setWidthAuto()
    },
    widthPercent: (node, input) => {
        const value = convertPercent(input)
        node.setWidthPercent(value)
        return value
    },
    height: (node, input) => {
        const value = formatUnit(node, input, root, NaN)
        node.setHeight(value)
        return value
    },
    heightAuto: (node) => {
        node.setHeightAuto()
    },
    heightPercent: (node, input) => {
        const value = convertPercent(input)
        node.setHeightPercent(value)
        return value
    },
    minWidth: (node, input) => {
        const value = formatUnit(node, input, root)
        node.setMinWidth(value)
        return value
    },
    minWidthPercent: (node, input) => {
        const value = convertPercent(input)
        node.setMinWidthPercent(value)
        return value
    },
    minHeight: (node, input) => {
        const value = formatUnit(node, input, root)
        node.setMinHeight(value)
        return value
    },
    minHeightPercent: (node, input) => {
        const value = convertPercent(input)
        node.setMinHeightPercent(value)
        return value
    },
    maxWidth: (node, input) => {
        const value = formatUnit(node, input, root)
        node.setMaxWidth(value)
        return value
    },
    maxWidthPercent: (node, input) => {
        const value = convertPercent(input)
        node.setMaxWidthPercent(value)
        return value
    },
    maxHeight: (node, input) => {
        const value = formatUnit(node, input, root)
        node.setMaxHeight(value)
        return value
    },
    maxHeightPercent: (node, input) => {
        const value = convertPercent(input)
        node.setMaxHeightPercent(value)
        return value
    },
    boxSizing: (node, input) => {
        const value = convertEnum(BOX_SIZING_LUT, input, 0)
        node.setBoxSizing(value)
        return value
    },
    aspectRatio: (node, input) => {
        node.setAspectRatio(input)
        return input
    },
    isReferenceBaseline: (node, input) => {
        node.setIsReferenceBaseline(Boolean(input))
        return Boolean(input)
    },
    referenceBaseline: (node, input) => {
        node.setIsReferenceBaseline(Boolean(input))
        return Boolean(input)
    },
    borderTopWidth: (node, input) => {
        const value = convertBorderWidth(input, root)
        node.setBorder(EDGE.top, value)
        return value
    },
    borderLeftWidth: (node, input) => {
        const value = convertBorderWidth(input, root)
        node.setBorder(EDGE.left, value)
        return value
    },
    borderRightWidth: (node, input) => {
        const value = convertBorderWidth(input, root)
        node.setBorder(EDGE.right, value)
        return value
    },
    borderBottomWidth: (node, input) => {
        const value = convertBorderWidth(input, root)
        node.setBorder(EDGE.bottom, value)
        return value
    },
    borderWidth: (node, input) => {
        const value = convertBorderWidth(input, root)
        node.setBorder(EDGE.all, value)
        return value
    },
    border: (node, input) => {
        const value = convertBorderWidth(input, root)
        node.setBorder(EDGE.all, value)
        return value
    },
    overflow: (node, input) => {
        const value = convertEnum(OVERFLOW_LUT, input, 0)
        node.setOverflow(value)
        return value
    },
    display: (node, input) => {
        const value = convertEnum(DISPLAY_LUT, input, 0)
        node.setDisplay(value)
        return value
    },
    paddingTop: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPadding(EDGE.top, value)
        return value
    },
    paddingLeft: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPadding(EDGE.left, value)
        return value
    },
    paddingRight: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPadding(EDGE.right, value)
        return value
    },
    paddingBottom: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPadding(EDGE.bottom, value)
        return value
    },
    padding: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPadding(EDGE.all, value)
        return value
    },
    paddingHorizontal: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPadding(EDGE.horizontal, value)
        return value
    },
    paddingVertical: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPadding(EDGE.vertical, value)
        return value
    },
    gapRow: (node, input) => {
        const value = formatGap(node, input, root)
        node.setGap(GUTTER.row, value)
        return value
    },
    gapColumn: (node, input) => {
        const value = formatGap(node, input, root)
        node.setGap(GUTTER.column, value)
        return value
    },
    rowGap: (node, input) => {
        const value = formatGap(node, input, root)
        node.setGap(GUTTER.row, value)
        return value
    },
    columnGap: (node, input) => {
        const value = formatGap(node, input, root)
        node.setGap(GUTTER.column, value)
        return value
    },
    gap: (node, input) => {
        const value = formatGap(node, input, root)
        node.setGap(GUTTER.all, value)
        return value
    },
    gapPercent: (node, input) => {
        const value = convertPercent(input)
        node.setGapPercent(GUTTER.all, value)
        return value
    },
    dirtiedFunc: (node, input) => {
        if (input == null && node.unsetDirtiedFunc) {
            node.unsetDirtiedFunc()
            return
        }
        node.setDirtiedFunc(input)
        return input
    },
    measureFunc: (node, input) => {
        node.setMeasureFunc(input)
        return input
    },
    direction: (node, input) => {
        const value = convertEnum(DIRECTION_LUT, input, 0)
        node.setDirection(value)
        return value
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
            `unexpected value ${input}, expected ${Object.names(lut).join(', ')}`,
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

const POSITION_TYPE = {
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
