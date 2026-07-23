import { isCJK } from './analysis.js'
import Segmenter from './segmenter.js'

export type MeasureText = (text: string) => number

export type SegmentMetrics = {
  width: number
  containsCJK: boolean
  breakableFitMode?: BreakableFitMode
  breakableFitAdvances?: number[] | null
}

export type EngineProfile = {
  lineFitEpsilon: number
  carryCJKAfterClosingQuote: boolean
  breakKeepAllAfterPunctuation: boolean
  preferPrefixWidthsForBreakableRuns: boolean
}

export type BreakableFitMode = 'sum-graphemes' | 'segment-prefixes' | 'pair-context'

const ENGINE_PROFILE: EngineProfile = {
  lineFitEpsilon: 0.005,
  carryCJKAfterClosingQuote: false,
  breakKeepAllAfterPunctuation: true,
  preferPrefixWidthsForBreakableRuns: false,
}

const MAX_PREFIX_FIT_GRAPHEMES = 96

let sharedGraphemeSegmenter: Segmenter | null = null

export function getSegmentMetrics(
  text: string,
  cache: Map<string, SegmentMetrics>,
  measure: MeasureText,
): SegmentMetrics {
  let metrics = cache.get(text)
  if (metrics === undefined) {
    metrics = {
      width: measure(text),
      containsCJK: isCJK(text),
    }
    cache.set(text, metrics)
  }
  return metrics
}

export function getEngineProfile(): EngineProfile {
  return ENGINE_PROFILE
}

function getSharedGraphemeSegmenter(): Segmenter {
  if (sharedGraphemeSegmenter === null) {
    sharedGraphemeSegmenter = new Segmenter(undefined, { granularity: 'grapheme' })
  }
  return sharedGraphemeSegmenter
}

export function getSegmentBreakableFitAdvances(
  text: string,
  metrics: SegmentMetrics,
  cache: Map<string, SegmentMetrics>,
  measure: MeasureText,
  mode: BreakableFitMode,
): number[] | null {
  if (metrics.breakableFitAdvances !== undefined && metrics.breakableFitMode === mode) {
    return metrics.breakableFitAdvances
  }
  metrics.breakableFitMode = mode

  const graphemeSegmenter = getSharedGraphemeSegmenter()
  const graphemes: string[] = []
  for (const gs of graphemeSegmenter.segment(text)) {
    graphemes.push(gs.segment)
  }
  if (graphemes.length <= 1) {
    metrics.breakableFitAdvances = null
    return metrics.breakableFitAdvances
  }

  if (mode === 'sum-graphemes') {
    const advances: number[] = []
    for (const grapheme of graphemes) {
      advances.push(getSegmentMetrics(grapheme, cache, measure).width)
    }
    metrics.breakableFitAdvances = advances
    return metrics.breakableFitAdvances
  }

  if (mode === 'pair-context' || graphemes.length > MAX_PREFIX_FIT_GRAPHEMES) {
    const advances: number[] = []
    let previousGrapheme: string | null = null
    let previousWidth = 0

    for (const grapheme of graphemes) {
      const currentWidth = getSegmentMetrics(grapheme, cache, measure).width

      if (previousGrapheme === null) {
        advances.push(currentWidth)
      } else {
        const pairWidth = getSegmentMetrics(previousGrapheme + grapheme, cache, measure).width
        advances.push(pairWidth - previousWidth)
      }

      previousGrapheme = grapheme
      previousWidth = currentWidth
    }

    metrics.breakableFitAdvances = advances
    return metrics.breakableFitAdvances
  }

  const advances: number[] = []
  let prefix = ''
  let prefixWidth = 0

  for (const grapheme of graphemes) {
    prefix += grapheme
    const nextPrefixWidth = getSegmentMetrics(prefix, cache, measure).width
    advances.push(nextPrefixWidth - prefixWidth)
    prefixWidth = nextPrefixWidth
  }

  metrics.breakableFitAdvances = advances
  return metrics.breakableFitAdvances
}

export function clearMeasurementCaches(): void {
  sharedGraphemeSegmenter = null
}
