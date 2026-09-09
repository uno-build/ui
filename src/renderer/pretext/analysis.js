import Segmenter from './segmenter.js'

/**
 * @typedef {'normal' | 'pre-wrap'} WhiteSpaceMode
 */
/**
 * @typedef {'normal' | 'keep-all'} WordBreakMode
 */

/**
 * @typedef {| 'text'
 *   | 'space'
 *   | 'preserved-space'
 *   | 'tab'
 *   | 'glue'
 *   | 'zero-width-break'
 *   | 'soft-hyphen'
 *   | 'hard-break'} SegmentBreakKind
 */

/**
 * @typedef {{
 *   text: string
 *   isWordLike: boolean
 *   kind: SegmentBreakKind
 *   start: number
 * }} SegmentationPiece
 */

/**
 * @typedef {{
 *   len: number
 *   texts: string[]
 *   isWordLike: boolean[]
 *   kinds: SegmentBreakKind[]
 *   starts: number[]
 * }} MergedSegmentation
 */

/**
 * @typedef {{ normalized: string } & MergedSegmentation} TextAnalysis
 */

/**
 * @typedef {{
 *   carryCJKAfterClosingQuote: boolean
 *   breakKeepAllAfterPunctuation: boolean
 * }} AnalysisProfile
 */

const collapsibleWhitespaceRunRe = /[ \t\n\r\f]+/g
const needsWhitespaceNormalizationRe = /[\t\n\r\f]| {2,}|^ | $/

/**
 * @typedef {{
 *   mode: WhiteSpaceMode
 *   preserveOrdinarySpaces: boolean
 *   preserveHardBreaks: boolean
 * }} WhiteSpaceProfile
 */

/**
 * @param {WhiteSpaceMode} [whiteSpace]
 * @returns {WhiteSpaceProfile}
 */
function getWhiteSpaceProfile(whiteSpace) {
  const mode = whiteSpace ?? 'normal'
  return mode === 'pre-wrap'
    ? { mode, preserveOrdinarySpaces: true, preserveHardBreaks: true }
    : { mode, preserveOrdinarySpaces: false, preserveHardBreaks: false }
}

/**
 * @param {string} text
 * @returns {string}
 */
export function normalizeWhitespaceNormal(text) {
  if (!needsWhitespaceNormalizationRe.test(text)) return text

  let normalized = text.replace(collapsibleWhitespaceRunRe, ' ')
  if (normalized.charCodeAt(0) === 0x20) {
    normalized = normalized.slice(1)
  }
  if (normalized.length > 0 && normalized.charCodeAt(normalized.length - 1) === 0x20) {
    normalized = normalized.slice(0, -1)
  }
  return normalized
}

/**
 * @param {string} text
 * @returns {string}
 */
function normalizeWhitespacePreWrap(text) {
  if (!/[\r\f]/.test(text)) return text
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[\r\f]/g, '\n')
}

/**
 * @type {Segmenter | null}
 */
let sharedWordSegmenter = null

/**
 * @returns {Segmenter}
 */
function getSharedWordSegmenter() {
  if (sharedWordSegmenter === null) {
    sharedWordSegmenter = new Segmenter(undefined, { granularity: 'word' })
  }
  return sharedWordSegmenter
}

const arabicScriptRe = /\p{Script=Arabic}/u
const combiningMarkRe = /\p{M}/u
const decimalDigitRe = /\p{Nd}/u

/**
 * @param {string} text
 * @returns {boolean}
 */
function containsArabicScript(text) {
  return arabicScriptRe.test(text)
}

/**
 * @param {number} codePoint
 * @returns {boolean}
 */
function isCJKCodePoint(codePoint) {
  return (
    (codePoint >= 0x4E00 && codePoint <= 0x9FFF) ||
    (codePoint >= 0x3400 && codePoint <= 0x4DBF) ||
    (codePoint >= 0x20000 && codePoint <= 0x2A6DF) ||
    (codePoint >= 0x2A700 && codePoint <= 0x2B73F) ||
    (codePoint >= 0x2B740 && codePoint <= 0x2B81F) ||
    (codePoint >= 0x2B820 && codePoint <= 0x2CEAF) ||
    (codePoint >= 0x2CEB0 && codePoint <= 0x2EBEF) ||
    (codePoint >= 0x2EBF0 && codePoint <= 0x2EE5D) ||
    (codePoint >= 0x2F800 && codePoint <= 0x2FA1F) ||
    (codePoint >= 0x30000 && codePoint <= 0x3134F) ||
    (codePoint >= 0x31350 && codePoint <= 0x323AF) ||
    (codePoint >= 0x323B0 && codePoint <= 0x33479) ||
    (codePoint >= 0xF900 && codePoint <= 0xFAFF) ||
    (codePoint >= 0x3000 && codePoint <= 0x303F) ||
    (codePoint >= 0x3040 && codePoint <= 0x309F) ||
    (codePoint >= 0x30A0 && codePoint <= 0x30FF) ||
    (codePoint >= 0x3130 && codePoint <= 0x318F) ||
    (codePoint >= 0xAC00 && codePoint <= 0xD7AF) ||
    (codePoint >= 0xFF00 && codePoint <= 0xFFEF)
  )
}

/**
 * @param {string} s
 * @returns {boolean}
 */
