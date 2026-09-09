// Text analysis and layout with caller-provided measurements.
//
//   prepareWithSegments(text, options) — segments text, measures each word
//     with options.measure, and caches widths. Call once when text first appears.
//   measureLineStats(prepared, maxWidth) — computes line count and maximum width.
//   layoutWithLines(prepared, maxWidth, lineHeight) — materializes renderable lines.
//
// i18n: the segmenter handles CJK per-character breaking and Unicode graphemes.
//   Punctuation merging: "better." measured as one unit (matches CSS behavior).
//   Trailing whitespace: hangs past line edge without triggering breaks (CSS behavior).
//   overflow-wrap: pre-measured grapheme widths enable character-level word breaking.

import {
  analyzeText,
  canContinueKeepAllTextRun,
  endsWithClosingQuote,
  isCJK,
  isNumericRunSegment,
  kinsokuEnd,
  kinsokuStart,
  leftStickyPunctuation,
} from './analysis.js'
/** @typedef {import('./analysis.js').SegmentBreakKind} SegmentBreakKind */
/** @typedef {import('./analysis.js').TextAnalysis} TextAnalysis */
/** @typedef {import('./analysis.js').WhiteSpaceMode} WhiteSpaceMode */
/** @typedef {import('./analysis.js').WordBreakMode} AnalysisWordBreakMode */
import {
  getSegmentBreakableFitAdvances,
  getEngineProfile,
  getSegmentMetrics,
} from './measurement.js'
/** @typedef {import('./measurement.js').BreakableFitMode} BreakableFitMode */
/** @typedef {import('./measurement.js').MeasureText} MeasureText */
/** @typedef {import('./measurement.js').SegmentMetrics} SegmentMetrics */
import {
  measurePreparedLineGeometry,
  walkPreparedLinesRaw,
} from './line-break.js'
import {
  buildLineTextFromRange,
  getLineTextCache,
} from './line-text.js'
import Segmenter from './segmenter.js'

/**
 * @type {Segmenter | null}
 */
let sharedGraphemeSegmenter = null

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
 * @typedef {{
 *   widths: number[] 
 *   lineEndFitAdvances: number[] 
 *   lineEndPaintAdvances: number[] 
 *   kinds: SegmentBreakKind[] 
 *   simpleLineWalkFastPath: boolean 
 *   breakableFitAdvances: (number[] | null)[] 
 *   breakablePreferredBreaks: (number[] | null)[] 
 *   letterSpacing: number 
 *   spacingGraphemeCounts: number[] 
 *   discretionaryHyphenWidth: number 
 *   tabStopAdvance: number 
 *   chunks: PreparedLineChunk[] 
 * }} PreparedCore
 */

// Manual-layout handle that exposes the structural segment data used by
// range/cursor APIs and custom rendering.
/**
 * @typedef {PreparedCore & {
 *   segments: string[] 
 * }} PreparedTextWithSegments
 */

/**
 * @typedef {{
 *   segmentIndex: number 
 *   graphemeIndex: number 
 * }} LayoutCursor
 */

/**
 * @typedef {{
 *   lineCount: number 
 *   height: number 
 * }} LayoutResult
 */

/**
 * @typedef {{
 *   lineCount: number
 *   maxLineWidth: number
 * }} LineStats
 */

/**
 * @typedef {{
 *   text: string 
 *   width: number 
 *   start: LayoutCursor 
 *   end: LayoutCursor 
 * }} LayoutLine
 */

/**
 * @typedef {LayoutResult & {
 *   lines: LayoutLine[] 
 * }} LayoutLinesResult
 */

/**
 * @typedef {AnalysisWordBreakMode} WordBreakMode
 */

/**
 * @typedef {{
 *   measure: MeasureText
 *   whiteSpace?: WhiteSpaceMode
 *   wordBreak?: WordBreakMode
 *   letterSpacing?: number
 * }} PrepareOptions
 */

// Internal hard-break chunk hint for the line walker. Not public because
// callers should not depend on the current chunking representation.
/**
 * @typedef {{
 *   startSegmentIndex: number
 *   endSegmentIndex: number
 *   consumedEndSegmentIndex: number
 * }} PreparedLineChunk
 */

/**
 * @returns {PreparedTextWithSegments}
 */
function createEmptyPrepared() {
  return {
    widths: [],
    lineEndFitAdvances: [],
    lineEndPaintAdvances: [],
    kinds: [],
    simpleLineWalkFastPath: true,
    breakableFitAdvances: [],
    breakablePreferredBreaks: [],
    letterSpacing: 0,
    spacingGraphemeCounts: [],
    discretionaryHyphenWidth: 0,
    tabStopAdvance: 0,
    chunks: [],
    segments: [],
  }
}

