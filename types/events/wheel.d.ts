/**
 * @param {any} options
 */
export function defineWheel({ ui }: any): {
    types: {
        readonly platform: true;
        readonly name: "wheel";
        readonly prop: "onWheel";
        readonly priority: "continuous";
    }[];
    destroy(): void;
};
/**
 * @param {any} delta
 * @param {any} delta_mode
 */
export function normalizeDelta(delta: any, delta_mode: any): any;
