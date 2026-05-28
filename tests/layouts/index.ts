import layoutPositionRelative from './examples/positionRelative'
import layoutDeepNestedPaint from './examples/deepNestedPaint'
import layoutNestedFlexDirections from './examples/nestedFlexDirections'
import layoutNestedMargins from './examples/nestedMargins'
import layoutNestedPercentDimensions from './examples/nestedPercentDimensions'
import layoutNestedRelativeOffsets from './examples/nestedRelativeOffsets'
import layoutNestedWrapGap from './examples/nestedWrapGap'
import layoutWrappedAlignContentRelativeOffsets from './examples/wrappedAlignContentRelativeOffsets'
import layoutWrappedColumnRelativeOffsets from './examples/wrappedColumnRelativeOffsets'
import layoutWrappedMainAxisRelativeOffsets from './examples/wrappedMainAxisRelativeOffsets'
import layoutWrappedPercentRelativeOffsets from './examples/wrappedPercentRelativeOffsets'
import layoutWrappedRelativeOffsets from './examples/wrappedRelativeOffsets'
import layoutWrappedRelativeWrapReverse from './examples/wrappedRelativeWrapReverse'
import layoutZIndex from './examples/zindex'

export const LAYOUTS = {
    positionRelative: layoutPositionRelative,
    deepNestedPaint: layoutDeepNestedPaint,
    nestedFlexDirections: layoutNestedFlexDirections,
    nestedMargins: layoutNestedMargins,
    nestedPercentDimensions: layoutNestedPercentDimensions,
    nestedRelativeOffsets: layoutNestedRelativeOffsets,
    nestedWrapGap: layoutNestedWrapGap,
    wrappedAlignContentRelativeOffsets:
        layoutWrappedAlignContentRelativeOffsets,
    wrappedColumnRelativeOffsets: layoutWrappedColumnRelativeOffsets,
    wrappedMainAxisRelativeOffsets: layoutWrappedMainAxisRelativeOffsets,
    wrappedPercentRelativeOffsets: layoutWrappedPercentRelativeOffsets,
    wrappedRelativeOffsets: layoutWrappedRelativeOffsets,
    wrappedRelativeWrapReverse: layoutWrappedRelativeWrapReverse,
    zindex: layoutZIndex,
}

export const layoutNames = Object.keys(LAYOUTS)

export function getLayout(name) {
    if (hasOwn(LAYOUTS, name)) {
        return LAYOUTS[name]
    }

    throw new Error(
        `layout '${name}' not found. Available layouts: ${layoutNames.join(', ')}`,
    )
}

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key)
}