/**
 * @typedef {{
 *   text: string
 *   start: number
 * }} MeasuredTextUnit
 */

/**
 * @param {string} segText
 * @param {ReturnType<typeof getEngineProfile>} engineProfile
 * @returns {MeasuredTextUnit[]}
 */
function buildBaseCjkUnits(
  segText,
  engineProfile,
) {
  /**
   * @type {MeasuredTextUnit[]}
   */
  const units = []
  /**
   * @type {string[]}
   */
  let unitParts = []
  let unitStart = 0
  let unitContainsCJK = false
  let unitEndsWithClosingQuote = false
  let unitIsSingleKinsokuEnd = false

  /**
   * @returns {void}
   */
  function pushUnit() {
    if (unitParts.length === 0) return
    units.push({
      text: unitParts.length === 1 ? unitParts[0] : unitParts.join(''),
      start: unitStart,
    })
    unitParts = []
    unitContainsCJK = false
    unitEndsWithClosingQuote = false
    unitIsSingleKinsokuEnd = false
  }

  /**
   * @param {string} grapheme
   * @param {number} start
   * @param {boolean} graphemeContainsCJK
   * @returns {void}
   */
  function startUnit(grapheme, start, graphemeContainsCJK) {
    unitParts = [grapheme]
    unitStart = start
    unitContainsCJK = graphemeContainsCJK
    unitEndsWithClosingQuote = endsWithClosingQuote(grapheme)
    unitIsSingleKinsokuEnd = kinsokuEnd.has(grapheme)
  }

  /**
   * @param {string} grapheme
   * @param {boolean} graphemeContainsCJK
   * @returns {void}
   */
  function appendToUnit(grapheme, graphemeContainsCJK) {
    unitParts.push(grapheme)
    unitContainsCJK = unitContainsCJK || graphemeContainsCJK
    const graphemeEndsWithClosingQuote = endsWithClosingQuote(grapheme)
    if (grapheme.length === 1 && leftStickyPunctuation.has(grapheme)) {
      unitEndsWithClosingQuote = unitEndsWithClosingQuote || graphemeEndsWithClosingQuote
    } else {
      unitEndsWithClosingQuote = graphemeEndsWithClosingQuote
    }
    unitIsSingleKinsokuEnd = false
  }

  for (const gs of getSharedGraphemeSegmenter().segment(segText)) {
    const grapheme = gs.segment
    const graphemeContainsCJK = isCJK(grapheme)

    if (unitParts.length === 0) {
      startUnit(grapheme, gs.index, graphemeContainsCJK)
      continue
    }

    if (
      unitIsSingleKinsokuEnd ||
      kinsokuStart.has(grapheme) ||
      leftStickyPunctuation.has(grapheme) ||
      (engineProfile.carryCJKAfterClosingQuote &&
        graphemeContainsCJK &&
        unitEndsWithClosingQuote)
    ) {
      appendToUnit(grapheme, graphemeContainsCJK)
      continue
    }

    if (!unitContainsCJK && !graphemeContainsCJK) {
      appendToUnit(grapheme, graphemeContainsCJK)
      continue
    }

    pushUnit()
    startUnit(grapheme, gs.index, graphemeContainsCJK)
  }

  pushUnit()
  return units
}

/**
 * @param {string} segText
 * @param {MeasuredTextUnit[]} units
 * @param {boolean} breakAfterPunctuation
 * @returns {MeasuredTextUnit[]}
 */
function mergeKeepAllTextUnits(
  segText,
  units,
  breakAfterPunctuation,
) {
  if (units.length <= 1) return units

  /**
   * @type {MeasuredTextUnit[]}
   */
  const merged = []
  let groupStart = -1
  let groupContainsCJK = false

  /**
   * @param {number} start
   * @param {number} end
   * @returns {void}
   */
  function pushMergedUnit(start, end) {
    const sourceStart = units[start].start
    const sourceEnd = end < units.length ? units[end].start : segText.length

    merged.push({
      text: segText.slice(sourceStart, sourceEnd),
      start: sourceStart,
    })
  }

  /**
   * @param {number} end
   * @returns {void}
   */
  function flushGroup(end) {
    if (groupStart < 0) return

    if (groupContainsCJK) {
      if (groupStart + 1 === end) {
        merged.push(units[groupStart])
      } else {
        pushMergedUnit(groupStart, end)
      }
    } else {
      for (let i = groupStart; i < end; i++) merged.push(units[i])
    }

    groupStart = -1
    groupContainsCJK = false
  }

  for (let i = 0; i < units.length; i++) {
    const unit = units[i]
    if (
      groupStart >= 0 &&
      !canContinueKeepAllTextRun(units[i - 1].text, breakAfterPunctuation)
    ) {
      flushGroup(i)
    }
    if (groupStart < 0) groupStart = i
    groupContainsCJK = groupContainsCJK || isCJK(unit.text)
  }

  flushGroup(units.length)
  return merged
}

