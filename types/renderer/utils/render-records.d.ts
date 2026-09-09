export function createRecord(): {
    panel_slot: number;
    run_slot: number;
    glyph_start: number;
    glyph_count: number;
    glyph_capacity: number;
    has_text_shadow: boolean;
    text_shadow: number[];
    text_stroke_width: number;
    prepared_text: undefined;
    layout_width: number;
    line_height: number;
    text_layout: undefined;
};
export function createCommands(nodes: any, records: any): ({
    kind: number;
    panel_index: any;
    glyph_index: number;
    text_stroke_width?: undefined;
} | {
    kind: number;
    panel_index: number;
    glyph_index: any;
    text_stroke_width: any;
} | {
    kind: number;
    panel_index: number;
    glyph_index: any;
    text_stroke_width?: undefined;
})[];
