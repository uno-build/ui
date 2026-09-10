/**
 * @param {any} options
 */
export function defineClick({ ui }: any): {
    types: {
        readonly platform: false;
        readonly name: "click";
        readonly prop: "onClick";
        readonly priority: "discrete";
    }[];
    /**
     * @param {any} node
     */
    destroyNode(node: any): void;
    destroy(): void;
};
