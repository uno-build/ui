/**
 * @param {any} options
 */
export function defineScroll({ ui }: any): {
    types: {
        readonly platform: false;
        readonly name: "scroll";
        readonly prop: "onScroll";
        readonly priority: "continuous";
    }[];
    /**
     * @param {any} node
     */
    destroyNode(node: any): void;
    destroy(): void;
};
