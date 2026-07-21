import { loadYoga } from 'yoga-layout/load'
import { UNIT, KEYWORD, EDGE, GUTTER } from '../style/consts'
import { calculateLayoutRect, getParentLayout } from './utils'
import { MEASURE_MODE } from './types'

export default async function createYogaEngine({ computeStyleValue = (style) => style } = {}) {
    const Yoga = await loadYoga()
    const yoga_config = Yoga.Config.create()
    const elements = new WeakMap()
    let root_element

    yoga_config.setUseWebDefaults(true)
    yoga_config.setPointScaleFactor(0)
    yoga_config.setExperimentalFeatureEnabled(
        0, // ExperimentalFeature.WebFlexBasis
        true,
    )

    function createYogaElement(node) {
        const element = Yoga.Node.create(yoga_config)
        elements.set(node, element)

        if (node.id === 0) {
            root_element = element
        }

        return element
    }

    function getElement(node) {
        return elements.get(node)
    }

    function calculate() {
        root_element.calculateLayout()
    }

    return {
        createNode(node) {
            createYogaElement(node)
        },

        createElement(node) {
            return createYogaElement(node)
        },

        getChildIndex(node) {
            return getElement(node).getChildCount()
        },

        insertChild(parent, node, childIndex) {
            getElement(parent).insertChild(getElement(node), childIndex)
        },

        removeChild(parent, node) {
            const element = getElement(node)
            getElement(parent).removeChild(element)
            element.free()
            elements.delete(node)
        },

        applyStyle(node, style) {
            const computed_style = computeStyleValue(style)
            const setter = YOGA_SETTER[computed_style.name]
            if (setter !== undefined) {
                setter(getElement(node), computed_style)
            }
        },

        setMeasureFunction(node, measure_function) {
            getElement(node).setMeasureFunc((width, width_mode, height, height_mode) =>
                measure_function(
                    width,
                    toMeasureMode(Yoga, width_mode),
                    height,
                    toMeasureMode(Yoga, height_mode),
                ),
            )
        },

        markDirty(node) {
            getElement(node).markDirty()
        },

        calculate,

        update() {
            calculate()
        },

        // prettier-ignore
        getLayout(node) {
            const element = getElement(node)
            const node_rect = element.getComputedLayout()
            const parent_layout = getParentLayout(node)
            const parent_rect =
                node.parent != null && getElement(node.parent) === root_element
                    ? { ...parent_layout, ...root_element.getComputedLayout() }
                    : parent_layout

            return {
                ...calculateLayoutRect(
                    applyWrappedRelativeOffsets(node, node_rect, computeStyleValue),
                    parent_rect,
                ),
                padding: getComputedEdges(element, 'getComputedPadding'),
                border: getComputedEdges(element, 'getComputedBorder'),
            }
        },
    }
}

function toMeasureMode(Yoga, measure_mode) {
    if (measure_mode === Yoga.MEASURE_MODE_UNDEFINED) {
        return MEASURE_MODE.UNDEFINED
    }
    if (measure_mode === Yoga.MEASURE_MODE_EXACTLY) {
        return MEASURE_MODE.EXACTLY
    }

    return MEASURE_MODE.AT_MOST
}

function getComputedEdges(element, method) {
    return {
        top: element[method](EDGE.top),
        right: element[method](EDGE.right),
        bottom: element[method](EDGE.bottom),
        left: element[method](EDGE.left),
    }
}

