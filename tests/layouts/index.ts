import layoutPositionRelative from './examples/positionRelative'
import layoutDeepNestedPaint from './examples/deepNestedPaint'
import layoutNestedFlexDirections from './examples/nestedFlexDirections'
import layoutNestedMargins from './examples/nestedMargins'
import layoutNestedPercentDimensions from './examples/nestedPercentDimensions'
import layoutNestedRelativeOffsets from './examples/nestedRelativeOffsets'
import layoutNestedWrapGap from './examples/nestedWrapGap'
import layoutOverflowVisibleHidden from './examples/overflowVisibleHidden'
import layoutWrappedAlignContentRelativeOffsets from './examples/wrappedAlignContentRelativeOffsets'
import layoutWrappedColumnRelativeOffsets from './examples/wrappedColumnRelativeOffsets'
import layoutWrappedMainAxisRelativeOffsets from './examples/wrappedMainAxisRelativeOffsets'
import layoutWrappedPercentRelativeOffsets from './examples/wrappedPercentRelativeOffsets'
import layoutWrappedRelativeOffsets from './examples/wrappedRelativeOffsets'
import layoutWrappedRelativeWrapReverse from './examples/wrappedRelativeWrapReverse'
import zindexBasic from './examples/zindexBasic'
import zindexNested from './examples/zindexNested'
import zindexGrid from './examples/zindexGrid'
import zindexEdgeCases from './examples/zindexEdgeCases'

export const LAYOUTS = {
    deepNestedPaint: layoutDeepNestedPaint,
    nestedFlexDirections: layoutNestedFlexDirections,
    nestedMargins: layoutNestedMargins,
    nestedPercentDimensions: layoutNestedPercentDimensions,
    nestedRelativeOffsets: layoutNestedRelativeOffsets,
    nestedWrapGap: layoutNestedWrapGap,
    overflowVisibleHidden: layoutOverflowVisibleHidden,
    wrappedAlignContentRelativeOffsets:
        layoutWrappedAlignContentRelativeOffsets,
    wrappedColumnRelativeOffsets: layoutWrappedColumnRelativeOffsets,
    wrappedMainAxisRelativeOffsets: layoutWrappedMainAxisRelativeOffsets,
    wrappedPercentRelativeOffsets: layoutWrappedPercentRelativeOffsets,
    wrappedRelativeOffsets: layoutWrappedRelativeOffsets,
    wrappedRelativeWrapReverse: layoutWrappedRelativeWrapReverse,
    positionRelative: layoutPositionRelative,
    zindexBasic: zindexBasic,
    zindexNested: zindexNested,
    zindexGrid: zindexGrid,
    zindexEdgeCases: zindexEdgeCases,
}

export const layoutNames = Object.keys(LAYOUTS)
const layoutNamesByLowerCase = Object.fromEntries(
    layoutNames.map((name) => [name.toLowerCase(), name]),
)

export function getLayout(name) {
    const layoutName = layoutNamesByLowerCase[name.toLowerCase()]

    if (layoutName != null) {
        return LAYOUTS[layoutName]
    }

    throw new Error(
        `layout '${name}' not found. Available layouts: ${layoutNames.join(', ')}`,
    )
}

export function resolveLayoutName(name) {
    return layoutNamesByLowerCase[name.toLowerCase()]
}
