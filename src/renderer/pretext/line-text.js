/** @typedef {import('./analysis.js').SegmentBreakKind} SegmentBreakKind */
/** @typedef {import('./layout.js').PreparedTextWithSegments} PreparedTextWithSegments */
import Segmenter from './segmenter.js'

/**
 * @type {Segmenter | null}
 */
let sharedGraphemeSegmenter = null
let sharedLineTextCaches = /** @type {WeakMap<PreparedTextWithSegments, Map<number, string[]>>} */ (new WeakMap())

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
 * @param {number} segmentIndex
 * @param {string[]} segments
 * @param {Map<number, string[]>} cache
 * @returns {string[]}
 */
function getSegmentGraphemes(
  segmentIndex,
  segments,
  cache,
) {
  let graphemes = cache.get(segmentIndex)
  if (graphemes !== undefined) return graphemes

  graphemes = []
  const graphemeSegmenter = getSharedGraphemeSegmenter()
  for (const gs of graphemeSegmenter.segment(segments[segmentIndex])) {
    graphemes.push(gs.segment)
  }
  cache.set(segmentIndex, graphemes)
  return graphemes
}

/**
 * @param {SegmentBreakKind[]} kinds
 * @param {number} startSegmentIndex
 * @param {number} endSegmentIndex
 * @returns {boolean}
 */
function lineHasDiscretionaryHyphen(
  kinds,
  startSegmentIndex,
  endSegmentIndex,
) {
  return (
    endSegmentIndex > startSegmentIndex &&
    kinds[endSegmentIndex - 1] === 'soft-hyphen'
  )
}

/**
 * @param {string} text
 * @param {string[]} graphemes
 * @param {number} startGraphemeIndex
 * @param {number} endGraphemeIndex
 * @returns {string}
 */
function appendSegmentGraphemeRange(
  text,
  graphemes,
  startGraphemeIndex,
  endGraphemeIndex,
) {
  for (let i = startGraphemeIndex; i < endGraphemeIndex; i++) {
    text += graphemes[i]
  }
  return text
}

/**
 * @param {PreparedTextWithSegments} prepared
 * @returns {Map<number, string[]>}
 */
export function getLineTextCache(prepared) {
  let cache = sharedLineTextCaches.get(prepared)
  if (cache !== undefined) return cache

  cache = /** @type {Map<number, string[]>} */ (new Map())
  sharedLineTextCaches.set(prepared, cache)
  return cache
}

/**
 * @param {PreparedTextWithSegments} prepared
 * @param {Map<number, string[]>} cache
 * @param {number} startSegmentIndex
 * @param {number} startGraphemeIndex
 * @param {number} endSegmentIndex
 * @param {number} endGraphemeIndex
 * @returns {string}
 */
export function buildLineTextFromRange(
  prepared,
  cache,
  startSegmentIndex,
  startGraphemeIndex,
  endSegmentIndex,
  endGraphemeIndex,
) {
  let text = ''
  const endsWithDiscretionaryHyphen = lineHasDiscretionaryHyphen(
    prepared.kinds,
    startSegmentIndex,
    endSegmentIndex,
  )

  for (let i = startSegmentIndex; i < endSegmentIndex; i++) {
    if (prepared.kinds[i] === 'soft-hyphen' || prepared.kinds[i] === 'hard-break') continue
    if (i === startSegmentIndex && startGraphemeIndex > 0) {
      const graphemes = getSegmentGraphemes(i, prepared.segments, cache)
      text = appendSegmentGraphemeRange(text, graphemes, startGraphemeIndex, graphemes.length)
    } else {
      text += prepared.segments[i]
    }
  }

  if (endGraphemeIndex > 0) {
    if (endsWithDiscretionaryHyphen) text += '-'
    const graphemes = getSegmentGraphemes(endSegmentIndex, prepared.segments, cache)
    text = appendSegmentGraphemeRange(
      text,
      graphemes,
      startSegmentIndex === endSegmentIndex ? startGraphemeIndex : 0,
      endGraphemeIndex,
    )
  } else if (endsWithDiscretionaryHyphen) {
    text += '-'
  }

  return text
}
