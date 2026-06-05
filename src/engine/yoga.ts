import { loadYoga } from 'yoga-layout/load'
import { UNIT, EDGE, GUTTER } from '../style/consts.ts'
import { calculateLayoutRect, getParentLayout } from './utils.ts'

export default async function createYogaEngine() {
    const Yoga = await loadYoga()
    const yoga_config = Yoga.Config.create()
    let root_element

    yoga_config.setUseWebDefaults(true)
    // yoga_config.setPointScaleFactor(200)
    yoga_config.setExperimentalFeatureEnabled(
        0, // ExperimentalFeature.WebFlexBasis
        true,
    )

    return {
        createElement(node) {
            const element = Yoga.Node.create(yoga_config)

            if (node.id === 0) {
                root_element = element
            }

            return element
        },

        getChildIndex(node) {
            return node.element.getChildCount()
        },

        insertChild(parent, node, childIndex) {
            parent.element.insertChild(node.element, childIndex)
        },

        removeChild(parent, node) {
            parent.element.removeChild(node.element)
            node.element.free()
        },

        update() {
            root_element.calculateLayout()
        },

        // prettier-ignore
        getLayout(node) {
            const node_rect = node.element.getComputedLayout()
            const parent_layout = getParentLayout(node)
            const parent_rect =
                node.parent?.element === root_element
                    ? { ...parent_layout, ...root_element.getComputedLayout() }
                    : parent_layout

            return calculateLayoutRect(
                applyWrappedRelativeOffsets(node, node_rect),
                parent_rect,
            )
        },
    }
}

// node_modules/yoga-layout/src/wrapAssembly.ts
export const YOGA_SETTER = {
    width: (node, { parsed }) => {
        if (parsed.unit === UNIT.PX) {
            node.setWidth(parsed.value)
        } else if (parsed.unit === UNIT.PERCENT) {
            node.setWidthPercent(parsed.value)
        } else if (parsed.unit === UNIT.AUTO) {
            node.setWidthAuto()
        }
    },
    height: (node, { parsed }) => {
        if (parsed.unit === UNIT.PX) {
            node.setHeight(parsed.value)
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
            node.setFlexGrow(undefined)
            node.setFlexShrink(undefined)
            node.setFlexBasis(undefined)
        } else {
            node.setFlexGrow(value)
            node.setFlexShrink(1)
            node.setFlexBasisPercent(0)
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
    aspectRatio: (node, { parsed }) => {
        if (parsed.unit === UNIT.UNSET) {
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
function applyWrappedRelativeOffsets(node, rect) {
    const main_axis = FLEX_DIRECTION_AXIS[node.parent?.styles.flexDirection?.value]

    // If the node is not a relatively positioned child of a wrapped flex container, no correction is needed.
    if (main_axis == null || !isRelative(node) || !isWrappedFlexParent(node)) {
        return rect
    }

    let rect_corrected = rect
    for (const axis of RELATIVE_OFFSET_AXES) {
        const reference_size = readContentSize(node.parent, axis.reference_dimension)
        const css_offset =
            readOffset(node.styles[axis.style_start], reference_size) -
            readOffset(node.styles[axis.style_end], reference_size)
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

function readContentSize(node, dimension) {
    const padding = readPxOffset(node.styles.padding)
    const border_width =
        dimension === 'width'
            ? readPxOffset(node.styles.borderLeftWidth) + readPxOffset(node.styles.borderRightWidth)
            : readPxOffset(node.styles.borderTopWidth) + readPxOffset(node.styles.borderBottomWidth)

    return node.layout[dimension] - padding * 2 - border_width
}

function readOffset(style, reference_size) {
    if (style?.parsed?.unit === UNIT.PERCENT) {
        return (reference_size * style.parsed.value) / 100
    }

    return readPxOffset(style)
}

function readPxOffset(style) {
    return style?.parsed?.unit === UNIT.PX ? style.parsed.value : 0
}

function isWrappedFlexParent(node) {
    const flexWrap = node.parent?.styles.flexWrap?.value
    return flexWrap === 'wrap' || flexWrap === 'wrap-reverse'
}

function isRelative(node) {
    return node.styles.position?.value === 'relative'
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
