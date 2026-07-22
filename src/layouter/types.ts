export const MEASURE_MODE = {
    UNDEFINED: 'undefined',
    EXACTLY: 'exactly',
    AT_MOST: 'at-most',
} as const

export type MeasureMode = (typeof MEASURE_MODE)[keyof typeof MEASURE_MODE]

export type MeasureFunction = (
    width: number,
    width_mode: MeasureMode,
    height: number,
    height_mode: MeasureMode,
) => {
    width: number
    height: number
}

export interface LayoutEdges {
    top: number
    right: number
    bottom: number
    left: number
}

export interface LayoutMetrics {
    x: number
    y: number
    width: number
    height: number
    left: number
    top: number
    centerX: number
    centerY: number
    padding: LayoutEdges
    border: LayoutEdges
}

export interface LayoutEngine {
    createNode(node: any): void
    getChildIndex(node: any): number
    insertChild(parent: any, node: any, child_index: number): void
    removeChild(parent: any, node: any): void
    applyStyle(node: any, style: any): void
    setMeasureFunction(node: any, measure_function: MeasureFunction): void
    markDirty(node: any): void
    calculate(width?: number, height?: number): void
    getLayout(node: any): LayoutMetrics
}
