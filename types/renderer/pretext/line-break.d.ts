/**
 * @param {PreparedLineBreakData} prepared
 * @param {LineBreakCursor} cursor
 * @returns {number}
 */
export function normalizePreparedLineStart(prepared: PreparedLineBreakData, cursor: LineBreakCursor): number;
/**
 * @param {PreparedLineBreakData} prepared
 * @param {number} maxWidth
 * @param {InternalLineVisitor} [onLine]
 * @returns {number}
 */
export function walkPreparedLinesRaw(prepared: PreparedLineBreakData, maxWidth: number, onLine?: InternalLineVisitor): number;
/**
 * @param {PreparedLineBreakData} prepared
 * @param {LineBreakCursor} cursor
 * @param {number} chunkIndex
 * @param {number} maxWidth
 * @returns {number | null}
 */
export function stepPreparedLineGeometryFromChunk(prepared: PreparedLineBreakData, cursor: LineBreakCursor, chunkIndex: number, maxWidth: number): number | null;
/**
 * @param {PreparedLineBreakData} prepared
 * @param {LineBreakCursor} cursor
 * @param {number} maxWidth
 * @returns {number | null}
 */
export function stepPreparedLineGeometry(prepared: PreparedLineBreakData, cursor: LineBreakCursor, maxWidth: number): number | null;
/**
 * @param {PreparedLineBreakData} prepared
 * @param {number} maxWidth
 * @returns {{
 *   lineCount: number
 *   maxLineWidth: number
 * }}
 */
export function measurePreparedLineGeometry(prepared: PreparedLineBreakData, maxWidth: number): {
    lineCount: number;
    maxLineWidth: number;
};
export type LineBreakCursor = {
    segmentIndex: number;
    graphemeIndex: number;
};
export type PreparedLineBreakData = {
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
    chunks: {
        startSegmentIndex: number;
        endSegmentIndex: number;
        consumedEndSegmentIndex: number;
    }[];
};
export type InternalLineVisitor = (width: number, startSegmentIndex: number, startGraphemeIndex: number, endSegmentIndex: number, endGraphemeIndex: number) => void;
export type SegmentBreakKind = import("./analysis.js").SegmentBreakKind;
