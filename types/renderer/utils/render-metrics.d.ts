export function createNodeMetricsResolver(single_record_parts?: number): (node: any) => any;
export function isNodeClipped({ x, y, clip }: {
    x: any;
    y: any;
    clip: any;
}, width: any, height: any): boolean;
export function getNodeDrawingData(node: any, computeStyleValue: any, getNodeMetrics: any): {
    layout: any[];
    clipping: number[];
    opacity: any;
    border_radius_x: any[] | undefined;
    border_radius_y: any[] | undefined;
    border_color_top: any;
    border_color_right: any;
    border_color_bottom: any;
    border_color_left: any;
    border_widths: any[];
    background_color: any;
    box_shadow: number[];
} | null;
export function getNodeOpacity(node: any): number;
export function getNodeBorderWidth(node: any, side: any, computeStyleValue: any): any;
export function getNodeRenderLayout(node: any): {
    x: any;
    y: any;
    width: any;
    height: any;
};
export function updateScrollMetrics(node: any, getContentSize: any, scroll_nodes: any): {
    left: any;
    top: any;
    right: any;
    bottom: any;
};
export function clampScroll(node: any, scroll_nodes: any): void;
export function getAncestorClipping(node: any): {
    top: number;
    right: number;
    bottom: number;
    left: number;
} | null;
export function getBackgroundImageRect(node: any, image_size: any, computeStyleValue: any, border_widths: any): any[];
export function readBackgroundImageMode(node: any): any;
export function getMainAxisOverflow(node: any): any;
export function collectPanelData(node: any, image_manager: any, computeStyle: any, getNodeMetrics: any): {
    background_image_mode: number;
    background_uv_rect: number[];
    background_image_rect: number[];
    background_atlas_layer: number;
    layout: any[];
    clipping: number[];
    opacity: any;
    border_radius_x: any[] | undefined;
    border_radius_y: any[] | undefined;
    border_color_top: any;
    border_color_right: any;
    border_color_bottom: any;
    border_color_left: any;
    border_widths: any[];
    background_color: any;
    box_shadow: number[];
} | null;
export namespace FEATURES {
    let panel: boolean;
    let background_image: boolean;
    let border: boolean;
    let border_radius: boolean;
    let box_shadow: boolean;
    let text: boolean;
    let text_shadow: boolean;
    let text_stroke: boolean;
}
