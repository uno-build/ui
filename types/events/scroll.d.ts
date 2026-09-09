/**
 * @param {any} options
 */
export function defineScroll({ ui }: any): {
    types: {
        platform: boolean;
        name: string;
        prop: string;
        priority: string;
    }[];
    /**
     * @param {any} node
     */
    destroyNode(node: any): void;
    destroy(): void;
};