export function isCJK(s) {
  for (let i = 0; i < s.length; i++) {
    const first = s.charCodeAt(i)
    if (first < 0x3000) continue

    if (first >= 0xD800 && first <= 0xDBFF && i + 1 < s.length) {
      const second = s.charCodeAt(i + 1)
      if (second >= 0xDC00 && second <= 0xDFFF) {
        const codePoint = ((first - 0xD800) << 10) + (second - 0xDC00) + 0x10000
        if (isCJKCodePoint(codePoint)) return true
        i++
        continue
      }
    }

    if (isCJKCodePoint(first)) return true
  }
  return false
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function endsWithLineStartProhibitedText(text) {
  const last = getLastCodePoint(text)
  return last !== null && (kinsokuStart.has(last) || leftStickyPunctuation.has(last))
}

const keepAllGlueChars = new Set([
  '\u00A0',
  '\u202F',
  '\u2060',
  '\uFEFF',
])

const keepAllDashBreakChars = new Set([
  '-',
  '\u2010',
  '\u2013',
  '\u2014',
])

/**
 * @param {string} text
 * @returns {boolean}
 */
function endsWithKeepAllGlueText(text) {
  const last = getLastCodePoint(text)
  return last !== null && keepAllGlueChars.has(last)
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function endsWithKeepAllDashBreakText(text) {
  const last = getLastCodePoint(text)
  return last !== null && keepAllDashBreakChars.has(last)
}

/**
 * @param {string} previousText
 * @param {boolean} breakAfterPunctuation
 * @returns {boolean}
 */
export function canContinueKeepAllTextRun(previousText, breakAfterPunctuation) {
  if (endsWithKeepAllGlueText(previousText)) return false
  if (!breakAfterPunctuation) return true
  if (endsWithLineStartProhibitedText(previousText)) return false
  if (endsWithKeepAllDashBreakText(previousText)) return false
  return true
}

export const kinsokuStart = new Set([
  '\uFF0C',
  '\uFF0E',
  '\uFF01',
  '\uFF1A',
  '\uFF1B',
  '\uFF1F',
  '\u3001',
  '\u3002',
  '\u30FB',
  '\uFF09',
  '\u3015',
  '\u3009',
  '\u300B',
  '\u300D',
  '\u300F',
  '\u3011',
  '\u3017',
  '\u3019',
  '\u301B',
  '\u30FC',
  '\u3005',
  '\u303B',
  '\u309D',
  '\u309E',
  '\u30FD',
  '\u30FE',
])

export const kinsokuEnd = new Set([
  '"',
  '(', '[', '{',
  '¡', '¿',
  '“', '‘', '‚', '„', '«', '‹',
  '\u2E18',
  '\uFF08',
  '\u3014',
  '\u3008',
  '\u300A',
  '\u300C',
  '\u300E',
  '\u3010',
  '\u3016',
  '\u3018',
  '\u301A',
])

const forwardStickyGlue = new Set([
  "'", '’',
])

export const leftStickyPunctuation = new Set([
  '.', ',', '!', '?', ':', ';',
  '\u060C',
  '\u061B',
  '\u061F',
  '\u0964',
  '\u0965',
  '\u104A',
  '\u104B',
  '\u104C',
  '\u104D',
  '\u104F',
  ')', ']', '}',
  '%',
  '"',
  '”', '’', '»', '›',
  '…',
])

const arabicNoSpaceTrailingPunctuation = new Set([
  ':',
  '.',
  '\u060C',
  '\u061B',
])

const myanmarMedialGlue = new Set([
  '\u104F',
])

const closingQuoteChars = new Set([
  '”', '’', '»', '›',
  '\u300D',
  '\u300F',
  '\u3011',
  '\u300B',
  '\u3009',
  '\u3015',
  '\uFF09',
])

/**
 * @param {string} segment
 * @returns {boolean}
 */
function isLeftStickyPunctuationSegment(segment) {
  if (isEscapedQuoteClusterSegment(segment)) return true
  let sawPunctuation = false
  for (const ch of segment) {
    if (leftStickyPunctuation.has(ch) || isLineBreakNumericAffix(ch)) {
      sawPunctuation = true
      continue
    }
    if (sawPunctuation && combiningMarkRe.test(ch)) continue
    return false
  }
  return sawPunctuation
}

/**
 * @param {string} segment
 * @returns {boolean}
 */
function isCJKLineStartProhibitedSegment(segment) {
  for (const ch of segment) {
    if (!kinsokuStart.has(ch) && !leftStickyPunctuation.has(ch)) return false
  }
  return segment.length > 0
}

/**
 * @param {string} segment
 * @returns {boolean}
 */
function isForwardStickyClusterSegment(segment) {
  if (isEscapedQuoteClusterSegment(segment)) return true
  for (const ch of segment) {
    if (
      !kinsokuEnd.has(ch) &&
      !forwardStickyGlue.has(ch) &&
      !combiningMarkRe.test(ch) &&
      !isLineBreakNumericAffix(ch)
    ) {
      return false
    }
  }
  return segment.length > 0
}

/**
 * @param {string} segment
 * @returns {boolean}
 */
function isEscapedQuoteClusterSegment(segment) {
  let sawQuote = false
  for (const ch of segment) {
    if (ch === '\\' || combiningMarkRe.test(ch)) continue
    if (kinsokuEnd.has(ch) || leftStickyPunctuation.has(ch) || forwardStickyGlue.has(ch)) {
      sawQuote = true
      continue
    }
    return false
  }
  return sawQuote
}

/**
 * @param {string} text
 * @param {number} end
 * @returns {number}
 */
function previousCodePointStart(text, end) {
  const last = end - 1
  if (last <= 0) return Math.max(last, 0)

  const lastCodeUnit = text.charCodeAt(last)
  if (lastCodeUnit < 0xDC00 || lastCodeUnit > 0xDFFF) return last

  const maybeHigh = last - 1
  if (maybeHigh < 0) return last

  const highCodeUnit = text.charCodeAt(maybeHigh)
  return highCodeUnit >= 0xD800 && highCodeUnit <= 0xDBFF ? maybeHigh : last
}

/**
 * @param {string} text
 * @returns {string | null}
 */
function getLastCodePoint(text) {
  if (text.length === 0) return null
  const start = previousCodePointStart(text, text.length)
  return text.slice(start)
}

/**
 * @param {string} text
 * @returns {string | null}
 */
function getFirstSignificantCodePoint(text) {
  for (const ch of text) {
    if (!combiningMarkRe.test(ch)) return ch
  }
  return null
}

/**
 * @param {string} text
 * @returns {string | null}
 */
function getLastSignificantCodePoint(text) {
  for (let end = text.length; end > 0;) {
    const start = previousCodePointStart(text, end)
    const ch = text.slice(start, end)
    if (!combiningMarkRe.test(ch)) return ch
    end = start
  }
  return null
}

// Unicode line-break PR/PO classes from UAX #14, stored as start/end pairs.
const lineBreakNumericAffixRanges = [
  0x0024, 0x0025, 0x002B, 0x002B, 0x005C, 0x005C, 0x00A2, 0x00A5, 0x00B0, 0x00B1,
  0x058F, 0x058F, 0x0609, 0x060B, 0x066A, 0x066A, 0x07FE, 0x07FF, 0x09F2, 0x09F3,
  0x09F9, 0x09FB, 0x0AF1, 0x0AF1, 0x0BF9, 0x0BF9, 0x0D79, 0x0D79, 0x0E3F, 0x0E3F,
  0x17DB, 0x17DB, 0x2030, 0x2037, 0x2057, 0x2057, 0x20A0, 0x20CF, 0x2103, 0x2103,
  0x2109, 0x2109, 0x2116, 0x2116, 0x2212, 0x2213, 0xA838, 0xA838, 0xFDFC, 0xFDFC,
  0xFE69, 0xFE6A, 0xFF04, 0xFF05, 0xFFE0, 0xFFE1, 0xFFE5, 0xFFE6,
  0x11FDD, 0x11FE0, 0x1E2FF, 0x1E2FF, 0x1ECAC, 0x1ECAC, 0x1ECB0, 0x1ECB0,
]

/**
 * @param {number} codePoint
 * @param {readonly number[]} ranges
 * @returns {boolean}
 */
function isCodePointInRanges(codePoint, ranges) {
  for (let i = 0; i < ranges.length; i += 2) {
    if (codePoint >= ranges[i] && codePoint <= ranges[i + 1]) return true
  }
  return false
}

/**
 * @param {string} ch
 * @returns {boolean}
 */
function isLineBreakNumericAffix(ch) {
  const codePoint = ch.codePointAt(0)
  return codePoint !== undefined && isCodePointInRanges(codePoint, lineBreakNumericAffixRanges)
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function endsWithLineBreakNumericAffix(text) {
  const last = getLastSignificantCodePoint(text)
  return last !== null && isLineBreakNumericAffix(last)
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function startsWithDecimalDigit(text) {
  const first = getFirstSignificantCodePoint(text)
  return first !== null && decimalDigitRe.test(first)
}

/**
 * @param {string} text
 * @returns {{ head: string, tail: string } | null}
 */
function splitTrailingForwardStickyCluster(text) {
  const chars = Array.from(text)
  let splitIndex = chars.length

  while (splitIndex > 0) {
    const ch = chars[splitIndex - 1]
    if (combiningMarkRe.test(ch)) {
      splitIndex--
      continue
    }
    if (kinsokuEnd.has(ch) || forwardStickyGlue.has(ch)) {
      splitIndex--
      continue
    }
    break
  }

  if (splitIndex <= 0 || splitIndex === chars.length) return null
  return {
    head: chars.slice(0, splitIndex).join(''),
    tail: chars.slice(splitIndex).join(''),
  }
}

/**
 * @param {string} text
 * @param {boolean} isWordLike
 * @param {SegmentBreakKind} kind
 * @returns {string | null}
 */
function getRepeatableSingleCharRunChar(
  text,
  isWordLike,
  kind,
) {
  return kind === 'text' && !isWordLike && text.length === 1 && text !== '-' && text !== '—'
    ? text
    : null
}

/**
 * @param {boolean} containsArabic
 * @param {string | null} lastCodePoint
 * @returns {boolean}
 */
function hasArabicNoSpacePunctuation(
  containsArabic,
  lastCodePoint,
) {
  return containsArabic && lastCodePoint !== null && arabicNoSpaceTrailingPunctuation.has(lastCodePoint)
}

/**
 * @param {string} segment
 * @returns {boolean}
 */
function endsWithMyanmarMedialGlue(segment) {
  const lastCodePoint = getLastCodePoint(segment)
  return lastCodePoint !== null && myanmarMedialGlue.has(lastCodePoint)
}

/**
 * @param {string} segment
 * @returns {{ space: string, marks: string } | null}
 */
function splitLeadingSpaceAndMarks(segment) {
  if (segment.length < 2 || segment[0] !== ' ') return null
  const marks = segment.slice(1)
  if (/^\p{M}+$/u.test(marks)) {
    return { space: ' ', marks }
  }
  return null
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function endsWithClosingQuote(text) {
  let end = text.length
  while (end > 0) {
    const start = previousCodePointStart(text, end)
    const ch = text.slice(start, end)
    if (closingQuoteChars.has(ch)) return true
    if (!leftStickyPunctuation.has(ch)) return false
    end = start
  }
  return false
}

/**
 * @param {string} ch
 * @param {WhiteSpaceProfile} whiteSpaceProfile
 * @returns {SegmentBreakKind}
 */
function classifySegmentBreakChar(ch, whiteSpaceProfile) {
  if (whiteSpaceProfile.preserveOrdinarySpaces || whiteSpaceProfile.preserveHardBreaks) {
    if (ch === ' ') return 'preserved-space'
    if (ch === '\t') return 'tab'
    if (whiteSpaceProfile.preserveHardBreaks && ch === '\n') return 'hard-break'
  }
  if (ch === ' ') return 'space'
  if (ch === '\u00A0' || ch === '\u202F' || ch === '\u2060' || ch === '\uFEFF') {
    return 'glue'
  }
  if (ch === '\u200B') return 'zero-width-break'
  if (ch === '\u00AD') return 'soft-hyphen'
  return 'text'
}

// All characters that classifySegmentBreakChar maps to a non-'text' kind.
const breakCharRe = /[\x20\t\n\xA0\xAD\u200B\u202F\u2060\uFEFF]/

/**
 * @param {string[]} parts
 * @returns {string}
 */
function joinTextParts(parts) {
  return parts.length === 1 ? parts[0] : parts.join('')
}

/**
 * @param {string[]} prefixParts
 * @param {string} tail
 * @returns {string}
 */
function joinReversedPrefixParts(prefixParts, tail) {
  /**
   * @type {string[]}
   */
  const parts = []
  for (let i = prefixParts.length - 1; i >= 0; i--) {
    parts.push(prefixParts[i])
  }
  parts.push(tail)
  return joinTextParts(parts)
}

/**
 * @param {string} segment
 * @param {boolean} isWordLike
 * @param {number} start
 * @param {WhiteSpaceProfile} whiteSpaceProfile
 * @returns {SegmentationPiece[]}
 */
function splitSegmentByBreakKind(
  segment,
  isWordLike,
  start,
  whiteSpaceProfile,
) {
  if (!breakCharRe.test(segment)) {
    return [{ text: segment, isWordLike, kind: 'text', start }]
  }

  /**
   * @type {SegmentationPiece[]}
   */
  const pieces = []
  /**
   * @type {SegmentBreakKind | null}
   */
  let currentKind = null
  /**
   * @type {string[]}
   */
  let currentTextParts = []
  let currentStart = start
  let currentWordLike = false
  let offset = 0

  for (const ch of segment) {
    const kind = classifySegmentBreakChar(ch, whiteSpaceProfile)
    const wordLike = kind === 'text' && isWordLike

    if (currentKind !== null && kind === currentKind && wordLike === currentWordLike) {
      currentTextParts.push(ch)
      offset += ch.length
      continue
    }

    if (currentKind !== null) {
      pieces.push({
        text: joinTextParts(currentTextParts),
        isWordLike: currentWordLike,
        kind: currentKind,
        start: currentStart,
      })
    }

    currentKind = kind
    currentTextParts = [ch]
    currentStart = start + offset
    currentWordLike = wordLike
    offset += ch.length
  }

  if (currentKind !== null) {
    pieces.push({
      text: joinTextParts(currentTextParts),
      isWordLike: currentWordLike,
      kind: currentKind,
      start: currentStart,
    })
  }

  return pieces
}

/**
 * @param {SegmentBreakKind} kind
 * @returns {boolean}
 */
function isTextRunBoundary(kind) {
  return (
    kind === 'space' ||
    kind === 'preserved-space' ||
    kind === 'zero-width-break' ||
    kind === 'hard-break'
  )
}

const urlSchemeSegmentRe = /^[A-Za-z][A-Za-z0-9+.-]*:$/

/**
 * @param {MergedSegmentation} segmentation
 * @param {number} index
 * @returns {boolean}
 */
function isUrlLikeRunStart(segmentation, index) {
  const text = segmentation.texts[index]
  if (text.startsWith('www.')) return true
  return (
    urlSchemeSegmentRe.test(text) &&
    index + 1 < segmentation.len &&
    segmentation.kinds[index + 1] === 'text' &&
    segmentation.texts[index + 1] === '//'
  )
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function isUrlQueryBoundarySegment(text) {
  return text.includes('?') && (text.includes('://') || text.startsWith('www.'))
}

/**
 * @param {MergedSegmentation} segmentation
 * @returns {MergedSegmentation}
 */
function mergeUrlRuns(segmentation) {
  /**
   * @type {string[]}
   */
  const texts = []
  /**
   * @type {boolean[]}
   */
  const isWordLike = []
  /**
   * @type {SegmentBreakKind[]}
   */
  const kinds = []
  /**
   * @type {number[]}
   */
  const starts = []

  for (let i = 0; i < segmentation.len; i++) {
    const start = segmentation.starts[i]
    let text = segmentation.texts[i]
    let wordLike = segmentation.isWordLike[i]
    const kind = segmentation.kinds[i]
    let queryStartOverride = -1

    if (kind === 'text' && isUrlLikeRunStart(segmentation, i)) {
      const urlParts = [text]
      let j = i + 1
      while (j < segmentation.len && !isTextRunBoundary(segmentation.kinds[j])) {
        if (queryStartOverride < 0 && isUrlLikeRunStart(segmentation, j)) {
          queryStartOverride = segmentation.starts[j]
        }
        const nextText = segmentation.texts[j]
        urlParts.push(nextText)
        wordLike = true
        j++
        if (nextText.includes('?')) break
      }
      text = joinTextParts(urlParts)
      i = j - 1
    }
    texts.push(text)
    isWordLike.push(wordLike)
    kinds.push(kind)
    starts.push(start)

    if (!isUrlQueryBoundarySegment(text)) continue

    const nextIndex = i + 1
    if (
      nextIndex >= segmentation.len ||
      isTextRunBoundary(segmentation.kinds[nextIndex])
    ) {
      continue
    }

    /**
     * @type {string[]}
     */
    const queryParts = []
    const queryStart = queryStartOverride < 0
      ? segmentation.starts[nextIndex]
      : queryStartOverride
    let j = nextIndex
    while (j < segmentation.len && !isTextRunBoundary(segmentation.kinds[j])) {
      queryParts.push(segmentation.texts[j])
      j++
    }

    if (queryParts.length > 0) {
      texts.push(joinTextParts(queryParts))
      isWordLike.push(true)
      kinds.push('text')
      starts.push(queryStart)
      i = j - 1
    }
  }

  return {
    len: texts.length,
    texts,
    isWordLike,
    kinds,
    starts,
  }
}

const numericJoinerChars = new Set([
  ':', '-', '/', '×', ',', '.', '+',
  '\u2013',
  '\u2014',
])

const wordInternalSymbolRe = /[\p{P}\p{S}\p{Co}]/u
const emojiPresentationRe = /\p{Emoji_Presentation}/u

const noSpaceWordBreakAfterChars = new Set([
  '?',
  '\u058A',
  '-',
  '\u2010',
  '\u2012',
  '\u2013',
  '\u2014',
  '\u2026',
  '\u203C',
  '\u203D',
  '\u2049',
])

/**
 * @param {number} code
 * @returns {boolean}
 */
function isAsciiWordInternalSymbolCode(code) {
  return (
    (code >= 0x21 && code <= 0x2F && code !== 0x2D) ||
    (code >= 0x3A && code <= 0x40 && code !== 0x3F) ||
    (code >= 0x5B && code <= 0x60) ||
    (code >= 0x7B && code <= 0x7E)
  )
}

/**
 * @param {string} ch
 * @returns {boolean}
 */
function isNoSpaceWordInternalSymbol(ch) {
  const code = ch.charCodeAt(0)
  if (code < 0x80) return isAsciiWordInternalSymbolCode(code)

  return (
    !noSpaceWordBreakAfterChars.has(ch) &&
    !emojiPresentationRe.test(ch) &&
    wordInternalSymbolRe.test(ch)
  )
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function isNoSpaceWordInternalSymbolSegment(text) {
  let sawSymbol = false
  for (const ch of text) {
    if (combiningMarkRe.test(ch)) continue
    if (!isNoSpaceWordInternalSymbol(ch)) return false
    sawSymbol = true
  }
  return sawSymbol
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function endsWithNoSpaceWordJoiner(text) {
  for (let end = text.length; end > 0;) {
    const start = previousCodePointStart(text, end)
    const ch = text.slice(start, end)
    if (combiningMarkRe.test(ch)) {
      end = start
      continue
    }
    return isNoSpaceWordInternalSymbol(ch) || isLineBreakNumericAffix(ch)
  }
  return false
}

/**
 * @param {string} leftText
 * @param {boolean} leftWordLike
 * @param {string} rightText
 * @param {boolean} rightWordLike
 * @returns {boolean}
 */
function canJoinNoSpaceWordBoundary(
  leftText,
  leftWordLike,
  rightText,
  rightWordLike,
) {
  const leftSymbol = !leftWordLike && isNoSpaceWordInternalSymbolSegment(leftText)
  const rightSymbol = !rightWordLike && isNoSpaceWordInternalSymbolSegment(rightText)
  const leftAffix = endsWithLineBreakNumericAffix(leftText)
  const leftEndsJoiner = (leftWordLike || leftAffix) && endsWithNoSpaceWordJoiner(leftText)

  if (!leftSymbol && !rightSymbol && !leftEndsJoiner) return false
  if (isCJK(leftText) || isCJK(rightText)) return false

  return (leftWordLike || leftSymbol || leftAffix) && (rightWordLike || rightSymbol)
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function segmentContainsDecimalDigit(text) {
  for (const ch of text) {
    if (decimalDigitRe.test(ch)) return true
  }
  return false
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function isNumericRunSegment(text) {
  if (text.length === 0) return false
  for (const ch of text) {
    if (decimalDigitRe.test(ch) || numericJoinerChars.has(ch)) continue
    return false
  }
  return true
}

/**
 * @param {MergedSegmentation} segmentation
 * @returns {MergedSegmentation}
 */
function mergeNumericRuns(segmentation) {
  /**
   * @type {string[]}
   */
  const texts = []
  /**
   * @type {boolean[]}
   */
  const isWordLike = []
  /**
   * @type {SegmentBreakKind[]}
   */
  const kinds = []
  /**
   * @type {number[]}
   */
  const starts = []

  /**
   * @param {string} text
   * @param {number} start
   * @returns {void}
   */
  function pushNumericRun(text, start) {
    if (text.includes('-')) {
      const parts = text.split('-')
      let shouldSplit = parts.length > 1
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (!shouldSplit) break
        if (
          part.length === 0 ||
          !segmentContainsDecimalDigit(part) ||
          !isNumericRunSegment(part)
        ) {
          shouldSplit = false
        }
      }

      if (shouldSplit) {
        let offset = 0
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i]
          const splitText = i < parts.length - 1 ? `${part}-` : part
          texts.push(splitText)
          isWordLike.push(true)
          kinds.push('text')
          starts.push(start + offset)
          offset += splitText.length
        }
        return
      }
    }

    texts.push(text)
    isWordLike.push(true)
    kinds.push('text')
    starts.push(start)
  }

  for (let i = 0; i < segmentation.len; i++) {
    const text = segmentation.texts[i]
    const kind = segmentation.kinds[i]

    if (kind === 'text' && isNumericRunSegment(text) && segmentContainsDecimalDigit(text)) {
      const mergedParts = [text]
      let j = i + 1
      while (
        j < segmentation.len &&
        segmentation.kinds[j] === 'text' &&
        isNumericRunSegment(segmentation.texts[j])
      ) {
        mergedParts.push(segmentation.texts[j])
        j++
      }

      pushNumericRun(joinTextParts(mergedParts), segmentation.starts[i])
      i = j - 1
      continue
    }

    texts.push(text)
    isWordLike.push(segmentation.isWordLike[i])
    kinds.push(kind)
    starts.push(segmentation.starts[i])
  }

  return {
    len: texts.length,
    texts,
    isWordLike,
    kinds,
    starts,
  }
}

/**
 * @param {MergedSegmentation} segmentation
 * @returns {MergedSegmentation}
 */
function mergeNoSpaceWordChains(segmentation) {
  /**
   * @type {string[]}
   */
  const texts = []
  /**
   * @type {boolean[]}
   */
  const isWordLike = []
  /**
   * @type {SegmentBreakKind[]}
   */
  const kinds = []
  /**
   * @type {number[]}
   */
  const starts = []

  let i = 0
  while (i < segmentation.len) {
    const text = segmentation.texts[i]
    const kind = segmentation.kinds[i]
    const wordLike = segmentation.isWordLike[i]

    if (kind === 'text') {
      const mergedParts = [text]
      let j = i + 1
      let mergedWordLike = wordLike

      while (
        j < segmentation.len &&
        segmentation.kinds[j] === 'text' &&
        canJoinNoSpaceWordBoundary(
          segmentation.texts[j - 1],
          segmentation.isWordLike[j - 1],
          segmentation.texts[j],
          segmentation.isWordLike[j],
        )
      ) {
        const nextText = segmentation.texts[j]
        mergedParts.push(nextText)
        mergedWordLike = mergedWordLike || segmentation.isWordLike[j]
        j++
      }

      if (j > i + 1) {
        texts.push(joinTextParts(mergedParts))
        isWordLike.push(mergedWordLike)
        kinds.push('text')
        starts.push(segmentation.starts[i])
        i = j
        continue
      }
    }

    texts.push(text)
    isWordLike.push(wordLike)
    kinds.push(kind)
    starts.push(segmentation.starts[i])
    i++
  }

  return {
    len: texts.length,
    texts,
    isWordLike,
    kinds,
    starts,
  }
}

/**
 * @param {MergedSegmentation} segmentation
 * @returns {MergedSegmentation}
 */
function mergeGlueConnectedTextRuns(segmentation) {
  /**
   * @type {string[]}
   */
  const texts = []
  /**
   * @type {boolean[]}
   */
  const isWordLike = []
  /**
   * @type {SegmentBreakKind[]}
   */
  const kinds = []
  /**
   * @type {number[]}
   */
  const starts = []

  let read = 0
  while (read < segmentation.len) {
    const textParts = [segmentation.texts[read]]
    let wordLike = segmentation.isWordLike[read]
    let kind = segmentation.kinds[read]
    let start = segmentation.starts[read]

    if (kind === 'glue') {
      const glueParts = [textParts[0]]
      const glueStart = start
      read++
      while (read < segmentation.len && segmentation.kinds[read] === 'glue') {
        glueParts.push(segmentation.texts[read])
        read++
      }
      const glueText = joinTextParts(glueParts)

      if (read < segmentation.len && segmentation.kinds[read] === 'text') {
        textParts[0] = glueText
        textParts.push(segmentation.texts[read])
        wordLike = segmentation.isWordLike[read]
        kind = 'text'
        start = glueStart
        read++
      } else {
        texts.push(glueText)
        isWordLike.push(false)
        kinds.push('glue')
        starts.push(glueStart)
        continue
      }
    } else {
      read++
    }

    if (kind === 'text') {
      while (read < segmentation.len && segmentation.kinds[read] === 'glue') {
        /**
         * @type {string[]}
         */
        const glueParts = []
        while (read < segmentation.len && segmentation.kinds[read] === 'glue') {
          glueParts.push(segmentation.texts[read])
          read++
        }
        const glueText = joinTextParts(glueParts)

        if (read < segmentation.len && segmentation.kinds[read] === 'text') {
          textParts.push(glueText, segmentation.texts[read])
          wordLike = wordLike || segmentation.isWordLike[read]
          read++
          continue
        }

        textParts.push(glueText)
      }
    }

    texts.push(joinTextParts(textParts))
    isWordLike.push(wordLike)
    kinds.push(kind)
    starts.push(start)
  }

  return {
    len: texts.length,
    texts,
    isWordLike,
    kinds,
    starts,
  }
}

/**
 * @param {MergedSegmentation} segmentation
 * @returns {void}
 */
function carryTrailingForwardStickyAcrossCJKBoundary(segmentation) {
  const { texts, kinds, starts } = segmentation

  for (let i = 0; i < texts.length - 1; i++) {
    if (kinds[i] !== 'text' || kinds[i + 1] !== 'text') continue
    if (!isCJK(texts[i]) || !isCJK(texts[i + 1])) continue

    const split = splitTrailingForwardStickyCluster(texts[i])
    if (split === null) continue

    texts[i] = split.head
    texts[i + 1] = split.tail + texts[i + 1]
    starts[i + 1] = starts[i] + split.head.length
  }
}

/**
 * @param {string} normalized
 * @param {AnalysisProfile} profile
 * @param {WhiteSpaceProfile} whiteSpaceProfile
 * @returns {MergedSegmentation}
 */
function buildMergedSegmentation(
  normalized,
  profile,
  whiteSpaceProfile,
) {
  const wordSegmenter = getSharedWordSegmenter()
  let mergedLen = 0
  /**
   * @type {string[]}
   */
  const mergedTexts = []
  /**
   * @type {boolean[]}
   */
  const mergedWordLike = []
  /**
   * @type {SegmentBreakKind[]}
   */
  const mergedKinds = []
  /**
   * @type {number[]}
   */
  const mergedStarts = []

  // First-pass merges only extend the immediately adjacent text run. Keep that
  // live tail as a source range, then materialize it once at the next boundary.
  let hasTail = false
  let tailStart = 0
  let tailEnd = 0
  let tailWordLike = false
  /**
   * @type {SegmentBreakKind}
   */
  let tailKind = 'text'
  /**
   * @type {string | null}
   */
  let tailSingleCharRunChar = null
  let tailContainsCJK = false
  let tailContainsArabicScript = false
  let tailEndsWithClosingQuote = false
  let tailEndsWithMyanmarMedialGlue = false
  let tailHasArabicNoSpacePunctuation = false

  for (const s of wordSegmenter.segment(normalized)) {
    for (const piece of splitSegmentByBreakKind(s.segment, s.isWordLike ?? false, s.index, whiteSpaceProfile)) {
      const isText = piece.kind === 'text'
      const repeatableSingleCharRunChar = getRepeatableSingleCharRunChar(piece.text, piece.isWordLike, piece.kind)
      const pieceContainsCJK = isCJK(piece.text)
      const pieceContainsArabicScript = containsArabicScript(piece.text)
      const pieceLastCodePoint = getLastCodePoint(piece.text)
      const pieceEndsWithClosingQuote = endsWithClosingQuote(piece.text)
      const pieceEndsWithMyanmarMedialGlue = endsWithMyanmarMedialGlue(piece.text)
      const pieceEnd = piece.start + piece.text.length
      let appendToTail = false

      // First-pass keeps: no-space script-specific joins and punctuation glue
      // that depend on the immediately preceding text run.
      if (
        profile.carryCJKAfterClosingQuote &&
        isText &&
        hasTail &&
        tailKind === 'text' &&
        pieceContainsCJK &&
        tailContainsCJK &&
        tailEndsWithClosingQuote
      ) {
        appendToTail = true
      } else if (
        isText &&
        hasTail &&
        tailKind === 'text' &&
        isCJKLineStartProhibitedSegment(piece.text) &&
        tailContainsCJK
      ) {
        appendToTail = true
      } else if (
        isText &&
        hasTail &&
        tailKind === 'text' &&
        tailEndsWithMyanmarMedialGlue
      ) {
        appendToTail = true
      } else if (
        isText &&
        hasTail &&
        tailKind === 'text' &&
        piece.isWordLike &&
        pieceContainsArabicScript &&
        tailHasArabicNoSpacePunctuation
      ) {
        appendToTail = true
      } else if (
        repeatableSingleCharRunChar !== null &&
        hasTail &&
        tailKind === 'text' &&
        tailSingleCharRunChar === repeatableSingleCharRunChar
      ) {
        tailEnd = pieceEnd
        continue
      } else if (
        isText &&
        !piece.isWordLike &&
        hasTail &&
        tailKind === 'text' &&
        !tailContainsCJK &&
        (
          isLeftStickyPunctuationSegment(piece.text) ||
          (piece.text === '-' && tailWordLike)
        )
      ) {
        appendToTail = true
      }

      if (appendToTail) {
        tailEnd = pieceEnd
        tailWordLike = tailWordLike || piece.isWordLike
        tailSingleCharRunChar = null
        tailContainsCJK = tailContainsCJK || pieceContainsCJK
        tailContainsArabicScript = tailContainsArabicScript || pieceContainsArabicScript
        tailEndsWithClosingQuote = pieceEndsWithClosingQuote
        tailEndsWithMyanmarMedialGlue = pieceEndsWithMyanmarMedialGlue
        tailHasArabicNoSpacePunctuation = hasArabicNoSpacePunctuation(
          tailContainsArabicScript,
          pieceLastCodePoint,
        )
      } else {
        if (hasTail) {
          mergedTexts[mergedLen] = normalized.slice(tailStart, tailEnd)
          mergedWordLike[mergedLen] = tailWordLike
          mergedKinds[mergedLen] = tailKind
          mergedStarts[mergedLen] = tailStart
          mergedLen++
        }

        hasTail = true
        tailStart = piece.start
        tailEnd = pieceEnd
        tailWordLike = piece.isWordLike
        tailKind = piece.kind
        tailSingleCharRunChar = repeatableSingleCharRunChar
        tailContainsCJK = pieceContainsCJK
        tailContainsArabicScript = pieceContainsArabicScript
        tailEndsWithClosingQuote = pieceEndsWithClosingQuote
        tailEndsWithMyanmarMedialGlue = pieceEndsWithMyanmarMedialGlue
        tailHasArabicNoSpacePunctuation = hasArabicNoSpacePunctuation(
          pieceContainsArabicScript,
          pieceLastCodePoint,
        )
      }
    }
  }

  if (hasTail) {
    mergedTexts[mergedLen] = normalized.slice(tailStart, tailEnd)
    mergedWordLike[mergedLen] = tailWordLike
    mergedKinds[mergedLen] = tailKind
    mergedStarts[mergedLen] = tailStart
    mergedLen++
  }

  // Later passes operate on the merged text stream itself: contextual escaped
  // quote glue, forward-sticky carry, compaction, then the broader URL/numeric
  // and Arabic-leading-mark fixes.
  for (let i = 1; i < mergedLen; i++) {
    if (
      mergedKinds[i] === 'text' &&
      !mergedWordLike[i] &&
      isEscapedQuoteClusterSegment(mergedTexts[i]) &&
      mergedKinds[i - 1] === 'text' &&
      !isCJK(mergedTexts[i - 1])
    ) {
      mergedTexts[i - 1] += mergedTexts[i]
      mergedWordLike[i - 1] = mergedWordLike[i - 1] || mergedWordLike[i]
      mergedTexts[i] = ''
    }
  }

  let nextLiveIndex = -1
  /**
   * @type {string[] | null}
   */
  let forwardStickyPrefixParts = null

  for (let i = mergedLen - 1; i >= 0; i--) {
    const text = mergedTexts[i]
    if (text.length === 0) continue

    if (
      mergedKinds[i] === 'text' &&
      !mergedWordLike[i] &&
      nextLiveIndex >= 0 &&
      mergedKinds[nextLiveIndex] === 'text' &&
      (
        isForwardStickyClusterSegment(text) ||
        (text === '-' && startsWithDecimalDigit(mergedTexts[nextLiveIndex]))
      )
    ) {
      if (forwardStickyPrefixParts === null) forwardStickyPrefixParts = []
      forwardStickyPrefixParts.push(text)
      mergedStarts[nextLiveIndex] = mergedStarts[i]
      mergedTexts[i] = ''
      continue
    }

    if (forwardStickyPrefixParts !== null) {
      mergedTexts[nextLiveIndex] = joinReversedPrefixParts(
        forwardStickyPrefixParts,
        mergedTexts[nextLiveIndex],
      )
      forwardStickyPrefixParts = null
    }
    nextLiveIndex = i
  }

  if (forwardStickyPrefixParts !== null) {
    mergedTexts[nextLiveIndex] = joinReversedPrefixParts(
      forwardStickyPrefixParts,
      mergedTexts[nextLiveIndex],
    )
  }

  let compactLen = 0
  for (let read = 0; read < mergedLen; read++) {
    const text = mergedTexts[read]
    if (text.length === 0) continue
    if (compactLen !== read) {
      mergedTexts[compactLen] = text
      mergedWordLike[compactLen] = mergedWordLike[read]
      mergedKinds[compactLen] = mergedKinds[read]
      mergedStarts[compactLen] = mergedStarts[read]
    }
    compactLen++
  }

  mergedTexts.length = compactLen
  mergedWordLike.length = compactLen
  mergedKinds.length = compactLen
  mergedStarts.length = compactLen

  const compacted = mergeGlueConnectedTextRuns({
    len: compactLen,
    texts: mergedTexts,
    isWordLike: mergedWordLike,
    kinds: mergedKinds,
    starts: mergedStarts,
  })
  const mergedRuns = mergeNoSpaceWordChains(mergeNumericRuns(mergeUrlRuns(compacted)))
  carryTrailingForwardStickyAcrossCJKBoundary(mergedRuns)

  for (let i = 0; i < mergedRuns.len - 1; i++) {
    const split = splitLeadingSpaceAndMarks(mergedRuns.texts[i])
    if (split === null) continue
    if (
      (mergedRuns.kinds[i] !== 'space' && mergedRuns.kinds[i] !== 'preserved-space') ||
      mergedRuns.kinds[i + 1] !== 'text' ||
      !containsArabicScript(mergedRuns.texts[i + 1])
    ) {
      continue
    }

    mergedRuns.texts[i] = split.space
    mergedRuns.isWordLike[i] = false
    mergedRuns.kinds[i] = mergedRuns.kinds[i] === 'preserved-space' ? 'preserved-space' : 'space'
    mergedRuns.texts[i + 1] = split.marks + mergedRuns.texts[i + 1]
    mergedRuns.starts[i + 1] = mergedRuns.starts[i] + split.space.length
  }

  return mergedRuns
}

/**
 * @param {string} normalized
 * @param {MergedSegmentation} segmentation
 * @param {boolean} breakAfterPunctuation
 * @returns {MergedSegmentation}
 */
function mergeKeepAllTextSegments(
  normalized,
  segmentation,
  breakAfterPunctuation,
) {
  if (segmentation.len <= 1) return segmentation

  /**
   * @type {string[]}
   */
  const texts = []
  /**
   * @type {boolean[]}
   */
  const isWordLike = []
  /**
   * @type {SegmentBreakKind[]}
   */
  const kinds = []
  /**
   * @type {number[]}
   */
  const starts = []

  let groupStart = -1
  let groupContainsCJK = false

  /**
   * @param {number} index
   * @returns {void}
   */
  function pushOriginalText(index) {
    texts.push(segmentation.texts[index])
    isWordLike.push(segmentation.isWordLike[index])
    kinds.push('text')
    starts.push(segmentation.starts[index])
  }

  /**
   * @param {number} start
   * @param {number} end
   * @returns {void}
   */
  function pushMergedText(start, end) {
    let wordLike = false

    for (let i = start; i < end; i++) {
      wordLike = wordLike || segmentation.isWordLike[i]
    }

    const sourceStart = segmentation.starts[start]
    const sourceEnd = end < segmentation.len ? segmentation.starts[end] : normalized.length
    texts.push(normalized.slice(sourceStart, sourceEnd))
    isWordLike.push(wordLike)
    kinds.push('text')
    starts.push(sourceStart)
  }

  /**
   * @param {number} end
   * @returns {void}
   */
  function flushGroup(end) {
    if (groupStart < 0) return

    if (groupContainsCJK) {
      if (groupStart + 1 === end) {
        pushOriginalText(groupStart)
      } else {
        pushMergedText(groupStart, end)
      }
    } else {
      for (let i = groupStart; i < end; i++) pushOriginalText(i)
    }

    groupStart = -1
    groupContainsCJK = false
  }

  for (let i = 0; i < segmentation.len; i++) {
    const text = segmentation.texts[i]
    const kind = segmentation.kinds[i]

    if (kind === 'text') {
      if (
        groupStart >= 0 &&
        !canContinueKeepAllTextRun(segmentation.texts[i - 1], breakAfterPunctuation)
      ) {
        flushGroup(i)
      }
      if (groupStart < 0) groupStart = i
      groupContainsCJK = groupContainsCJK || isCJK(text)
      continue
    }

    flushGroup(i)
    texts.push(text)
    isWordLike.push(segmentation.isWordLike[i])
    kinds.push(kind)
    starts.push(segmentation.starts[i])
  }

  flushGroup(segmentation.len)

  return {
    len: texts.length,
    texts,
    isWordLike,
    kinds,
    starts,
  }
}

/**
 * @param {string} text
 * @param {AnalysisProfile} profile
 * @param {WhiteSpaceMode} [whiteSpace]
 * @param {WordBreakMode} [wordBreak]
 * @returns {TextAnalysis}
 */
export function analyzeText(
  text,
  profile,
  whiteSpace = 'normal',
  wordBreak = 'normal',
) {
  const whiteSpaceProfile = getWhiteSpaceProfile(whiteSpace)
  const normalized = whiteSpaceProfile.mode === 'pre-wrap'
    ? normalizeWhitespacePreWrap(text)
    : normalizeWhitespaceNormal(text)
  if (normalized.length === 0) {
    return {
      normalized,
      len: 0,
      texts: [],
      isWordLike: [],
      kinds: [],
      starts: [],
    }
  }
  const mergedSegmentation = buildMergedSegmentation(normalized, profile, whiteSpaceProfile)
  const segmentation = wordBreak === 'keep-all'
    ? mergeKeepAllTextSegments(normalized, mergedSegmentation, profile.breakKeepAllAfterPunctuation)
    : mergedSegmentation
  return {
    normalized,
    ...segmentation,
  }
}
