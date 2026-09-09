/**
 * @typedef {{
 *     x: number
 *     y: number
 *     width: number
 *     height: number
 * }} AtlasRect
 */
/**
 * @typedef {{
 *     x: number
 *     y: number
 *     width: number
 * }} SkylineNode
 */
/**
 * @typedef {{
 *     rect: AtlasRect
 *     free_rects: AtlasRect[]
 * }} FreeRectAllocation
 */
/**
 * @typedef {{
 *     rect: AtlasRect
 *     skyline: SkylineNode[]
 * }} SkylineAllocation
 */
/**
 * @param {number} size
 * @returns {SkylineNode[]}
 */
export function createSkyline(size: number): SkylineNode[];
/**
 * @param {AtlasRect[]} free_rects
 * @param {number} width
 * @param {number} height
 * @returns {FreeRectAllocation | null}
 */
export function allocateFreeRect(free_rects: AtlasRect[], width: number, height: number): FreeRectAllocation | null;
/**
 * @param {AtlasRect[]} free_rects
 * @param {AtlasRect} rect
 * @returns {AtlasRect[]}
 */
export function releaseAtlasRect(free_rects: AtlasRect[], rect: AtlasRect): AtlasRect[];
/**
 * @param {SkylineNode[]} skyline
 * @param {number} width
 * @param {number} height
 * @param {number} size
 * @returns {SkylineAllocation | null}
 */
export function allocateSkylineRect(skyline: SkylineNode[], width: number, height: number, size: number): SkylineAllocation | null;
export type AtlasRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export type SkylineNode = {
    x: number;
    y: number;
    width: number;
};
export type FreeRectAllocation = {
    rect: AtlasRect;
    free_rects: AtlasRect[];
};
export type SkylineAllocation = {
    rect: AtlasRect;
    skyline: SkylineNode[];
};
