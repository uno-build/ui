import type { Yoga, Node as YogaNode, Edge } from 'yoga-layout/load'
import type Node from '../core/Node'
import type { ResolvedStyle } from '../style/types'

import {
    UNIT,
    KEYWORD,
    EDGE,
    GUTTER,
    POSITION,
    ALIGN_CONTENT,
    ALIGN_ITEMS,
    ALIGN_SELF,
    FLEX_DIRECTION,
    WRAP,
    JUSTIFY,
    OVERFLOW,
    DISPLAY,
    DIRECTION,
    BOX_SIZING,
    MEASURE_MODE,
} from '../style/constants'
import { calculateLayoutRect, getParentLayout } from './utils'

export default async function createYogaLayouter({ loadYoga }: { loadYoga?: () => Promise<Yoga> } = {}) {
    // if (typeof loadYoga !== 'function') {
    //     loadYoga = (await import('yoga-layout/load')).loadYoga
    // }

    const yoga = await loadYoga!()
    const yoga_config = yoga.Config.create()
    const elements = new WeakMap<Node, YogaNode>()
    let root_element: YogaNode | undefined

    yoga_config.setUseWebDefaults(true)
    yoga_config.setPointScaleFactor(0)
    yoga_config.setExperimentalFeatureEnabled(
        0, // ExperimentalFeature.WebFlexBasis
        true,
    )

    function createYogaElement(node: Node) {
        const element = yoga.Node.create(yoga_config)
        elements.set(node, element)

        if (node.id === 0) {
            root_element = element
        }

        return element
    }

    function getElement(node: Node): YogaNode
    function getElement(node: Node | null): YogaNode | undefined
    function getElement(node: Node | null) {
        return elements.get(node!)
    }

    function calculate(width?: number | 'auto', height?: number | 'auto') {
        root_element!.calculateLayout(width, height)
    }

    return {
        createNode(node: Node) {
            createYogaElement(node)
        },

        createElement(node: Node) {
            return createYogaElement(node)
        },

        getChildIndex(node: Node) {
            return getElement(node).getChildCount()
        },

        insertChild(parent: Node, node: Node, child_index: number) {
            getElement(parent).insertChild(getElement(node), child_index)
        },

        detachChild(parent: Node, node: Node) {
            const element = getElement(node)
            getElement(parent).removeChild(element)
        },

        destroyNode(node: Node) {
            const element = getElement(node)
            element.free()
            elements.delete(node)
        },

        destroy(nodes: Node[]) {
            const root_elements = nodes.filter((node) => node.parent === null).map(getElement)

            for (const element of root_elements) {
                element!.freeRecursive()
            }
            for (const node of nodes) {
                elements.delete(node)
            }

            root_element = undefined
            yoga_config.free()
        },

        applyStyle(node: Node, style: ResolvedStyle & { name: string }) {
            const setter = YOGA_SETTER[style.name as keyof typeof YOGA_SETTER]
            if (setter !== undefined) {
                setter(getElement(node), style as { parsed: ParsedLayoutStyle })
            }
        },

        setMeasureFunction(node: Node, measureFunction: (width: number, width_mode: string, height: number, height_mode: string) => { width: number, height: number }) {
            getElement(node).setMeasureFunc((width, width_mode, height, height_mode) =>
                measureFunction(width, toMeasureMode(yoga, width_mode), height, toMeasureMode(yoga, height_mode)),
            )
        },

        markDirty(node: Node) {
            getElement(node).markDirty()
        },

        isDirty() {
            return root_element!.isDirty()
        },

        calculate,

        update(width?: number | 'auto', height?: number | 'auto') {
            calculate(width, height)
        },

        // prettier-ignore
        getLayout(node: Node) {
            const element = getElement(node)
            const node_rect = element.getComputedLayout()
            const parent_layout = getParentLayout(node)
            const parent_rect =
                node.parent != null && getElement(node.parent) === root_element
                    ? { ...parent_layout, ...root_element!.getComputedLayout() }
                    : parent_layout

            return {
                ...calculateLayoutRect(
                    applyWrappedRelativeOffsets(node, node_rect, getElement, yoga),
                    parent_rect,
                ),
                padding: getComputedEdges(element, 'getComputedPadding'),
                border: getComputedEdges(element, 'getComputedBorder'),
            }
        },
    }
}

