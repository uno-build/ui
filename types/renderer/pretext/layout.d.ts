/**
 * @param {string} text
 * @param {PrepareOptions} options
 * @returns {PreparedTextWithSegments}
 */
export function prepareWithSegments(text: string, options: PrepareOptions): PreparedTextWithSegments;
/**
 * @param {PreparedTextWithSegments} prepared
 * @param {number} maxWidth
 * @returns {LineStats}
 */
export function measureLineStats(prepared: PreparedTextWithSegments, maxWidth: number): LineStats;
/**
 * @param {PreparedTextWithSegments} prepared
 * @returns {number}
 */
export function measureNaturalWidth(prepared: PreparedTextWithSegments): number;
/**
 * @param {PreparedTextWithSegments} prepared
 * @param {number} maxWidth
 * @param {number} lineHeight
 * @returns {LayoutLinesResult}
 */
export function layoutWithLines(prepared: PreparedTextWithSegments, maxWidth: number, lineHeight: number): LayoutLinesResult;
export type PreparedCore = {
    widths: number[];
    lineEndFitAdvances: number[];
    lineEndPaintAdvances: number[];
    kinds: SegmentBreakKind[];
    simpleLineWalkFastPath: boolean;
    breakableFitAdvances: (number[] | null)[];
    breakablePreferredBreaks: (number[] | null)[];
    letterSpacing: number;
    spacingGraphemeCounts: number[];
    discretionaryHyphenWidth: number;
    tabStopAdvance: number;
    chunks: PreparedLineChunk[];
};
export type PreparedTextWithSegments = PreparedCore & {
    segments: string[];
};
export type LayoutCursor = {
    segmentIndex: number;
    graphemeIndex: number;
};
export type LayoutResult = {
    lineCount: number;
    height: number;
};
export type LineStats = {
    lineCount: number;
    maxLineWidth: number;
};
export type LayoutLine = {
    text: string;
    width: number;
    start: LayoutCursor;
    end: LayoutCursor;
};
export type LayoutLinesResult = LayoutResult & {
    lines: LayoutLine[];
};
export type WordBreakMode = AnalysisWordBreakMode;
export type PrepareOptions = {
    measure: MeasureText;
    whiteSpace?: WhiteSpaceMode;
    wordBreak?: WordBreakMode;
    letterSpacing?: number;
};
export type PreparedLineChunk = {
    startSegmentIndex: number;
    endSegmentIndex: number;
    consumedEndSegmentIndex: number;
};
export type MeasuredTextUnit = {
    text: string;
    start: number;
};
export type SegmentBreakKind = import("./analysis.js").SegmentBreakKind;
export type TextAnalysis = import("./analysis.js").TextAnalysis;
export type WhiteSpaceMode = import("./analysis.js").WhiteSpaceMode;
export type AnalysisWordBreakMode = import("./analysis.js").WordBreakMode;
export type BreakableFitMode = import("./measurement.js").BreakableFitMode;
export type MeasureText = import("./measurement.js").MeasureText;
export type SegmentMetrics = import("./measurement.js").SegmentMetrics;
