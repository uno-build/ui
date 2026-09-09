export const FLOAT32_SIZE: 4;
export const UINT32_SIZE: 4;
export const RGBA8_SIZE: 4;
export const VIEWPORT_SIZE: number;
export const POSITION_VERTEX_COUNT: 6;
export const POSITION_VERTEX_FLOATS: 2;
export const POSITION_VERTEX_SIZE: number;
export const POSITION_VERTICES: Float32Array<ArrayBuffer>;
export const TRANSPARENT_COLOR: number[];
export const COMMAND_KIND_PANEL: 0;
export const COMMAND_KIND_GLYPH: 1;
export const COMMAND_KIND_TEXT_SHADOW: 2;
export const COMMAND_KIND_TEXT_STROKE: 3;
export namespace COMMAND {
    namespace KIND_DATA {
        let LOCATION: number;
        let OFFSET: number;
        let SIZE: number;
        let FORMAT: string;
    }
}
export const COMMAND_SIZE: number;
export namespace PANEL_DATA {
    namespace LAYOUT {
        let OFFSET_1: number;
        export { OFFSET_1 as OFFSET };
        let SIZE_1: number;
        export { SIZE_1 as SIZE };
    }
    namespace CLIPPING {
        let OFFSET_2: number;
        export { OFFSET_2 as OFFSET };
        let SIZE_2: number;
        export { SIZE_2 as SIZE };
    }
    namespace BORDER_RADIUS_X {
        let OFFSET_3: number;
        export { OFFSET_3 as OFFSET };
        let SIZE_3: number;
        export { SIZE_3 as SIZE };
    }
    namespace BORDER_RADIUS_Y {
        let OFFSET_4: number;
        export { OFFSET_4 as OFFSET };
        let SIZE_4: number;
        export { SIZE_4 as SIZE };
    }
    namespace BORDER_WIDTHS {
        let OFFSET_5: number;
        export { OFFSET_5 as OFFSET };
        let SIZE_5: number;
        export { SIZE_5 as SIZE };
    }
    namespace BACKGROUND_UV_RECT {
        let OFFSET_6: number;
        export { OFFSET_6 as OFFSET };
        let SIZE_6: number;
        export { SIZE_6 as SIZE };
    }
    namespace BACKGROUND_IMAGE_RECT {
        let OFFSET_7: number;
        export { OFFSET_7 as OFFSET };
        let SIZE_7: number;
        export { SIZE_7 as SIZE };
    }
    namespace IMAGE_DATA {
        let OFFSET_8: number;
        export { OFFSET_8 as OFFSET };
        let SIZE_8: number;
        export { SIZE_8 as SIZE };
    }
    namespace BORDER_COLORS {
        let OFFSET_9: number;
        export { OFFSET_9 as OFFSET };
        let SIZE_9: number;
        export { SIZE_9 as SIZE };
    }
    namespace BACKGROUND_COLOR {
        let OFFSET_10: number;
        export { OFFSET_10 as OFFSET };
        let SIZE_10: number;
        export { SIZE_10 as SIZE };
    }
    namespace BOX_SHADOW {
        let OFFSET_11: number;
        export { OFFSET_11 as OFFSET };
        let SIZE_11: number;
        export { SIZE_11 as SIZE };
    }
}
export namespace GLYPH_DATA {
    export namespace LAYOUT_1 {
        let OFFSET_12: number;
        export { OFFSET_12 as OFFSET };
        let SIZE_12: number;
        export { SIZE_12 as SIZE };
    }
    export { LAYOUT_1 as LAYOUT };
    export namespace UV_RECT {
        let OFFSET_13: number;
        export { OFFSET_13 as OFFSET };
        let SIZE_13: number;
        export { SIZE_13 as SIZE };
    }
    export namespace RUN_DATA {
        let OFFSET_14: number;
        export { OFFSET_14 as OFFSET };
        let SIZE_14: number;
        export { SIZE_14 as SIZE };
    }
}
export namespace TEXT_RUN {
    export namespace COLOR {
        let OFFSET_15: number;
        export { OFFSET_15 as OFFSET };
        let SIZE_15: number;
        export { SIZE_15 as SIZE };
    }
    export namespace FONT_DATA {
        let OFFSET_16: number;
        export { OFFSET_16 as OFFSET };
        let SIZE_16: number;
        export { SIZE_16 as SIZE };
    }
    export namespace CLIPPING_1 {
        let OFFSET_17: number;
        export { OFFSET_17 as OFFSET };
        let SIZE_17: number;
        export { SIZE_17 as SIZE };
    }
    export { CLIPPING_1 as CLIPPING };
    export namespace TEXT_SHADOW {
        let OFFSET_18: number;
        export { OFFSET_18 as OFFSET };
        let SIZE_18: number;
        export { SIZE_18 as SIZE };
    }
    export namespace TEXT_SHADOW_COLOR {
        let OFFSET_19: number;
        export { OFFSET_19 as OFFSET };
        let SIZE_19: number;
        export { SIZE_19 as SIZE };
    }
    export namespace TEXT_STROKE_WIDTH {
        let OFFSET_20: number;
        export { OFFSET_20 as OFFSET };
        export { FLOAT32_SIZE as SIZE };
    }
    export namespace EFFECT_DISTANCE_RANGE {
        let OFFSET_21: number;
        export { OFFSET_21 as OFFSET };
        export { FLOAT32_SIZE as SIZE };
    }
    export namespace TEXT_STROKE_MULTISAMPLING {
        let OFFSET_22: number;
        export { OFFSET_22 as OFFSET };
        export { FLOAT32_SIZE as SIZE };
    }
    export namespace TEXT_STROKE_COLOR {
        let OFFSET_23: number;
        export { OFFSET_23 as OFFSET };
        let SIZE_20: number;
        export { SIZE_20 as SIZE };
    }
}
export const TEXT_RUN_SIZE: number;
export const PANEL_DATA_SIZE: number;
export const GLYPH_DATA_SIZE: number;
export namespace ATTRIBUTES { }
export const ATTRIBUTES_SIZE: number;
export namespace TEXT_ATTRIBUTES { }
export const TEXT_ATTRIBUTES_SIZE: number;
