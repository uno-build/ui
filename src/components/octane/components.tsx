import { useImperativeHandle, useRef } from 'octane'
import { useUI } from './context'
import { getImageStyle, getScrollViewStyle, getScrollContentStyle } from '../utils'

export function View({ children, ...props }) {
    return <view {...props}>{children}</view>
}

export function Text({ children, ...props }) {
    return <text {...props}>{children}</text>
}

export function Image({ src, width, height, style, ...props }) {
    const ui = useUI()
    return (
        <view
            {...props}
            style={getImageStyle(ui.resources, src, {
                ...(width !== undefined && { width }),
                ...(height !== undefined && { height }),
                ...style,
            })}
        />
    )
}

export function ScrollView({ children, horizontal = false, style, ...props }) {
    return (
        <view {...props} style={getScrollViewStyle(horizontal, style)}>
            <view style={getScrollContentStyle(horizontal)}>{children}</view>
        </view>
    )
}

export function Input({ ref, style = {}, value, ...props }) {
    const input_ref = useRef(null)

    function focus() {}
    function blur() {}

    useImperativeHandle(
        ref ?? null,
        () => {
            return { node: input_ref.current.node, focus, blur }
        },
        [],
    )

    const text_value = value == undefined || value == null || value === '' ? '\u00A0' : value
    const text_style = {
        whiteSpace: 'nowrap',
        ...(style.fontFamily !== undefined && { fontFamily: style.fontFamily }),
        ...(style.lineHeight !== undefined && { lineHeight: style.lineHeight }),
        ...(style.letterSpacing !== undefined && { letterSpacing: style.letterSpacing }),
        ...(style.color !== undefined && { color: style.color }),
        ...(style.textAlign !== undefined && { textAlign: style.textAlign }),
        ...(style.textShadow !== undefined && { textShadow: style.textShadow }),
        ...(style.textStroke !== undefined && { textStroke: style.textStroke }),
    }

    return (
        <view
            ref={input_ref}
            style={{
                backgroundColor: '#ffffff',
                border: '1px solid #777777',
                width: '100%',
                ...style,
            }}
            {...props}
        >
            <view style={{ flex: '1', overflowX: 'hidden' }}>
                <text style={text_style}>{text_value}</text>
            </view>
        </view>
    )
}
