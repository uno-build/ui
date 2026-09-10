/**
 * @param {any} options
 */
export function defineFocus({ ui }: any): {
    types: ({
        readonly platform: false;
        readonly name: "focus";
        readonly prop: "onFocus";
        readonly priority: "discrete";
    } | {
        readonly platform: false;
        readonly name: "blur";
        readonly prop: "onBlur";
        readonly priority: "discrete";
    })[];
    /**
     * @param {any} node
     */
    destroyNode(node: any): void;
    destroy(): void;
};
