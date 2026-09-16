import borderRadius from './examples/borderRadius'
import borderRadiusCorners from './examples/borderRadiusCorners'
import borderRadiusOverlap from './examples/borderRadiusOverlap'
import boxShadow from './examples/boxShadow'
import boxShadow2 from './examples/boxShadow2'
import boxShadow3 from './examples/boxShadow3'
import events from './examples/events'
import backgroundImage from './examples/backgroundImage'
import backgroundPosition from './examples/backgroundPosition'
import backgroundRepeat from './examples/backgroundRepeat'
import backgroundRepeat2 from './examples/backgroundRepeat2'
import backgroundSize from './examples/backgroundSize'
import backgroundImageBleeding from './examples/backgroundImageBleeding'
import backgroundImageUnset from './examples/backgroundImageUnset'
import positionRelative from './examples/positionRelative'
import unitsRem from './examples/unitsRem'
import unitsViewport from './examples/unitsViewport'
import fontLetterSpacing from './examples/fontLetterSpacing'
import fontLineHeight from './examples/fontLineHeight'
import fontParagraph from './examples/fontParagraph'
import fontSize from './examples/fontSize'
import fontTextAlign from './examples/fontTextAlign'
import fontTextShadow from './examples/fontTextShadow'
import fontTextStroke from './examples/fontTextStroke'
import flexboxNestedDeepPaint from './examples/flexboxNestedDeepPaint'
import flexboxNestedDirections from './examples/flexboxNestedDirections'
import flexboxNestedMargins from './examples/flexboxNestedMargins'
import flexboxNestedPercentDimensions from './examples/flexboxNestedPercentDimensions'
import flexboxNestedRelativeOffsets from './examples/flexboxNestedRelativeOffsets'
import flexboxNestedWrapGap from './examples/flexboxNestedWrapGap'
import overflowScroll from './examples/overflowScroll'
import overflowVisibleHidden from './examples/overflowVisibleHidden'
import flexboxWrappedAlignContentRelativeOffsets from './examples/flexboxWrappedAlignContentRelativeOffsets'
import flexboxWrappedColumnRelativeOffsets from './examples/flexboxWrappedColumnRelativeOffsets'
import flexboxWrappedMainAxisRelativeOffsets from './examples/flexboxWrappedMainAxisRelativeOffsets'
import flexboxWrappedPercentRelativeOffsets from './examples/flexboxWrappedPercentRelativeOffsets'
import flexboxWrappedRelativeOffsets from './examples/flexboxWrappedRelativeOffsets'
import flexboxWrappedRelativeWrapReverse from './examples/flexboxWrappedRelativeWrapReverse'
import zindexBasic from './examples/zindexBasic'
import zindexNested from './examples/zindexNested'
import zindexGrid from './examples/zindexGrid'
import zindexEdgeCases from './examples/zindexEdgeCases'

export const LAYOUTS = {
    backgroundPosition,
    backgroundRepeat,
    backgroundRepeat2,
    backgroundSize,
    // backgroundImage,
    // backgroundImageBleeding,
    // backgroundImageUnset,
    borderRadius,
    borderRadiusCorners,
    borderRadiusOverlap,
    boxShadow,
    boxShadow2,
    boxShadow3,
    events,
    fontLetterSpacing,
    fontLineHeight,
    fontSize,
    fontTextAlign,
    fontTextShadow,
    fontTextStroke,
    fontParagraph,
    flexboxNestedDeepPaint,
    flexboxNestedDirections,
    flexboxNestedMargins,
    flexboxNestedPercentDimensions,
    flexboxNestedRelativeOffsets,
    flexboxNestedWrapGap,
    overflowScroll,
    overflowVisibleHidden,
    flexboxWrappedAlignContentRelativeOffsets,
    flexboxWrappedColumnRelativeOffsets,
    flexboxWrappedMainAxisRelativeOffsets,
    flexboxWrappedPercentRelativeOffsets,
    flexboxWrappedRelativeOffsets,
    flexboxWrappedRelativeWrapReverse,
    positionRelative,
    unitsRem,
    unitsViewport,
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
