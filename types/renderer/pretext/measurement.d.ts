/**
 * @param {string} text
 * @param {Map<string, SegmentMetrics>} cache
 * @param {MeasureText} measure
 * @returns {SegmentMetrics}
 */
export function getSegmentMetrics(text: string, cache: Map<string, SegmentMetrics>, measure: MeasureText): SegmentMetrics;
/**
 * @returns {EngineProfile}
 */
export function getEngineProfile(): EngineProfile;
/**
 * @param {string} text
 * @param {SegmentMetrics} metrics
 * @param {Map<string, SegmentMetrics>} cache
 * @param {MeasureText} measure
 * @param {BreakableFitMode} mode
 * @returns {number[] | null}
 */
export function getSegmentBreakableFitAdvances(text: string, metrics: SegmentMetrics, cache: Map<string, SegmentMetrics>, measure: MeasureText, mode: BreakableFitMode): number[] | null;
export type MeasureText = (text: string) => number;
export type SegmentMetrics = {
    width: number;
    containsCJK: boolean;
    breakableFitMode?: BreakableFitMode;
    breakableFitAdvances?: number[] | null;
};
export type EngineProfile = {
    lineFitEpsilon: number;
    carryCJKAfterClosingQuote: boolean;
    breakKeepAllAfterPunctuation: boolean;
    preferPrefixWidthsForBreakableRuns: boolean;
};
export type BreakableFitMode = "sum-graphemes" | "segment-prefixes" | "pair-context";
