/**
 * @param {PreparedTextWithSegments} prepared
 * @returns {Map<number, string[]>}
 */
export function getLineTextCache(prepared: PreparedTextWithSegments): Map<number, string[]>;
/**
 * @param {PreparedTextWithSegments} prepared
 * @param {Map<number, string[]>} cache
 * @param {number} startSegmentIndex
 * @param {number} startGraphemeIndex
 * @param {number} endSegmentIndex
 * @param {number} endGraphemeIndex
 * @returns {string}
 */
export function buildLineTextFromRange(prepared: PreparedTextWithSegments, cache: Map<number, string[]>, startSegmentIndex: number, startGraphemeIndex: number, endSegmentIndex: number, endGraphemeIndex: number): string;
export type SegmentBreakKind = import("./analysis.js").SegmentBreakKind;
export type PreparedTextWithSegments = import("./layout.js").PreparedTextWithSegments;