/**
 * @param {string} text
 * @param {SegmentBreakKind} kind
 * @returns {number}
 */
function countRenderedSpacingGraphemes(
  text,
  kind,
) {
  if (
    kind === 'zero-width-break' ||
    kind === 'soft-hyphen' ||
    kind === 'hard-break'
  ) {
    return 0
  }

  if (kind === 'tab') return 1

  let count = 0
  const graphemeSegmenter = getSharedGraphemeSegmenter()
  for (const _ of graphemeSegmenter.segment(text)) count++
  return count
}

/**
 * @param {string} grapheme
 * @returns {boolean}
 */
function isPreferredBreakGrapheme(grapheme) {
  return (
    grapheme === '-' ||
    grapheme === '\u058A' ||
    grapheme === '\u2010' ||
    grapheme === '\u2012' ||
    grapheme === '\u2013' ||
    grapheme === '\u2014'
  )
}

/**
 * @param {string} text
 * @returns {number[] | null}
 */
function getBreakablePreferredBreaks(text) {
  if (!/[-\u058A\u2010\u2012\u2013\u2014]/u.test(text)) return null

  /**
   * @type {number[]}
   */
  const breaks = []
  let graphemeIndex = 0
  for (const gs of getSharedGraphemeSegmenter().segment(text)) {
    graphemeIndex++
    if (isPreferredBreakGrapheme(gs.segment)) breaks.push(graphemeIndex)
  }

  return breaks.length === 0 ? null : breaks
}

/**
 * @param {number} width
 * @param {number} graphemeCount
 * @param {number} letterSpacing
 * @returns {number}
 */
function addInternalLetterSpacing(width, graphemeCount, letterSpacing) {
  return graphemeCount > 1 ? width + (graphemeCount - 1) * letterSpacing : width
}

/**
 * @param {TextAnalysis} analysis
 * @param {MeasureText} measure
 * @param {WordBreakMode} wordBreak
 * @param {number} letterSpacing
 * @returns {PreparedTextWithSegments}
 */
