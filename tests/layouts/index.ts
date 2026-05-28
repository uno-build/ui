import layoutBasic from './examples/basic'
import layoutDeepNestedPaint from './examples/deepNestedPaint'
import layoutNestedFlexDirections from './examples/nestedFlexDirections'
import layoutNestedMargins from './examples/nestedMargins'
import layoutNestedPercentDimensions from './examples/nestedPercentDimensions'
import layoutNestedRelativeOffsets from './examples/nestedRelativeOffsets'
import layoutNestedWrapGap from './examples/nestedWrapGap'
import layoutRelative from './examples/relative'
import layoutZIndex from './examples/zindex'

export const LAYOUTS = {
    basic: layoutBasic,
    deepNestedPaint: layoutDeepNestedPaint,
    nestedFlexDirections: layoutNestedFlexDirections,
    nestedMargins: layoutNestedMargins,
    nestedPercentDimensions: layoutNestedPercentDimensions,
    nestedRelativeOffsets: layoutNestedRelativeOffsets,
    nestedWrapGap: layoutNestedWrapGap,
    relative: layoutRelative,
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
