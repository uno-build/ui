/**
 * @param {any} options
 */
export function defineWheel({ ui }: any): {
    types: {
        platform: boolean;
        name: string;
        prop: string;
        priority: string;
    }[];
    destroy(): void;
};
/**
 * @param {any} delta
 * @param {any} delta_mode
 */
export function normalizeDelta(delta: any, delta_mode: any): any;
