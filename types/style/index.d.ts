/**
 * @param {string} name
 * @param {any} value
 */
export function validateStyle(name: string, value: any): any;
/**
 * @param {string} name
 * @param {any} value
 */
export function resolveStyle(name: string, value: any): {
    name: string;
    value: any;
    expanded: any;
};
export function isPaintStyle(name: any): boolean;
export function computeStyleValue(style: any, context: any): any;
/** @type {Record<string, any>} */
export const STYLE: Record<string, any>;
export const STYLE_BY_NAME: any;
declare namespace _default {
    export { validateStyle };
    export { resolveStyle };
    export { computeStyleValue };
    export { STYLE };
}
export default _default;