function toMeasureMode(yoga: Yoga, measure_mode: number) {
    if (measure_mode === yoga.MEASURE_MODE_UNDEFINED) {
        return MEASURE_MODE.UNDEFINED
    }
    if (measure_mode === yoga.MEASURE_MODE_EXACTLY) {
        return MEASURE_MODE.EXACTLY
    }

    return MEASURE_MODE.AT_MOST
}

function getComputedEdges(element: YogaNode, method: 'getComputedPadding' | 'getComputedBorder') {
    return {
        top: element[method](EDGE.top),
        right: element[method](EDGE.right),
        bottom: element[method](EDGE.bottom),
        left: element[method](EDGE.left),
    }
}

// node_modules/yoga-layout/src/wrapAssembly.ts
type ParsedLayoutStyle = { kind?: string, value?: number, enum?: number }

export const YOGA_SETTER = {
    width: (node, { parsed }) => {
        if (parsed.kind === KEYWORD.UNSET || parsed.kind === KEYWORD.AUTO) {
            node.setWidthAuto()
        } else if (parsed.kind === UNIT.PX) {
            node.setWidth(parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setWidthPercent(parsed.value)
        }
    },
    height: (node, { parsed }) => {
        if (parsed.kind === KEYWORD.UNSET || parsed.kind === KEYWORD.AUTO) {
            node.setHeightAuto()
        } else if (parsed.kind === UNIT.PX) {
            node.setHeight(parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setHeightPercent(parsed.value)
        }
    },
    minWidth: (node, { parsed }) => {
        if (parsed.kind === KEYWORD.UNSET) {
            node.setMinWidth(undefined)
        } else if (parsed.kind === UNIT.PX) {
            node.setMinWidth(parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setMinWidthPercent(parsed.value)
        }
    },
    minHeight: (node, { parsed }) => {
        if (parsed.kind === KEYWORD.UNSET) {
            node.setMinHeight(undefined)
        } else if (parsed.kind === UNIT.PX) {
            node.setMinHeight(parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setMinHeightPercent(parsed.value)
        }
    },
    maxWidth: (node, { parsed }) => {
        if (parsed.kind === KEYWORD.UNSET) {
            node.setMaxWidth(undefined)
        } else if (parsed.kind === UNIT.PX) {
            node.setMaxWidth(parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setMaxWidthPercent(parsed.value)
        }
    },
    maxHeight: (node, { parsed }) => {
        if (parsed.kind === KEYWORD.UNSET) {
            node.setMaxHeight(undefined)
        } else if (parsed.kind === UNIT.PX) {
            node.setMaxHeight(parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setMaxHeightPercent(parsed.value)
        }
    },
    position: (node, { parsed }) => {
        node.setPositionType(parsed.kind === KEYWORD.UNSET ? POSITION.relative : parsed.enum!)
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
    flexGrow: (node, { parsed }) => {
        node.setFlexGrow(parsed.kind === KEYWORD.UNSET ? undefined : parsed.value)
    },
    flexShrink: (node, { parsed }) => {
        node.setFlexShrink(parsed.kind === KEYWORD.UNSET ? undefined : parsed.value)
    },
    flexBasis: (node, { parsed }) => {
        if (parsed.kind === KEYWORD.UNSET || parsed.kind === KEYWORD.AUTO) {
            node.setFlexBasisAuto()
        } else if (parsed.kind === UNIT.PX) {
            node.setFlexBasis(parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setFlexBasisPercent(parsed.value)
        }
    },
    flexDirection: (node, { parsed }) => {
        node.setFlexDirection(parsed.kind === KEYWORD.UNSET ? FLEX_DIRECTION.row : parsed.enum!)
    },
    flexWrap: (node, { parsed }) => {
        node.setFlexWrap(parsed.kind === KEYWORD.UNSET ? WRAP.nowrap : parsed.enum!)
    },
    alignContent: (node, { parsed }) => {
        node.setAlignContent(parsed.kind === KEYWORD.UNSET ? ALIGN_CONTENT.stretch : parsed.enum!)
    },
    alignItems: (node, { parsed }) => {
        node.setAlignItems(parsed.kind === KEYWORD.UNSET ? ALIGN_ITEMS.stretch : parsed.enum!)
    },
    alignSelf: (node, { parsed }) => {
        node.setAlignSelf(parsed.kind === KEYWORD.UNSET ? ALIGN_SELF.auto : parsed.enum!)
    },
    justifyContent: (node, { parsed }) => {
        node.setJustifyContent(parsed.kind === KEYWORD.UNSET ? JUSTIFY['flex-start'] : parsed.enum!)
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
        node.setBoxSizing(parsed.kind === KEYWORD.UNSET ? BOX_SIZING['border-box'] : parsed.enum!)
    },
    // borderWidth: (node, { parsed }) => {
    //     node.setBorder(EDGE.all, parsed.value)
    // },
    borderTopWidth: (node, { parsed }) => {
        node.setBorder(EDGE.top, parsed.kind === KEYWORD.UNSET ? undefined : parsed.value)
    },
    borderLeftWidth: (node, { parsed }) => {
        node.setBorder(EDGE.left, parsed.kind === KEYWORD.UNSET ? undefined : parsed.value)
    },
    borderRightWidth: (node, { parsed }) => {
        node.setBorder(EDGE.right, parsed.kind === KEYWORD.UNSET ? undefined : parsed.value)
    },
    borderBottomWidth: (node, { parsed }) => {
        node.setBorder(EDGE.bottom, parsed.kind === KEYWORD.UNSET ? undefined : parsed.value)
    },
    overflow: (node, { parsed }) => {
        node.setOverflow(parsed.kind === KEYWORD.UNSET ? OVERFLOW.visible : parsed.enum!)
    },
    display: (node, { parsed }) => {
        node.setDisplay(parsed.kind === KEYWORD.UNSET ? DISPLAY.flex : parsed.enum!)
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
        if (parsed.kind === KEYWORD.UNSET) {
            node.setGap(GUTTER.all, undefined)
        } else if (parsed.kind === UNIT.PX) {
            node.setGap(GUTTER.all, parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setGapPercent(GUTTER.all, parsed.value)
        }
    },
    rowGap: (node, { parsed }) => {
        if (parsed.kind === KEYWORD.UNSET) {
            node.setGap(GUTTER.row, undefined)
        } else if (parsed.kind === UNIT.PX) {
            node.setGap(GUTTER.row, parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setGapPercent(GUTTER.row, parsed.value)
        }
    },
    columnGap: (node, { parsed }) => {
        if (parsed.kind === KEYWORD.UNSET) {
            node.setGap(GUTTER.column, undefined)
        } else if (parsed.kind === UNIT.PX) {
            node.setGap(GUTTER.column, parsed.value)
        } else if (parsed.kind === UNIT.PERCENT) {
            node.setGapPercent(GUTTER.column, parsed.value)
        }
    },

    direction: (node, { parsed }) => {
        node.setDirection(parsed.kind === KEYWORD.UNSET ? DIRECTION.inherit : parsed.enum!)
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
} satisfies Record<string, (node: YogaNode, style: { parsed: ParsedLayoutStyle }) => void>

// Correct Yoga's wrapped flex relative offsets so painted divs match the DOM.
// Yoga may omit cross-axis offsets or apply reverse main-axis offsets backward.
function applyWrappedRelativeOffsets(node: Node, rect: ReturnType<YogaNode['getComputedLayout']>, getElement: (node: Node | null) => YogaNode | undefined, yoga: Yoga) {
    const element = getElement(node)
    const parent_element = getElement(node.parent)
    const main_axis = FLEX_DIRECTION_AXIS[parent_element?.getFlexDirection() as number]

    // If the node is not a relatively positioned child of a wrapped flex container, no correction is needed.
    if (main_axis == null || !isRelative(element!, yoga) || !isWrappedFlexParent(parent_element!, yoga)) {
        return rect
    }

    let rect_corrected = rect
    for (const axis of RELATIVE_OFFSET_AXES) {
        const reference_size = readContentSize(node.parent!, parent_element!, axis.reference_dimension)
        const css_offset =
            readOffset(element!.getPosition(axis.edge_start), reference_size, yoga) -
            readOffset(element!.getPosition(axis.edge_end), reference_size, yoga)
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

const FLEX_DIRECTION_AXIS: Record<number, { name: string, direction: number }> = {
    [FLEX_DIRECTION.row]: { name: 'x', direction: 1 },
    [FLEX_DIRECTION['row-reverse']]: { name: 'x', direction: -1 },
    [FLEX_DIRECTION.column]: { name: 'y', direction: 1 },
    [FLEX_DIRECTION['column-reverse']]: { name: 'y', direction: -1 },
}

const RELATIVE_OFFSET_AXES: Array<{ name: string, rect_property: 'left' | 'top', edge_start: Edge, edge_end: Edge, reference_dimension: 'width' | 'height' }> = [
    {
        name: 'x',
        rect_property: 'left',
        edge_start: EDGE.left,
        edge_end: EDGE.right,
        reference_dimension: 'width',
    },
    {
        name: 'y',
        rect_property: 'top',
        edge_start: EDGE.top,
        edge_end: EDGE.bottom,
        reference_dimension: 'height',
    },
]

function readContentSize(node: Node, element: YogaNode, dimension: 'width' | 'height') {
    const padding =
        dimension === 'width'
            ? element.getComputedPadding(EDGE.left) + element.getComputedPadding(EDGE.right)
            : element.getComputedPadding(EDGE.top) + element.getComputedPadding(EDGE.bottom)
    const border_width =
        dimension === 'width'
            ? element.getComputedBorder(EDGE.left) + element.getComputedBorder(EDGE.right)
            : element.getComputedBorder(EDGE.top) + element.getComputedBorder(EDGE.bottom)

    return node.layout[dimension]! - padding - border_width
}

function readOffset(value: ReturnType<YogaNode['getPosition']>, reference_size: number, yoga: Yoga) {
    if (value.unit === yoga.UNIT_PERCENT) {
        return (reference_size * value.value) / 100
    }

    return value.unit === yoga.UNIT_POINT ? value.value : 0
}

function isWrappedFlexParent(element: YogaNode, yoga: Yoga) {
    const flex_wrap = element.getFlexWrap()
    return flex_wrap === yoga.WRAP_WRAP || flex_wrap === yoga.WRAP_WRAP_REVERSE
}

function isRelative(element: YogaNode, yoga: Yoga) {
    return element.getPositionType() === yoga.POSITION_TYPE_RELATIVE
}

function setPosition(node: YogaNode, edge: Edge, parsed: ParsedLayoutStyle) {
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

function setMargin(node: YogaNode, edge: Edge, parsed: ParsedLayoutStyle) {
    if (parsed.kind === KEYWORD.UNSET) {
        node.setMargin(edge, undefined)
    } else if (parsed.kind === UNIT.PX) {
        node.setMargin(edge, parsed.value)
    } else if (parsed.kind === UNIT.PERCENT) {
        node.setMarginPercent(edge, parsed.value)
    } else if (parsed.kind === KEYWORD.AUTO) {
        node.setMarginAuto(edge)
    }
}

function setPadding(node: YogaNode, edge: Edge, parsed: ParsedLayoutStyle) {
    if (parsed.kind === KEYWORD.UNSET) {
        node.setPadding(edge, undefined)
    } else if (parsed.kind === UNIT.PX) {
        node.setPadding(edge, parsed.value)
    } else if (parsed.kind === UNIT.PERCENT) {
        node.setPaddingPercent(edge, parsed.value)
    }
}
