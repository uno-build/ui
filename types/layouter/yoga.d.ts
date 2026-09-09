/** @param {{ loadYoga?: () => Promise<any> }} [options] */
export default function createYogaLayouter({ loadYoga }?: {
    loadYoga?: () => Promise<any>;
}): Promise<{
    createNode(node: any): void;
    createElement(node: any): any;
    getChildIndex(node: any): any;
    insertChild(parent: any, node: any, child_index: any): void;
    detachChild(parent: any, node: any): void;
    destroyNode(node: any): void;
    destroy(nodes: any): void;
    applyStyle(node: any, style: any): void;
    setMeasureFunction(node: any, measure_function: any): void;
    markDirty(node: any): void;
    isDirty(): any;
    calculate: (width?: any, height?: any) => void;
    /**
     * @param {any} [width]
     * @param {any} [height]
     */
    update(width?: any, height?: any): void;
    getLayout(node: any): {
        padding: {
            top: any;
            right: any;
            bottom: any;
            left: any;
        };
        border: {
            top: any;
            right: any;
            bottom: any;
            left: any;
        };
        width: any;
        height: any;
        left: any;
        top: any;
        x: any;
        y: any;
        centerX: number;
        centerY: number;
    };
}>;
export namespace YOGA_SETTER {
    function width(node: any, { parsed }: {
        parsed: any;
    }): void;
    function height(node: any, { parsed }: {
        parsed: any;
    }): void;
    function minWidth(node: any, { parsed }: {
        parsed: any;
    }): void;
    function minHeight(node: any, { parsed }: {
        parsed: any;
    }): void;
    function maxWidth(node: any, { parsed }: {
        parsed: any;
    }): void;
    function maxHeight(node: any, { parsed }: {
        parsed: any;
    }): void;
    function position(node: any, { parsed }: {
        parsed: any;
    }): void;
    function top(node: any, { parsed }: {
        parsed: any;
    }): void;
    function left(node: any, { parsed }: {
        parsed: any;
    }): void;
    function right(node: any, { parsed }: {
        parsed: any;
    }): void;
    function bottom(node: any, { parsed }: {
        parsed: any;
    }): void;
    function flexGrow(node: any, { parsed }: {
        parsed: any;
    }): void;
    function flexShrink(node: any, { parsed }: {
        parsed: any;
    }): void;
    function flexBasis(node: any, { parsed }: {
        parsed: any;
    }): void;
    function flexDirection(node: any, { parsed }: {
        parsed: any;
    }): void;
    function flexWrap(node: any, { parsed }: {
        parsed: any;
    }): void;
    function alignContent(node: any, { parsed }: {
        parsed: any;
    }): void;
    function alignItems(node: any, { parsed }: {
        parsed: any;
    }): void;
    function alignSelf(node: any, { parsed }: {
        parsed: any;
    }): void;
    function justifyContent(node: any, { parsed }: {
        parsed: any;
    }): void;
    function marginTop(node: any, { parsed }: {
        parsed: any;
    }): void;
    function marginLeft(node: any, { parsed }: {
        parsed: any;
    }): void;
    function marginRight(node: any, { parsed }: {
        parsed: any;
    }): void;
    function marginBottom(node: any, { parsed }: {
        parsed: any;
    }): void;
    function boxSizing(node: any, { parsed }: {
        parsed: any;
    }): void;
    function borderTopWidth(node: any, { parsed }: {
        parsed: any;
    }): void;
    function borderLeftWidth(node: any, { parsed }: {
        parsed: any;
    }): void;
    function borderRightWidth(node: any, { parsed }: {
        parsed: any;
    }): void;
    function borderBottomWidth(node: any, { parsed }: {
        parsed: any;
    }): void;
    function overflow(node: any, { parsed }: {
        parsed: any;
    }): void;
    function display(node: any, { parsed }: {
        parsed: any;
    }): void;
    function paddingTop(node: any, { parsed }: {
        parsed: any;
    }): void;
    function paddingLeft(node: any, { parsed }: {
        parsed: any;
    }): void;
    function paddingRight(node: any, { parsed }: {
        parsed: any;
    }): void;
    function paddingBottom(node: any, { parsed }: {
        parsed: any;
    }): void;
    function gap(node: any, { parsed }: {
        parsed: any;
    }): void;
    function rowGap(node: any, { parsed }: {
        parsed: any;
    }): void;
    function columnGap(node: any, { parsed }: {
        parsed: any;
    }): void;
    function direction(node: any, { parsed }: {
        parsed: any;
    }): void;
    function aspectRatio(node: any, { parsed }: {
        parsed: any;
    }): void;
}
