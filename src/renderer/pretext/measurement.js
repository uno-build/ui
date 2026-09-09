import { isCJK } from './analysis.js'
import Segmenter from './segmenter.js'

/**
 * @typedef {(text: string) => number} MeasureText
 */

/**
 * @typedef {{
 *   width: number
 *   containsCJK: boolean
 *   breakableFitMode?: BreakableFitMode
 *   breakableFitAdvances?: number[] | null
 * }} SegmentMetrics
 */

/**
 * @typedef {{
 *   lineFitEpsilon: number
 *   carryCJKAfterClosingQuote: boolean
 *   breakKeepAllAfterPunctuation: boolean
 *   preferPrefixWidthsForBreakableRuns: boolean
 * }} EngineProfile
 */

/**
 * @typedef {'sum-graphemes' | 'segment-prefixes' | 'pair-context'} BreakableFitMode
 */

/**
 * @type {EngineProfile}
 */
const ENGINE_PROFILE = {
  lineFitEpsilon: 0.005,
  carryCJKAfterClosingQuote: false,
  breakKeepAllAfterPunctuation: true,
  preferPrefixWidthsForBreakableRuns: false,
}

const MAX_PREFIX_FIT_GRAPHEMES = 96

/**
 * @type {Segmenter | null}
 */
let sharedGraphemeSegmenter = null

/**
 * @param {string} text
 * @param {Map<string, SegmentMetrics>} cache
 * @param {MeasureText} measure
 * @returns {SegmentMetrics}
 */
export function getSegmentMetrics(
  text,
  cache,
  measure,
) {
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

/**
 * @returns {EngineProfile}
 */
export function getEngineProfile() {
  return ENGINE_PROFILE
}

/**
 * @returns {Segmenter}
 */
function getSharedGraphemeSegmenter() {
  if (sharedGraphemeSegmenter === null) {
    sharedGraphemeSegmenter = new Segmenter(undefined, { granularity: 'grapheme' })
  }
  return sharedGraphemeSegmenter
}

/**
 * @param {string} text
 * @param {SegmentMetrics} metrics
 * @param {Map<string, SegmentMetrics>} cache
 * @param {MeasureText} measure
 * @param {BreakableFitMode} mode
 * @returns {number[] | null}
 */
export function getSegmentBreakableFitAdvances(
  text,
  metrics,
  cache,
  measure,
  mode,
) {
  if (metrics.breakableFitAdvances !== undefined && metrics.breakableFitMode === mode) {
    return metrics.breakableFitAdvances
  }
  metrics.breakableFitMode = mode

  const graphemeSegmenter = getSharedGraphemeSegmenter()
  /**
   * @type {string[]}
   */
  const graphemes = []
  for (const gs of graphemeSegmenter.segment(text)) {
    graphemes.push(gs.segment)
  }
  if (graphemes.length <= 1) {
    metrics.breakableFitAdvances = null
    return metrics.breakableFitAdvances
  }

  if (mode === 'sum-graphemes') {
    /**
     * @type {number[]}
     */
    const advances = []
    for (const grapheme of graphemes) {
      advances.push(getSegmentMetrics(grapheme, cache, measure).width)
    }
    metrics.breakableFitAdvances = advances
    return metrics.breakableFitAdvances
  }

  if (mode === 'pair-context' || graphemes.length > MAX_PREFIX_FIT_GRAPHEMES) {
    /**
     * @type {number[]}
     */
    const advances = []
    /**
     * @type {string | null}
     */
    let previousGrapheme = null
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

  /**
   * @type {number[]}
   */
  const advances = []
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
