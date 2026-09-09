/**
 * @param {string} value
 */
export function parseString(value: string): {
    value: string;
    parsed: {};
};
/**
 * @param {string} value
 */
export function parseAuto(value: string): {
    value: string;
    parsed: {
        kind: string;
    };
};
/**
 * @param {string} value
 */
export function parseUnset(value: string): {
    value: string;
    parsed: {
        kind: string;
    };
};
/**
 * @param {string} value
 */
export function parseNumber(value: string): {
    value: string;
    parsed: {
        value: number | undefined;
    };
};
/**
 * @param {string} value
 */
export function parseInteger(value: string): {
    value: string;
    parsed: {
        value: number | undefined;
    };
};
/**
 * @param {string} value
 */
export function parseRgba(value: string): number[];
/**
 * @param {string} value
 */
export function parseColor(value: string): {
    value: string;
    parsed: {
        rgba: number[];
    };
};
/**
 * @param {string} value
 */
export function parseBoxShadow(value: string): {
    value: string;
    parsed: {
        box_shadow: {
            offset_x: {
                value: number;
                kind: string | undefined;
            } | undefined;
            offset_y: {
                value: number;
                kind: string | undefined;
            } | undefined;
            blur: {
                value: number;
                kind: string | undefined;
            } | undefined;
            spread: {
                value: number;
                kind: string | undefined;
            } | undefined;
            color: number[];
        };
    };
};
/**
 * @param {string} value
 */
export function parseTextShadow(value: string): {
    value: string;
    parsed: {
        text_shadow: {
            offset_x: {
                value: number;
                kind: string | undefined;
            } | undefined;
            offset_y: {
                value: number;
                kind: string | undefined;
            } | undefined;
            blur: {
                value: number;
                kind: string | undefined;
            } | undefined;
            color: number[];
        };
    };
};
/**
 * @param {string} value
 */
export function parseTextStroke(value: string): {
    value: string;
    parsed: {
        text_stroke: {
            width: {
                value: number;
                kind: string | undefined;
            } | undefined;
            color: number[];
        };
    };
};
/**
 * @param {string} value
 * @param {Record<string, any>} values
 */
export function parseEnum(value: string, values: Record<string, any>): {
    value: string;
    parsed: {
        enum: any;
    };
};
/**
 * @param {string} value
 */
export function parsePx(value: string): {
    value: string;
    parsed: {
        value: number;
        kind: string | undefined;
    } | undefined;
};
/**
 * @param {string} value
 */
export function parsePercent(value: string): {
    value: string;
    parsed: {
        value: number;
        kind: string | undefined;
    } | undefined;
};
/**
 * @param {string} value
 */
export function parseRem(value: string): {
    value: string;
    parsed: {
        value: number;
        kind: string | undefined;
    } | undefined;
};
/**
 * @param {string} value
 */
export function parseVw(value: string): {
    value: string;
    parsed: {
        value: number;
        kind: string | undefined;
    } | undefined;
};
/**
 * @param {string} value
 */
export function parseVh(value: string): {
    value: string;
    parsed: {
        value: number;
        kind: string | undefined;
    } | undefined;
};
/**
 * @param {any} value
 */
export function parseImage(value: any): {
    value: any;
    parsed: any;
};
