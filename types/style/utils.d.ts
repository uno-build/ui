/**
 * @param {string} value
 */
export function readUnit(value: string): {
    value: number;
    kind: string | undefined;
} | undefined;
/**
 * @param {any} value
 */
export function readNumber(value: any): number | undefined;
/**
 * @param {any} value
 */
export function readInteger(value: any): number | undefined;
/**
 * @param {[] | undefined} fns
 * @param {any} value
 * @param {any} context
 */
export function runPipeline(fns: [] | undefined, value: any, context: any): any;
/**
 * @param {[] | undefined} fns
 * @param {any} value
 */
export function runValidators(fns: [] | undefined, value: any): void;
/**
 * @param {Record<string, any>} values
 */
export function createEnumValidator(values: Record<string, any>): (value: string) => void;
/**
 * @param {Record<string, any>} values
 */
export function createEnumParser(values: Record<string, any>): (value: string) => {
    value: string;
    parsed: {
        enum: any;
    };
};
