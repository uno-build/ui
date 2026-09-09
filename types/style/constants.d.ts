export const ROOT_SIZE: 16;
export const RECORD_PANEL: 1;
export const RECORD_TEXT_RUN: 2;
export const RECORD_GLYPHS: 4;
export const RECORD_TEXT: number;
export const RECORD_ALL: number;
export namespace KEYWORD {
    let AUTO: string;
    let UNSET: string;
}
export namespace UNIT {
    let PX: string;
    let PERCENT: string;
    let REM: string;
    let VW: string;
    let VH: string;
}
export namespace EDGE {
    let left: number;
    let top: number;
    let right: number;
    let bottom: number;
    let start: number;
    let end: number;
    let horizontal: number;
    let vertical: number;
    let all: number;
}
export namespace GUTTER {
    export let column: number;
    export let row: number;
    let all_1: number;
    export { all_1 as all };
}
export namespace POSITION {
    let _static: number;
    export { _static as static };
    export let relative: number;
    export let absolute: number;
}
export const ALIGN_CONTENT: {
    'flex-start': number;
    center: number;
    'flex-end': number;
    stretch: number;
    baseline: number;
    'space-between': number;
    'space-around': number;
    'space-evenly': number;
};
export const ALIGN_ITEMS: {
    normal: number;
    'flex-start': number;
    center: number;
    'flex-end': number;
    stretch: number;
    baseline: number;
};
export const ALIGN_SELF: {
    auto: number;
    normal: number;
    'flex-start': number;
    center: number;
    'flex-end': number;
    stretch: number;
    baseline: number;
};
export const FLEX_DIRECTION: {
    column: number;
    'column-reverse': number;
    row: number;
    'row-reverse': number;
};
export const WRAP: {
    nowrap: number;
    wrap: number;
    'wrap-reverse': number;
};
export const JUSTIFY: {
    'flex-start': number;
    center: number;
    'flex-end': number;
    'space-between': number;
    'space-around': number;
    'space-evenly': number;
};
export namespace OVERFLOW {
    let visible: number;
    let hidden: number;
    let scroll: number;
}
export namespace DISPLAY {
    let flex: number;
    let none: number;
    let contents: number;
}
export namespace POINTER_EVENTS {
    let all_2: number;
    export { all_2 as all };
    let none_1: number;
    export { none_1 as none };
}
export namespace DIRECTION {
    let inherit: number;
    let ltr: number;
    let rtl: number;
}
export const BOX_SIZING: {
    'border-box': number;
    'content-box': number;
};
export namespace BORDER_STYLE {
    let none_2: number;
    export { none_2 as none };
    export let solid: number;
}
export namespace BACKGROUND_SIZE {
    let cover: number;
    let contain: number;
}
export const BACKGROUND_REPEAT: {
    'no-repeat': number;
    repeat: number;
    'repeat-x': number;
    'repeat-y': number;
};
export namespace TEXT_ALIGN {
    let left_1: number;
    export { left_1 as left };
    let right_1: number;
    export { right_1 as right };
    export let center: number;
    export let justify: number;
}
export const WHITE_SPACE: {
    normal: number;
    nowrap: number;
    'pre-wrap': number;
};
export namespace MEASURE_MODE {
    let UNDEFINED: string;
    let EXACTLY: string;
    let AT_MOST: string;
}
