export function getImageStyle(resources: any, src: any, style?: {}): {
    backgroundImage: any;
    backgroundSize: any;
    backgroundPosition: string;
};
export function getScrollViewStyle(horizontal: any, style?: {}): {
    flexDirection: string;
};
export function getScrollContentStyle(horizontal: any, style?: {}): {
    flexDirection: string;
    flexShrink: string;
};
export function getInputStyle(style?: {}): {
    backgroundColor: string;
    border: string;
    width: string;
};
export function getInputContentStyle(style?: {}): {
    flex: string;
    flexDirection: string;
    alignItems: string;
    justifyContent: string;
    overflowX: string;
    pointerEvents: string;
};
export function getInputTextStyle(style: {} | undefined, show_placeholder: any, placeholder_text_color: any): {
    textStroke?: any;
    textShadow?: any;
    textAlign?: any;
    color?: any;
    letterSpacing?: any;
    lineHeight?: any;
    fontFamily?: any;
    whiteSpace: string;
    pointerEvents: string;
};
export function getInputCaretStyle(style: {} | undefined, caret_visible: any): {
    backgroundColor: any;
    width: string;
    height: string;
    marginLeft: string;
    flexShrink: string;
    opacity: string;
    pointerEvents: string;
};
export function showInputPlaceholder(value: any, placeholder: any, is_focused: any): boolean;
export function getInputTextValue(value: any, placeholder: any, show_placeholder: any): any;
