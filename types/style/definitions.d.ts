export const UNSET_DEFINITION: {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
}[];
export const INTEGER_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateInteger)[];
    parse: (typeof parseInteger)[];
})[];
export const COLOR_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateColor)[];
    parse: (typeof parseColor)[];
})[];
export const OPACITY_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateNumber)[];
    parse: (typeof parseNumber)[];
})[];
export const BOX_SHADOW_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateBoxShadow)[];
    parse: (typeof parseBoxShadow)[];
})[];
export const TEXT_SHADOW_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateTextShadow)[];
    parse: (typeof parseTextShadow)[];
})[];
export const TEXT_STROKE_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateTextStroke)[];
    parse: (typeof parseTextStroke)[];
})[];
export const FONT_FAMILY_DEFINITION: {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateNotUnset)[];
    parse: (typeof parseString)[];
}[];
export const FONT_SIZE_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validatePx)[];
    parse: (typeof parsePx)[];
})[];
export const LINE_HEIGHT_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateNumber)[];
    parse: (typeof parseNumber)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validatePx)[];
    parse: (typeof parsePx)[];
})[];
export const LETTER_SPACING_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validatePx)[];
    parse: (typeof parsePx)[];
})[];
export const TEXT_ALIGN_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const WHITE_SPACE_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const PX_PERCENT_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validatePx)[];
    parse: (typeof parsePx)[];
})[];
export const OFFSET_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validatePx)[];
    parse: (typeof parsePx)[];
})[];
export const OVERFLOW_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const POSITION_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const ALIGN_CONTENT_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const ALIGN_ITEMS_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const ALIGN_SELF_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const FLEX_DIRECTION_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const FLEX_WRAP_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const JUSTIFY_CONTENT_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const MARGIN_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validatePx)[];
    parse: (typeof parsePx)[];
})[];
export const NUMBER_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateNumber)[];
    parse: (typeof parseNumber)[];
})[];
export const FLEX_BASIS_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validatePx)[];
    parse: (typeof parsePx)[];
})[];
export const SIZE_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validatePx)[];
    parse: (typeof parsePx)[];
})[];
export const MIN_MAX_SIZE_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validatePx)[];
    parse: (typeof parsePx)[];
})[];
export const BORDER_WIDTH_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validatePx)[];
    parse: (typeof parsePx)[];
})[];
export const BORDER_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const BOX_SIZING_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const DISPLAY_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const POINTER_EVENTS_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const DIRECTION_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const BACKGROUNDIMAGE_DEFINITION: {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateImageSrc)[];
    parse: (typeof parseString)[];
}[];
export const BACKGROUND_SIZE_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validatePx)[];
    parse: (typeof parsePx)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const BACKGROUND_REPEAT_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: ((value: string) => void)[];
    parse: ((value: string) => {
        value: string;
        parsed: {
            enum: any;
        };
    })[];
})[];
export const BACKGROUND_POSITION_DEFINITION: ({
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validateUnset)[];
    parse: (typeof parseUnset)[];
} | {
    normalize: (typeof normalizeTrim)[];
    validate: (typeof validatePx)[];
    parse: (typeof parsePx)[];
})[];
import { normalizeTrim } from './normalizers';
import { validateUnset } from './validators';
import { parseUnset } from './parsers';
import { validateInteger } from './validators';
import { parseInteger } from './parsers';
import { validateColor } from './validators';
import { parseColor } from './parsers';
import { validateNumber } from './validators';
import { parseNumber } from './parsers';
import { validateBoxShadow } from './validators';
import { parseBoxShadow } from './parsers';
import { validateTextShadow } from './validators';
import { parseTextShadow } from './parsers';
import { validateTextStroke } from './validators';
import { parseTextStroke } from './parsers';
import { validateNotUnset } from './validators';
import { parseString } from './parsers';
import { validatePx } from './validators';
import { parsePx } from './parsers';
import { validateImageSrc } from './validators';
