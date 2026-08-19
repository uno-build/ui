import borderRadius from './examples/borderRadius'
import borderRadiusCorners from './examples/borderRadiusCorners'
import borderRadiusOverlap from './examples/borderRadiusOverlap'
import boxShadow from './examples/boxShadow'
import boxShadow2 from './examples/boxShadow2'
import boxShadow3 from './examples/boxShadow3'
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
import scroll from './examples/scroll'
import fontTextShadow from './examples/fontTextShadow'
import fontTextStroke from './examples/fontTextStroke'
import nestedDeepPaint from './examples/nestedDeepPaint'
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
    backgroundPosition,
    backgroundRepeat,
    backgroundRepeat2,
    backgroundSize,
    backgroundImage,
    backgroundImageBleeding,
    backgroundImageUnset,
    borderRadius,
    borderRadiusCorners,
    borderRadiusOverlap,
    boxShadow,
    boxShadow2,
    boxShadow3,
    fontLetterSpacing,
    fontLineHeight,
    fontSize,
    fontTextAlign,
    scroll,
    fontTextShadow,
    fontTextStroke,
    fontParagraph,
    nestedDeepPaint,
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
    unitsRem,
    unitsViewport,
    zindexBasic,
    zindexNested,
    zindexGrid,
    zindexEdgeCases,
}

export const layoutNames = Object.keys(LAYOUTS).sort((a, b) => a.localeCompare(b))
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
