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
  type SegmentBreakKind,
  type TextAnalysis,
  type WhiteSpaceMode,
  type WordBreakMode as AnalysisWordBreakMode,
} from './analysis.js'
import {
  type BreakableFitMode,
  getSegmentBreakableFitAdvances,
  getEngineProfile,
  getSegmentMetrics,
  type MeasureText,
  type SegmentMetrics,
} from './measurement.js'
import {
  measurePreparedLineGeometry,
  walkPreparedLinesRaw,
} from './line-break.js'
import {
  buildLineTextFromRange,
  getLineTextCache,
} from './line-text.js'
import Segmenter from './segmenter.js'

let sharedGraphemeSegmenter: Segmenter | null = null

function getSharedGraphemeSegmenter(): Segmenter {
  if (sharedGraphemeSegmenter === null) {
    sharedGraphemeSegmenter = new Segmenter(undefined, { granularity: 'grapheme' })
  }
  return sharedGraphemeSegmenter
}

type PreparedCore = {
  widths: number[] // Segment widths, e.g. [42.5, 4.4, 37.2]
  lineEndFitAdvances: number[] // Width contribution when a line ends after this segment
  lineEndPaintAdvances: number[] // Painted contribution before terminal line-end letter-spacing
  kinds: SegmentBreakKind[] // Break behavior per segment, e.g. ['text', 'space', 'text']
  simpleLineWalkFastPath: boolean // Normal text can use the simpler old line walker across all layout APIs
  breakableFitAdvances: (number[] | null)[] // Per-grapheme fit advances for breakable segments, else null
  breakablePreferredBreaks: (number[] | null)[] // Preferred grapheme break ends inside breakable segments, else null
  letterSpacing: number // Extra advance between rendered graphemes on the same line
  spacingGraphemeCounts: number[] // Rendered grapheme counts for letter-spacing gaps; empty when letterSpacing is 0
  discretionaryHyphenWidth: number // Visible width added when a soft hyphen is chosen as the break
  tabStopAdvance: number // Absolute advance between tab stops for pre-wrap tab segments
  discretionaryHyphenWidths?: number[]
  tabStopAdvances?: number[]
  tabTrailingLetterSpacings?: number[]
  chunks: PreparedLineChunk[] // Precompiled hard-break chunks for line walking
}

// Manual-layout handle that exposes the structural segment data used by
// range/cursor APIs and custom rendering.
export type PreparedTextWithSegments = PreparedCore & {
  segments: string[] // Segment text aligned with the parallel arrays, e.g. ['hello', ' ', 'world']
}

export type StyledTextGrapheme = {
  text: string
  runIndex: number
  advance: number
}

export type PreparedStyledTextWithSegments = PreparedTextWithSegments & {
  styledGraphemes: StyledTextGrapheme[][]
  segmentRunIndexes: number[]
}

export type LayoutCursor = {
  segmentIndex: number // Segment index in `segments`
  graphemeIndex: number // Grapheme index within that segment; `0` at segment boundaries
}

export type LayoutResult = {
  lineCount: number // Number of wrapped lines, e.g. 3
  height: number // Total block height, e.g. lineCount * lineHeight = 57
}

export type LineStats = {
  lineCount: number
  maxLineWidth: number
}

export type LayoutLine = {
  text: string // Full text content of this line, e.g. 'hello world'
  width: number // Measured width of this line, e.g. 87.5
  start: LayoutCursor // Inclusive start cursor in prepared segments/graphemes
  end: LayoutCursor // Exclusive end cursor in prepared segments/graphemes
}

export type LayoutLinesResult = LayoutResult & {
  lines: LayoutLine[] // Per-line text/width pairs for custom rendering
}

export type WordBreakMode = AnalysisWordBreakMode

export type PrepareOptions = {
  measure: MeasureText
  whiteSpace?: WhiteSpaceMode
  wordBreak?: WordBreakMode
  letterSpacing?: number
}

export type StyledPrepareRun = {
  text: string
  measure: MeasureText
  letterSpacing: number
}

