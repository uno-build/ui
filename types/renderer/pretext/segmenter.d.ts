export default class Segmenter {
    /**
     * @param {string | string[]} [_locales]
     * @param {{ granularity?: Granularity }} [options]
     */
    constructor(_locales?: string | string[], options?: {
        granularity?: Granularity;
    });
    /**
     * @private
     * @type {Granularity}
     */
    private granularity;
    /**
     * @param {string} input
     * @returns {Segment[]}
     */
    segment(input: string): Segment[];
}
export type Granularity = "grapheme" | "word";
export type Segment = {
    segment: string;
    index: number;
    input: string;
    isWordLike?: boolean;
};
