import borderRadius from './examples/borderRadius'
import borderRadiusCorners from './examples/borderRadiusCorners'
import borderRadiusOverlap from './examples/borderRadiusOverlap'
import backgroundImage from './examples/backgroundImage'
import positionRelative from './examples/positionRelative'
import deepNestedPaint from './examples/deepNestedPaint'
import nestedFlexDirections from './examples/nestedFlexDirections'
import nestedMargins from './examples/nestedMargins'
import nestedPercentDimensions from './examples/nestedPercentDimensions'
import nestedRelativeOffsets from './examples/nestedRelativeOffsets'
import nestedWrapGap from './examples/nestedWrapGap'
import overflowScroll from './examples/overflowScroll'
import overflowVisibleHidden from './examples/overflowVisibleHidden'
import wrappedAlignContentRelativeOffsets from './examples/wrappedAlignContentRelativeOffsets'
import wrappedColumnRelativeOffsets from './examples/wrappedColumnRelativeOffsets'
import wrappedMainAxisRelativeOffsets from './examples/wrappedMainAxisRelativeOffsets'
import wrappedPercentRelativeOffsets from './examples/wrappedPercentRelativeOffsets'
import wrappedRelativeOffsets from './examples/wrappedRelativeOffsets'
import wrappedRelativeWrapReverse from './examples/wrappedRelativeWrapReverse'
import zindexBasic from './examples/zindexBasic'
import zindexNested from './examples/zindexNested'
import zindexGrid from './examples/zindexGrid'
import zindexEdgeCases from './examples/zindexEdgeCases'

export const LAYOUTS = {
    backgroundImage,
    borderRadius,
    borderRadiusCorners,
    borderRadiusOverlap,
    deepNestedPaint,
    nestedFlexDirections,
    nestedMargins,
    nestedPercentDimensions,
    nestedRelativeOffsets,
    nestedWrapGap,
    overflowScroll,
    overflowVisibleHidden,
    wrappedAlignContentRelativeOffsets,
    wrappedColumnRelativeOffsets,
    wrappedMainAxisRelativeOffsets,
    wrappedPercentRelativeOffsets,
    wrappedRelativeOffsets,
    wrappedRelativeWrapReverse,
    positionRelative,
    zindexBasic,
    zindexNested,
    zindexGrid,
    zindexEdgeCases,
}

export const layoutNames = Object.keys(LAYOUTS)
const layoutNamesByLowerCase = Object.fromEntries(layoutNames.map((name) => [name.toLowerCase(), name]))

export function getLayout(name) {
    const layoutName = layoutNamesByLowerCase[name.toLowerCase()]

    if (layoutName != null) {
        return LAYOUTS[layoutName]
    }

    throw new Error(`layout '${name}' not found. Available layouts: ${layoutNames.join(', ')}`)
}

export function resolveLayoutName(name) {
    return layoutNamesByLowerCase[name.toLowerCase()]
}