function measureAnalysis(
  analysis,
  measure,
  wordBreak,
  letterSpacing,
) {
  if (analysis.len === 0) return createEmptyPrepared()

  const engineProfile = getEngineProfile()
  const cache = /** @type {Map<string, SegmentMetrics>} */ (new Map())
  const discretionaryHyphenWidth =
    getSegmentMetrics('-', cache, measure).width +
    (letterSpacing === 0 ? 0 : letterSpacing * 2)
  const spaceWidth = getSegmentMetrics(' ', cache, measure).width
  const tabStopAdvance = spaceWidth * 8
  const hasLetterSpacing = letterSpacing !== 0

  /**
   * @type {number[]}
   */
  const widths = []
  /**
   * @type {number[]}
   */
  const lineEndFitAdvances = []
  /**
   * @type {number[]}
   */
  const lineEndPaintAdvances = []
  /**
   * @type {SegmentBreakKind[]}
   */
  const kinds = []
  let simpleLineWalkFastPath = !hasLetterSpacing
  /**
   * @type {(number[] | null)[]}
   */
  const breakableFitAdvances = []
  /**
   * @type {(number[] | null)[]}
   */
  const breakablePreferredBreaks = []
  /**
   * @type {number[]}
   */
  const spacingGraphemeCounts = []
  /**
   * @type {string[]}
   */
  const segments = []
  /**
   * @type {PreparedLineChunk[]}
   */
  const chunks = []
  let chunkStartSegmentIndex = 0

  /**
   * @param {string} text
   * @param {number} width
   * @param {number} lineEndFitAdvance
   * @param {number} lineEndPaintAdvance
   * @param {SegmentBreakKind} kind
   * @param {number[] | null} breakableFitAdvance
   * @param {number[] | null} breakablePreferredBreak
   * @param {number} spacingGraphemeCount
   * @returns {void}
   */
  function pushMeasuredSegment(
    text,
    width,
    lineEndFitAdvance,
    lineEndPaintAdvance,
    kind,
    breakableFitAdvance,
    breakablePreferredBreak,
    spacingGraphemeCount,
  ) {
    if (kind !== 'text' && kind !== 'space' && kind !== 'zero-width-break') {
      simpleLineWalkFastPath = false
    }
    widths.push(width)
    lineEndFitAdvances.push(lineEndFitAdvance)
    lineEndPaintAdvances.push(lineEndPaintAdvance)
    kinds.push(kind)
    breakableFitAdvances.push(breakableFitAdvance)
    breakablePreferredBreaks.push(breakablePreferredBreak)
    if (hasLetterSpacing) spacingGraphemeCounts.push(spacingGraphemeCount)
    segments.push(text)
  }

  /**
   * @param {string} text
   * @param {SegmentMetrics} textMetrics
   * @param {SegmentBreakKind} kind
   * @param {boolean} wordLike
   * @param {boolean} allowOverflowBreaks
   * @returns {void}
   */
  function pushMeasuredTextSegment(
    text,
    textMetrics,
    kind,
    wordLike,
    allowOverflowBreaks,
  ) {
    const spacingGraphemeCount = hasLetterSpacing
      ? countRenderedSpacingGraphemes(text, kind)
      : 0
    const width = addInternalLetterSpacing(
      textMetrics.width,
      spacingGraphemeCount,
      letterSpacing,
    )
    const baseLineEndFitAdvance =
      kind === 'space' || kind === 'preserved-space' || kind === 'zero-width-break'
        ? 0
        : width
    const lineEndFitAdvance =
      baseLineEndFitAdvance === 0
        ? 0
        : baseLineEndFitAdvance + (spacingGraphemeCount > 0 ? letterSpacing : 0)
    const lineEndPaintAdvance =
      kind === 'space' || kind === 'zero-width-break'
        ? 0
        : width

    if (allowOverflowBreaks && wordLike && text.length > 1) {
      /**
       * @type {BreakableFitMode}
       */
      let fitMode = 'sum-graphemes'
      if (letterSpacing !== 0) {
        fitMode = 'segment-prefixes'
      } else if (isNumericRunSegment(text)) {
        fitMode = 'pair-context'
      } else if (engineProfile.preferPrefixWidthsForBreakableRuns) {
        fitMode = 'segment-prefixes'
      }
      const fitAdvances = getSegmentBreakableFitAdvances(
        text,
        textMetrics,
        cache,
        measure,
        fitMode,
      )
      const preferredBreaks =
        fitAdvances === null || wordBreak === 'keep-all'
          ? null
          : getBreakablePreferredBreaks(text)
      pushMeasuredSegment(
        text,
        width,
        lineEndFitAdvance,
        lineEndPaintAdvance,
        kind,
        fitAdvances,
        preferredBreaks,
        spacingGraphemeCount,
      )
      return
    }

    pushMeasuredSegment(
      text,
      width,
      lineEndFitAdvance,
      lineEndPaintAdvance,
      kind,
      null,
      null,
      spacingGraphemeCount,
    )
  }

  for (let mi = 0; mi < analysis.len; mi++) {
    const segText = analysis.texts[mi]
    const segWordLike = analysis.isWordLike[mi]
    const segKind = analysis.kinds[mi]
    if (segKind === 'soft-hyphen') {
      pushMeasuredSegment(
        segText,
        0,
        discretionaryHyphenWidth,
        discretionaryHyphenWidth,
        segKind,
        null,
        null,
        0,
      )
      continue
    }

    if (segKind === 'hard-break') {
      const endSegmentIndex = widths.length
      pushMeasuredSegment(segText, 0, 0, 0, segKind, null, null, 0)
      chunks.push({
        startSegmentIndex: chunkStartSegmentIndex,
        endSegmentIndex,
        consumedEndSegmentIndex: widths.length,
      })
      chunkStartSegmentIndex = widths.length
      continue
    }

    if (segKind === 'tab') {
      pushMeasuredSegment(
        segText,
        0,
        0,
        0,
        segKind,
        null,
        null,
        hasLetterSpacing ? countRenderedSpacingGraphemes(segText, segKind) : 0,
      )
      continue
    }

    const segMetrics = getSegmentMetrics(segText, cache, measure)

    if (segKind === 'text' && segMetrics.containsCJK) {
      const baseUnits = buildBaseCjkUnits(segText, engineProfile)
      const measuredUnits = wordBreak === 'keep-all'
        ? mergeKeepAllTextUnits(segText, baseUnits, engineProfile.breakKeepAllAfterPunctuation)
        : baseUnits

      for (let i = 0; i < measuredUnits.length; i++) {
        const unit = measuredUnits[i]
        const unitMetrics = getSegmentMetrics(unit.text, cache, measure)
        pushMeasuredTextSegment(
          unit.text,
          unitMetrics,
          'text',
          segWordLike,
          wordBreak === 'keep-all' || !unitMetrics.containsCJK,
        )
      }
      continue
    }

    pushMeasuredTextSegment(segText, segMetrics, segKind, segWordLike, true)
  }

  if (chunkStartSegmentIndex < widths.length) {
    chunks.push({
      startSegmentIndex: chunkStartSegmentIndex,
      endSegmentIndex: widths.length,
      consumedEndSegmentIndex: widths.length,
    })
  }
  return {
    widths,
    lineEndFitAdvances,
    lineEndPaintAdvances,
    kinds,
    simpleLineWalkFastPath,
    breakableFitAdvances,
    breakablePreferredBreaks,
    letterSpacing,
    spacingGraphemeCounts,
    discretionaryHyphenWidth,
    tabStopAdvance,
    chunks,
    segments,
  }
}

