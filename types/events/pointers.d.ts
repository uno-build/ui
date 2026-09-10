/**
 * @param {any} options
 */
export function definePointers({ ui }: any): {
    types: ({
        readonly platform: true;
        readonly name: "pointerdown";
        readonly prop: "onPointerDown";
        readonly priority: "discrete";
    } | {
        readonly platform: true;
        readonly name: "pointermove";
        readonly prop: "onPointerMove";
        readonly priority: "continuous";
    } | {
        readonly platform: true;
        readonly name: "pointerup";
        readonly prop: "onPointerUp";
        readonly priority: "discrete";
    } | {
        readonly platform: true;
        readonly name: "pointercancel";
        readonly prop: "onPointerCancel";
        readonly priority: "discrete";
    } | {
        readonly platform: false;
        readonly name: "pointerover";
        readonly prop: "onPointerOver";
        readonly priority: "continuous";
    } | {
        readonly platform: false;
        readonly name: "pointerout";
        readonly prop: "onPointerOut";
        readonly priority: "continuous";
    })[];
    /**
     * @param {any} node
     */
    destroyNode(node: any): void;
    destroy(): void;
};
