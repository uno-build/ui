/**
 * @param {string} text
 * @returns {string}
 */
export function normalizeWhitespaceNormal(text: string): string;
/**
 * @param {string} s
 * @returns {boolean}
 */
export function isCJK(s: string): boolean;
/**
 * @param {string} previousText
 * @param {boolean} breakAfterPunctuation
 * @returns {boolean}
 */
export function canContinueKeepAllTextRun(previousText: string, breakAfterPunctuation: boolean): boolean;
/**
 * @param {string} text
 * @returns {boolean}
 */
export function endsWithClosingQuote(text: string): boolean;
/**
 * @param {string} text
 * @returns {boolean}
 */
export function isNumericRunSegment(text: string): boolean;
/**
 * @param {string} text
 * @param {AnalysisProfile} profile
 * @param {WhiteSpaceMode} [whiteSpace]
 * @param {WordBreakMode} [wordBreak]
 * @returns {TextAnalysis}
 */
export function analyzeText(text: string, profile: AnalysisProfile, whiteSpace?: WhiteSpaceMode, wordBreak?: WordBreakMode): TextAnalysis;
export const kinsokuStart: Set<string>;
export const kinsokuEnd: Set<string>;
export const leftStickyPunctuation: Set<string>;
export type WhiteSpaceProfile = {
    mode: WhiteSpaceMode;
    preserveOrdinarySpaces: boolean;
    preserveHardBreaks: boolean;
};
export type WhiteSpaceMode = "normal" | "pre-wrap";
export type WordBreakMode = "normal" | "keep-all";
export type SegmentBreakKind = "text" | "space" | "preserved-space" | "tab" | "glue" | "zero-width-break" | "soft-hyphen" | "hard-break";
export type SegmentationPiece = {
    text: string;
    isWordLike: boolean;
    kind: SegmentBreakKind;
    start: number;
};
export type MergedSegmentation = {
    len: number;
    texts: string[];
    isWordLike: boolean[];
    kinds: SegmentBreakKind[];
    starts: number[];
};
export type TextAnalysis = {
    normalized: string;
} & MergedSegmentation;
export type AnalysisProfile = {
    carryCJKAfterClosingQuote: boolean;
    breakKeepAllAfterPunctuation: boolean;
};