/**
 * @param {string} text
 * @param {PrepareOptions} options
 * @returns {PreparedTextWithSegments}
 */
export function prepareWithSegments(text, options) {
  const wordBreak = options.wordBreak ?? 'normal'
  const letterSpacing = options.letterSpacing ?? 0
  const analysis = analyzeText(text, getEngineProfile(), options.whiteSpace, wordBreak)
  return measureAnalysis(analysis, options.measure, wordBreak, letterSpacing)
}

/**
 * @param {PreparedTextWithSegments} prepared
 * @param {Map<number, string[]>} cache
 * @param {number} width
 * @param {number} startSegmentIndex
 * @param {number} startGraphemeIndex
 * @param {number} endSegmentIndex
 * @param {number} endGraphemeIndex
 * @returns {LayoutLine}
 */
function createLayoutLine(
  prepared,
  cache,
  width,
  startSegmentIndex,
  startGraphemeIndex,
  endSegmentIndex,
  endGraphemeIndex,
) {
  return {
    text: buildLineTextFromRange(
      prepared,
      cache,
      startSegmentIndex,
      startGraphemeIndex,
      endSegmentIndex,
      endGraphemeIndex,
    ),
    width,
    start: {
      segmentIndex: startSegmentIndex,
      graphemeIndex: startGraphemeIndex,
    },
    end: {
      segmentIndex: endSegmentIndex,
      graphemeIndex: endGraphemeIndex,
    },
  }
}

/**
 * @param {PreparedTextWithSegments} prepared
 * @param {number} maxWidth
 * @returns {LineStats}
 */
export function measureLineStats(
  prepared,
  maxWidth,
) {
  return measurePreparedLineGeometry(prepared, maxWidth)
}

// Intrinsic-width helper for rich/userland layout work. This asks "how wide is
// the prepared text when container width is not the thing forcing wraps?".
// Explicit hard breaks still count, so this returns the widest forced line.
/**
 * @param {PreparedTextWithSegments} prepared
 * @returns {number}
 */
export function measureNaturalWidth(prepared) {
  let maxWidth = 0
  walkPreparedLinesRaw(prepared, Number.POSITIVE_INFINITY, width => {
    if (width > maxWidth) maxWidth = width
  })
  return maxWidth
}

// Rich layout API for callers that want the actual line contents and widths.
// Caller still supplies lineHeight at layout time.
/**
 * @param {PreparedTextWithSegments} prepared
 * @param {number} maxWidth
 * @param {number} lineHeight
 * @returns {LayoutLinesResult}
 */
export function layoutWithLines(prepared, maxWidth, lineHeight) {
  /**
   * @type {LayoutLine[]}
   */
  const lines = []
  if (prepared.widths.length === 0) return { lineCount: 0, height: 0, lines }

  const graphemeCache = getLineTextCache(prepared)
  const lineCount = walkPreparedLinesRaw(
    prepared,
    maxWidth,
    (width, startSegmentIndex, startGraphemeIndex, endSegmentIndex, endGraphemeIndex) => {
      lines.push(createLayoutLine(
        prepared,
        graphemeCache,
        width,
        startSegmentIndex,
        startGraphemeIndex,
        endSegmentIndex,
        endGraphemeIndex,
      ))
    },
  )

  return { lineCount, height: lineCount * lineHeight, lines }
}
