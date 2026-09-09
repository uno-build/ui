export function getTextFont(node: any, font_manager: any): any;
export function getTextFontSize(node: any, computeStyle: any): any;
export function getTextNaturalLineHeight(font: any, font_size: any): number;
export function getTextLineHeight(node: any, natural_line_height: any, font_size: any, computeStyle: any): any;
export function getTextRasterMetrics(font: any, font_size: any, device_pixel_ratio: any): {
    ascender: number;
    descender: number;
};
export function getTextWhiteSpace(node: any): any;
export function measureGlyphAdvances(font: any, font_size: any, text: any): number;
export function getTextLayout(record: any, prepared_text: any, layout_width: any, line_height: any): any;
export function constrainMeasuredSize(measured_size: any, available_size: any, measure_mode: any): any;
export function roundToDevicePixel(value: any, device_pixel_ratio: any): number;
export const TEXT_MEASURE_STYLE_NAMES: any[];