// Internal hard-break chunk hint for the line walker. Not public because
// callers should not depend on the current chunking representation.
type PreparedLineChunk = {
  startSegmentIndex: number
  endSegmentIndex: number
  consumedEndSegmentIndex: number
}

function createEmptyPrepared(): PreparedTextWithSegments {
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

type MeasuredTextUnit = {
  text: string
  start: number
}

function buildBaseCjkUnits(
  segText: string,
  engineProfile: ReturnType<typeof getEngineProfile>,
): MeasuredTextUnit[] {
  const units: MeasuredTextUnit[] = []
  let unitParts: string[] = []
  let unitStart = 0
  let unitContainsCJK = false
  let unitEndsWithClosingQuote = false
  let unitIsSingleKinsokuEnd = false

  function pushUnit(): void {
    if (unitParts.length === 0) return
    units.push({
      text: unitParts.length === 1 ? unitParts[0]! : unitParts.join(''),
      start: unitStart,
    })
    unitParts = []
    unitContainsCJK = false
    unitEndsWithClosingQuote = false
    unitIsSingleKinsokuEnd = false
  }

  function startUnit(grapheme: string, start: number, graphemeContainsCJK: boolean): void {
    unitParts = [grapheme]
    unitStart = start
    unitContainsCJK = graphemeContainsCJK
    unitEndsWithClosingQuote = endsWithClosingQuote(grapheme)
    unitIsSingleKinsokuEnd = kinsokuEnd.has(grapheme)
  }

  function appendToUnit(grapheme: string, graphemeContainsCJK: boolean): void {
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

function mergeKeepAllTextUnits(
  segText: string,
  units: MeasuredTextUnit[],
  breakAfterPunctuation: boolean,
): MeasuredTextUnit[] {
  if (units.length <= 1) return units

  const merged: MeasuredTextUnit[] = []
  let groupStart = -1
  let groupContainsCJK = false

  function pushMergedUnit(start: number, end: number): void {
    const sourceStart = units[start]!.start
    const sourceEnd = end < units.length ? units[end]!.start : segText.length

    merged.push({
      text: segText.slice(sourceStart, sourceEnd),
      start: sourceStart,
    })
  }

  function flushGroup(end: number): void {
    if (groupStart < 0) return

    if (groupContainsCJK) {
      if (groupStart + 1 === end) {
        merged.push(units[groupStart]!)
      } else {
        pushMergedUnit(groupStart, end)
      }
    } else {
      for (let i = groupStart; i < end; i++) merged.push(units[i]!)
    }

    groupStart = -1
    groupContainsCJK = false
  }

  for (let i = 0; i < units.length; i++) {
    const unit = units[i]!
    if (
      groupStart >= 0 &&
      !canContinueKeepAllTextRun(units[i - 1]!.text, breakAfterPunctuation)
    ) {
      flushGroup(i)
    }
    if (groupStart < 0) groupStart = i
    groupContainsCJK = groupContainsCJK || isCJK(unit.text)
  }

  flushGroup(units.length)
  return merged
}

function countRenderedSpacingGraphemes(
  text: string,
  kind: SegmentBreakKind,
): number {
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

function isPreferredBreakGrapheme(grapheme: string): boolean {
  return (
    grapheme === '-' ||
    grapheme === '\u058A' ||
    grapheme === '\u2010' ||
    grapheme === '\u2012' ||
    grapheme === '\u2013' ||
    grapheme === '\u2014'
  )
}

function getBreakablePreferredBreaks(text: string): number[] | null {
  if (!/[-\u058A\u2010\u2012\u2013\u2014]/u.test(text)) return null

  const breaks: number[] = []
  let graphemeIndex = 0
  for (const gs of getSharedGraphemeSegmenter().segment(text)) {
    graphemeIndex++
    if (isPreferredBreakGrapheme(gs.segment)) breaks.push(graphemeIndex)
  }

  return breaks.length === 0 ? null : breaks
}

function addInternalLetterSpacing(width: number, graphemeCount: number, letterSpacing: number): number {
  return graphemeCount > 1 ? width + (graphemeCount - 1) * letterSpacing : width
}

function measureAnalysis(
  analysis: TextAnalysis,
  measure: MeasureText,
  wordBreak: WordBreakMode,
  letterSpacing: number,
): PreparedTextWithSegments {
  if (analysis.len === 0) return createEmptyPrepared()

  const engineProfile = getEngineProfile()
  const cache = new Map<string, SegmentMetrics>()
  const discretionaryHyphenWidth =
    getSegmentMetrics('-', cache, measure).width +
    (letterSpacing === 0 ? 0 : letterSpacing * 2)
  const spaceWidth = getSegmentMetrics(' ', cache, measure).width
  const tabStopAdvance = spaceWidth * 8
  const hasLetterSpacing = letterSpacing !== 0

  const widths: number[] = []
  const lineEndFitAdvances: number[] = []
  const lineEndPaintAdvances: number[] = []
  const kinds: SegmentBreakKind[] = []
  let simpleLineWalkFastPath = !hasLetterSpacing
  const breakableFitAdvances: (number[] | null)[] = []
  const breakablePreferredBreaks: (number[] | null)[] = []
  const spacingGraphemeCounts: number[] = []
  const segments: string[] = []
  const chunks: PreparedLineChunk[] = []
  let chunkStartSegmentIndex = 0

  function pushMeasuredSegment(
    text: string,
    width: number,
    lineEndFitAdvance: number,
    lineEndPaintAdvance: number,
    kind: SegmentBreakKind,
    breakableFitAdvance: number[] | null,
    breakablePreferredBreak: number[] | null,
    spacingGraphemeCount: number,
  ): void {
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

  function pushMeasuredTextSegment(
    text: string,
    textMetrics: SegmentMetrics,
    kind: SegmentBreakKind,
    wordLike: boolean,
    allowOverflowBreaks: boolean,
  ): void {
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
      let fitMode: BreakableFitMode = 'sum-graphemes'
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
    const segText = analysis.texts[mi]!
    const segWordLike = analysis.isWordLike[mi]!
    const segKind = analysis.kinds[mi]!
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
        const unit = measuredUnits[i]!
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

export function prepareWithSegments(text: string, options: PrepareOptions): PreparedTextWithSegments {
  const wordBreak = options.wordBreak ?? 'normal'
  const letterSpacing = options.letterSpacing ?? 0
  const analysis = analyzeText(text, getEngineProfile(), options.whiteSpace, wordBreak)
  return measureAnalysis(analysis, options.measure, wordBreak, letterSpacing)
}

export function prepareWithStyledRuns(
  runs: StyledPrepareRun[],
  options: Pick<PrepareOptions, 'wordBreak'> = {},
): PreparedStyledTextWithSegments {
  const { text, runIndexes } = normalizeStyledRuns(runs)
  const wordBreak = options.wordBreak ?? 'normal'
  const analysis = analyzeText(text, getEngineProfile(), 'pre-wrap', wordBreak)
  if (analysis.len === 0) {
    return {
      ...createEmptyPrepared(),
      discretionaryHyphenWidths: [],
      tabStopAdvances: [],
      tabTrailingLetterSpacings: [],
      styledGraphemes: [],
      segmentRunIndexes: [],
    }
  }

  const engineProfile = getEngineProfile()
  const widths: number[] = []
  const lineEndFitAdvances: number[] = []
  const lineEndPaintAdvances: number[] = []
  const kinds: SegmentBreakKind[] = []
  const breakableFitAdvances: (number[] | null)[] = []
  const breakablePreferredBreaks: (number[] | null)[] = []
  const segments: string[] = []
  const styledGraphemes: StyledTextGrapheme[][] = []
  const segmentRunIndexes: number[] = []
  const discretionaryHyphenWidths: number[] = []
  const tabStopAdvances: number[] = []
  const tabTrailingLetterSpacings: number[] = []
  const chunks: PreparedLineChunk[] = []
  let simpleLineWalkFastPath = true
  let chunkStartSegmentIndex = 0

  function getRunIndex(sourceStart: number): number {
    return runIndexes[sourceStart] ?? Math.max(0, runs.length - 1)
  }

  function getGraphemes(segmentText: string, sourceStart: number, kind: SegmentBreakKind): StyledTextGrapheme[] {
    if (kind === 'hard-break' || kind === 'soft-hyphen' || kind === 'zero-width-break') return []

    const graphemes: StyledTextGrapheme[] = []
    for (const gs of getSharedGraphemeSegmenter().segment(segmentText)) {
      const runIndex = getRunIndex(sourceStart + gs.index)
      const run = runs[runIndex]!
      const advance = kind === 'tab' ? 0 : run.measure(gs.segment) + run.letterSpacing
      graphemes.push({ text: gs.segment, runIndex, advance })
    }
    return graphemes
  }

  function pushSegment(
    segmentText: string,
    sourceStart: number,
    kind: SegmentBreakKind,
    wordLike: boolean,
    allowOverflowBreaks: boolean,
  ): void {
    if (kind !== 'text' && kind !== 'space' && kind !== 'zero-width-break') {
      simpleLineWalkFastPath = false
    }

    const graphemes = getGraphemes(segmentText, sourceStart, kind)
    const advances = graphemes.map((grapheme) => grapheme.advance)
    const width = advances.reduce((sum, advance) => sum + advance, 0)
    const lineEndFitAdvance =
      kind === 'space' || kind === 'preserved-space' || kind === 'zero-width-break' ? 0 : width
    const lineEndPaintAdvance = kind === 'space' || kind === 'zero-width-break' ? 0 : width
    const breakable = allowOverflowBreaks && wordLike && graphemes.length > 1
    let discretionaryHyphenWidth = 0
    let tabStopAdvance = 0
    let tabTrailingLetterSpacing = 0

    if (kind === 'soft-hyphen') {
      const run = runs[getRunIndex(sourceStart)]!
      discretionaryHyphenWidth = run.measure('-') + run.letterSpacing * 2
    } else if (kind === 'tab') {
      const run = runs[getRunIndex(sourceStart)]!
      tabStopAdvance = run.measure(' ') * 8
      tabTrailingLetterSpacing = run.letterSpacing
    }

    widths.push(width)
    lineEndFitAdvances.push(kind === 'soft-hyphen' ? discretionaryHyphenWidth : lineEndFitAdvance)
    lineEndPaintAdvances.push(kind === 'soft-hyphen' ? discretionaryHyphenWidth : lineEndPaintAdvance)
    kinds.push(kind)
    breakableFitAdvances.push(breakable ? advances : null)
    breakablePreferredBreaks.push(breakable && wordBreak !== 'keep-all' ? getBreakablePreferredBreaks(segmentText) : null)
    segments.push(segmentText)
    styledGraphemes.push(graphemes)
    segmentRunIndexes.push(getRunIndex(sourceStart))
    discretionaryHyphenWidths.push(discretionaryHyphenWidth)
    tabStopAdvances.push(tabStopAdvance)
    tabTrailingLetterSpacings.push(tabTrailingLetterSpacing)
  }

  for (let index = 0; index < analysis.len; index++) {
    const segmentText = analysis.texts[index]!
    const segmentStart = analysis.starts[index]!
    const segmentKind = analysis.kinds[index]!
    const segmentWordLike = analysis.isWordLike[index]!

    if (segmentKind === 'hard-break') {
      const endSegmentIndex = widths.length
      pushSegment(segmentText, segmentStart, segmentKind, segmentWordLike, false)
      chunks.push({
        startSegmentIndex: chunkStartSegmentIndex,
        endSegmentIndex,
        consumedEndSegmentIndex: widths.length,
      })
      chunkStartSegmentIndex = widths.length
      continue
    }

    if (segmentKind === 'text' && isCJK(segmentText)) {
      const baseUnits = buildBaseCjkUnits(segmentText, engineProfile)
      const measuredUnits = wordBreak === 'keep-all'
        ? mergeKeepAllTextUnits(segmentText, baseUnits, engineProfile.breakKeepAllAfterPunctuation)
        : baseUnits

      for (const unit of measuredUnits) {
        pushSegment(
          unit.text,
          segmentStart + unit.start,
          'text',
          segmentWordLike,
          wordBreak === 'keep-all' || !isCJK(unit.text),
        )
      }
      continue
    }

    pushSegment(segmentText, segmentStart, segmentKind, segmentWordLike, true)
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
    letterSpacing: 0,
    spacingGraphemeCounts: [],
    discretionaryHyphenWidth: 0,
    tabStopAdvance: 0,
    discretionaryHyphenWidths,
    tabStopAdvances,
    tabTrailingLetterSpacings,
    chunks,
    segments,
    styledGraphemes,
    segmentRunIndexes,
  }
}

function normalizeStyledRuns(runs: StyledPrepareRun[]) {
  const source = runs.map((run) => run.text).join('')
  const sourceRunIndexes: number[] = []
  for (let runIndex = 0; runIndex < runs.length; runIndex++) {
    sourceRunIndexes.push(...new Array(runs[runIndex]!.text.length).fill(runIndex))
  }

  let text = ''
  const runIndexes: number[] = []
  for (let index = 0; index < source.length; index++) {
    const character = source[index]!
    const runIndex = sourceRunIndexes[index]!
    if (character === '\r') {
      if (source[index + 1] === '\n') index++
      text += '\n'
      runIndexes.push(runIndex)
      continue
    }
    if (character === '\f') {
      text += '\n'
      runIndexes.push(runIndex)
      continue
    }

    text += character
    runIndexes.push(runIndex)
  }

  return { text, runIndexes }
}

export function getStyledLineGraphemes(
  prepared: PreparedStyledTextWithSegments,
  line: LayoutLine,
): StyledTextGrapheme[] {
  const graphemes: StyledTextGrapheme[] = []
  const startSegmentIndex = line.start.segmentIndex
  const endSegmentIndex = line.end.segmentIndex

  for (let index = startSegmentIndex; index < endSegmentIndex; index++) {
    const kind = prepared.kinds[index]!
    if (kind === 'soft-hyphen' || kind === 'hard-break') continue

    const segmentGraphemes = prepared.styledGraphemes[index]!
    const start = index === startSegmentIndex ? line.start.graphemeIndex : 0
    graphemes.push(...segmentGraphemes.slice(start))
  }

  if (line.end.graphemeIndex > 0) {
    const start = startSegmentIndex === endSegmentIndex ? line.start.graphemeIndex : 0
    graphemes.push(...prepared.styledGraphemes[endSegmentIndex]!.slice(start, line.end.graphemeIndex))
  } else if (
    endSegmentIndex > startSegmentIndex &&
    prepared.kinds[endSegmentIndex - 1] === 'soft-hyphen'
  ) {
    const segmentIndex = endSegmentIndex - 1
    graphemes.push({
      text: '-',
      runIndex: prepared.segmentRunIndexes[segmentIndex]!,
      advance: prepared.discretionaryHyphenWidths![segmentIndex]!,
    })
  }

  return graphemes
}

function createLayoutLine(
  prepared: PreparedTextWithSegments,
  cache: Map<number, string[]>,
  width: number,
  startSegmentIndex: number,
  startGraphemeIndex: number,
  endSegmentIndex: number,
  endGraphemeIndex: number,
): LayoutLine {
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

export function measureLineStats(
  prepared: PreparedTextWithSegments,
  maxWidth: number,
): LineStats {
  return measurePreparedLineGeometry(prepared, maxWidth)
}

// Intrinsic-width helper for rich/userland layout work. This asks "how wide is
// the prepared text when container width is not the thing forcing wraps?".
// Explicit hard breaks still count, so this returns the widest forced line.
export function measureNaturalWidth(prepared: PreparedTextWithSegments): number {
  let maxWidth = 0
  walkPreparedLinesRaw(prepared, Number.POSITIVE_INFINITY, width => {
    if (width > maxWidth) maxWidth = width
  })
  return maxWidth
}

// Rich layout API for callers that want the actual line contents and widths.
// Caller still supplies lineHeight at layout time.
export function layoutWithLines(prepared: PreparedTextWithSegments, maxWidth: number, lineHeight: number): LayoutLinesResult {
  const lines: LayoutLine[] = []
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
