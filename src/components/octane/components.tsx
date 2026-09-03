import { useEffect, useImperativeHandle, useRef, useState } from 'octane'
import { useUI } from './context'
import {
    getImageStyle,
    getInputCaretStyle,
    getInputContentStyle,
    getInputStyle,
    getInputTextStyle,
    getInputTextValue,
    getScrollContentStyle,
    getScrollViewStyle,
    showInputPlaceholder,
} from '../shared'

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

export function ScrollView({ ref, children, horizontal = false, style, ...props }) {
    const main_ref = useRef(null)
    const content_ref = useRef(null)

    useImperativeHandle(
        ref ?? null,
        () => ({
            nodes: {
                main: main_ref.current.nodes.main,
                content: content_ref.current.nodes.main,
            },
        }),
        [],
    )

    return (
        <view ref={main_ref} {...props} style={getScrollViewStyle(horizontal, style)}>
            <view ref={content_ref} style={getScrollContentStyle(horizontal)}>
                {children}
            </view>
        </view>
    )
}

export function Input({
    ref,
    style = {},
    value,
    placeholder,
    placeholderTextColor: placeholder_text_color = '#777777',
    onFocus,
    onBlur,
    onPointerDown,
    ...props
}) {
    const input_ref = useRef(null)
    const content_ref = useRef(null)
    const text_ref = useRef(null)
    const caret_ref = useRef(null)
    const [is_focused, setIsFocused] = useState(false)
    const [caret_visible, setCaretVisible] = useState(true)

    function handleFocus(event) {
        setIsFocused(true)
        onFocus?.(event)
    }

    function handleBlur(event) {
        setIsFocused(false)
        onBlur?.(event)
    }

    function handlePointerDown(event) {
        event.source_event.preventDefault()
        onPointerDown?.(event)
    }

    function focus() {
        input_ref.current.nodes.main.focus()
    }

    function blur() {
        input_ref.current.nodes.main.blur()
    }

    useEffect(() => {
        if (!is_focused) {
            return
        }

        setCaretVisible(true)

        const interval_id = setInterval(() => {
            setCaretVisible((visible) => !visible)
        }, 500)

        return () => clearInterval(interval_id)
    }, [is_focused, value])

    useImperativeHandle(
        ref ?? null,
        () => ({
            get nodes() {
                return {
                    main: input_ref.current.nodes.main,
                    content: content_ref.current.nodes.main,
                    text: text_ref.current.nodes.main,
                    caret: caret_ref.current?.nodes.main ?? null,
                }
            },
            focus,
            blur,
        }),
        [],
    )

    const show_placeholder = showInputPlaceholder(value, placeholder, is_focused)

    return (
        <view
            ref={input_ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onPointerDown={handlePointerDown}
            style={getInputStyle(style)}
            {...props}
        >
            <view ref={content_ref} style={getInputContentStyle(style)}>
                <text ref={text_ref} style={getInputTextStyle(style, show_placeholder, placeholder_text_color)}>
                    {getInputTextValue(value, placeholder, show_placeholder)}
                </text>
                {is_focused && <view ref={caret_ref} style={getInputCaretStyle(style, caret_visible)} />}
            </view>
        </view>
    )
}