// node_modules/yoga-layout/src/wrapAssembly.ts
export const YOGA_SETTER = {
    width: (node, { parsed }) => {
        if (parsed.kind === UNIT.PX) {
            node.setWidth(parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setWidthPercent(parsed.value)
        } else if (parsed.kind === KEYWORD.AUTO) {
            node.setWidthAuto()
        }
    },
    height: (node, { parsed }) => {
        if (parsed.kind === UNIT.PX) {
            node.setHeight(parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setHeightPercent(parsed.value)
        } else if (parsed.kind === KEYWORD.AUTO) {
            node.setHeightAuto()
        }
    },
    minWidth: (node, { parsed }) => {
        if (parsed.kind === UNIT.PX) {
            node.setMinWidth(parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setMinWidthPercent(parsed.value)
        } else if (parsed.kind === KEYWORD.UNSET) {
            node.setMinWidth(undefined)
        }
    },
    minHeight: (node, { parsed }) => {
        if (parsed.kind === UNIT.PX) {
            node.setMinHeight(parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setMinHeightPercent(parsed.value)
        } else if (parsed.kind === KEYWORD.UNSET) {
            node.setMinHeight(undefined)
        }
    },
    maxWidth: (node, { parsed }) => {
        if (parsed.kind === UNIT.PX) {
            node.setMaxWidth(parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setMaxWidthPercent(parsed.value)
        } else if (parsed.kind === KEYWORD.UNSET) {
            node.setMaxWidth(undefined)
        }
    },
    maxHeight: (node, { parsed }) => {
        if (parsed.kind === UNIT.PX) {
            node.setMaxHeight(parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setMaxHeightPercent(parsed.value)
        } else if (parsed.kind === KEYWORD.UNSET) {
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
    flexGrow: (node, { value, parsed }) => {
        if (parsed.kind === KEYWORD.UNSET) {
            node.setFlexGrow(undefined)
        } else {
            node.setFlexGrow(value)
        }
    },
    flexShrink: (node, { value, parsed }) => {
        if (parsed.kind === KEYWORD.UNSET) {
            node.setFlexShrink(undefined)
        } else {
            node.setFlexShrink(value)
        }
    },
    flexBasis: (node, { parsed }) => {
        if (parsed.kind === UNIT.PX) {
            node.setFlexBasis(parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setFlexBasisPercent(parsed.value)
        } else if (parsed.kind === KEYWORD.AUTO) {
            node.setFlexBasisAuto()
        } else if (parsed.kind === KEYWORD.UNSET) {
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

    // margin: (node, { parsed }) => {
    //     setMargin(node, EDGE.all, parsed)
    // },
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
    boxSizing: (node, { parsed }) => {
        node.setBoxSizing(parsed.enum)
    },
    // borderWidth: (node, { parsed }) => {
    //     node.setBorder(EDGE.all, parsed.value)
    // },
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
    overflow: (node, { parsed }) => {
        node.setOverflow(parsed.enum)
    },
    display: (node, { parsed }) => {
        node.setDisplay(parsed.enum)
    },
    // padding: (node, { parsed }) => {
    //     setPadding(node, EDGE.all, parsed)
    // },
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
        if (parsed.kind === UNIT.PX) {
            node.setGap(GUTTER.all, parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setGapPercent(GUTTER.all, parsed.value)
        }
    },
    rowGap: (node, { parsed }) => {
        if (parsed.kind === UNIT.PX) {
            node.setGap(GUTTER.row, parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setGapPercent(GUTTER.row, parsed.value)
        }
    },
    columnGap: (node, { parsed }) => {
        if (parsed.kind === UNIT.PX) {
            node.setGap(GUTTER.column, parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setGapPercent(GUTTER.column, parsed.value)
        }
    },

    direction: (node, { parsed }) => {
        node.setDirection(parsed.enum)
    },
    aspectRatio: (node, { parsed }) => {
        if (parsed.kind === KEYWORD.UNSET) {
            node.setAspectRatio(undefined)
        } else {
            node.setAspectRatio(parsed.value)
        }
    },
    // isReferenceBaseline: (node, { value }) => {
    //     node.setIsReferenceBaseline(Boolean(input))
    //     return Boolean(input)
    // },
    // referenceBaseline: (node, { value }) => {
    //     node.setIsReferenceBaseline(Boolean(input))
    //     return Boolean(input)
    // },
}

// Correct Yoga's wrapped flex relative offsets so painted divs match the DOM.
// Yoga may omit cross-axis offsets or apply reverse main-axis offsets backward.
function applyWrappedRelativeOffsets(node, rect, computeStyleValue) {
    const main_axis = FLEX_DIRECTION_AXIS[node.parent?.styles.flexDirection?.value]

    // If the node is not a relatively positioned child of a wrapped flex container, no correction is needed.
    if (main_axis == null || !isRelative(node) || !isWrappedFlexParent(node)) {
        return rect
    }

    let rect_corrected = rect
    for (const axis of RELATIVE_OFFSET_AXES) {
        const reference_size = readContentSize(node.parent, axis.reference_dimension, computeStyleValue)
        const css_offset =
            readOffset(node.styles[axis.style_start], reference_size, computeStyleValue) -
            readOffset(node.styles[axis.style_end], reference_size, computeStyleValue)
        const yoga_offset = axis.name === main_axis.name ? css_offset * main_axis.direction : 0
        const correction = css_offset - yoga_offset

        if (correction !== 0) {
            rect_corrected = {
                ...rect_corrected,
                [axis.rect_property]: rect_corrected[axis.rect_property] + correction,
            }
        }
    }

    return rect_corrected
}

const FLEX_DIRECTION_AXIS = {
    row: { name: 'x', direction: 1 },
    'row-reverse': { name: 'x', direction: -1 },
    column: { name: 'y', direction: 1 },
    'column-reverse': { name: 'y', direction: -1 },
}

const RELATIVE_OFFSET_AXES = [
    {
        name: 'x',
        rect_property: 'left',
        style_start: 'left',
        style_end: 'right',
        reference_dimension: 'width',
    },
    {
        name: 'y',
        rect_property: 'top',
        style_start: 'top',
        style_end: 'bottom',
        reference_dimension: 'height',
    },
]

function readContentSize(node, dimension, computeStyleValue) {
    const padding =
        dimension === 'width'
            ? readPxOffset(node.styles.paddingLeft, computeStyleValue) +
              readPxOffset(node.styles.paddingRight, computeStyleValue)
            : readPxOffset(node.styles.paddingTop, computeStyleValue) +
              readPxOffset(node.styles.paddingBottom, computeStyleValue)
    const border_width =
        dimension === 'width'
            ? readPxOffset(node.styles.borderLeftWidth, computeStyleValue) +
              readPxOffset(node.styles.borderRightWidth, computeStyleValue)
            : readPxOffset(node.styles.borderTopWidth, computeStyleValue) +
              readPxOffset(node.styles.borderBottomWidth, computeStyleValue)

    return node.layout[dimension] - padding - border_width
}

function readOffset(style, reference_size, computeStyleValue) {
    const computed_style = computeStyleValue(style)

    if (computed_style?.parsed?.kind === UNIT.PERCENT) {
        return (reference_size * computed_style.parsed.value) / 100
    }

    return computed_style?.parsed?.kind === UNIT.PX ? computed_style.parsed.value : 0
}

function readPxOffset(style, computeStyleValue) {
    const computed_style = computeStyleValue(style)
    return computed_style?.parsed?.kind === UNIT.PX ? computed_style.parsed.value : 0
}

function isWrappedFlexParent(node) {
    const flexWrap = node.parent?.styles.flexWrap?.value
    return flexWrap === 'wrap' || flexWrap === 'wrap-reverse'
}

function isRelative(node) {
    return node.styles.position?.value === 'relative'
}

function setPosition(node, edge, parsed) {
    if (parsed.kind === UNIT.PX) {
        node.setPosition(edge, parsed.value)
    } else if (parsed.kind === UNIT.PERCENT) {
        node.setPositionPercent(edge, parsed.value)
    } else if (parsed.kind === KEYWORD.AUTO) {
        node.setPositionAuto(edge)
    } else if (parsed.kind === KEYWORD.UNSET) {
        node.setPosition(edge, undefined)
    }
}

function setMargin(node, edge, parsed) {
    if (parsed.kind === UNIT.PX) {
        node.setMargin(edge, parsed.value)
    } else if (parsed.kind === UNIT.PERCENT) {
        node.setMarginPercent(edge, parsed.value)
    } else if (parsed.kind === KEYWORD.AUTO) {
        node.setMarginAuto(edge)
    }
}

function setPadding(node, edge, parsed) {
    if (parsed.kind === UNIT.PX) {
        node.setPadding(edge, parsed.value)
    } else if (parsed.kind === UNIT.PERCENT) {
        node.setPaddingPercent(edge, parsed.value)
    }
}
