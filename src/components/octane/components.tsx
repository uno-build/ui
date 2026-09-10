/** @jsxRuntime classic */
import type { JSX as OctaneJSX, OctaneNode, Ref } from 'octane'
import type Node from '../../core/Node'
import type { StyleProps } from '../../style/types'
import type { BaseProps, ImageOptions, InputOptions, NodeHandle, ScrollViewHandle, InputHandle } from '../props'
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

export type { StyleProps, StyleName } from '../../style/types'
export type { NodeHandle, ScrollViewHandle, InputHandle } from '../props'
export type ComponentProps<TRef = NodeHandle> = BaseProps & { children?: OctaneNode; ref?: Ref<TRef> }
export type ImageProps = Omit<ComponentProps, 'style'> & ImageOptions
export type ScrollViewProps = ComponentProps<ScrollViewHandle> & { horizontal?: boolean }
export type InputProps = Omit<ComponentProps<InputHandle>, 'style'> & InputOptions & { style?: StyleProps }

export function View({ children, ...props }: ComponentProps) {
    return <view {...props}>{children}</view>
}

export function Text({ children, ...props }: ComponentProps) {
    return <text {...props}>{children}</text>
}

export function Image({ src, width, height, style, ...props }: ImageProps) {
    const ui = useUI()
    return (
        <view
            {...props}
            style={getImageStyle(ui.resources!, src, {
                ...(width !== undefined && { width }),
                ...(height !== undefined && { height }),
                ...style,
            })}
        />
    )
}

export function ScrollView({ ref, children, horizontal = false, style, ...props }: ScrollViewProps) {
    const main_ref = useRef<NodeHandle | null>(null)
    const content_ref = useRef<NodeHandle | null>(null)

    useImperativeHandle(
        ref ?? null,
        () => ({
            nodes: {
                main: main_ref.current!.nodes.main,
                content: content_ref.current!.nodes.main,
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
}: InputProps) {
    const input_ref = useRef<NodeHandle | null>(null)
    const content_ref = useRef<NodeHandle | null>(null)
    const text_ref = useRef<NodeHandle | null>(null)
    const caret_ref = useRef<NodeHandle | null>(null)
    const [is_focused, setIsFocused] = useState(false)
    const [caret_visible, setCaretVisible] = useState(true)

    function handleFocus(event: import('../../events/types').NodeEventMap['focus']) {
        setIsFocused(true)
        onFocus?.(event)
    }

    function handleBlur(event: import('../../events/types').NodeEventMap['blur']) {
        setIsFocused(false)
        onBlur?.(event)
    }

    function handlePointerDown(event: import('../../events/types').NodeEventMap['pointerdown']) {
        event.source_event.preventDefault()
        onPointerDown?.(event)
    }

    function focus() {
        input_ref.current!.nodes.main.focus()
    }

    function blur() {
        input_ref.current!.nodes.main.blur()
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
                    main: input_ref.current!.nodes.main,
                    content: content_ref.current!.nodes.main,
                    text: text_ref.current!.nodes.main,
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

// Local host JSX types; the framework compiler handles the JSX output.
declare namespace React {
    namespace JSX {
        type Element = OctaneJSX.Element
        interface ElementChildrenAttribute {
            children: {}
        }
        interface IntrinsicElements {
            view: ComponentProps<NodeHandle>
            text: ComponentProps<NodeHandle> & { value?: string | number | null }
        }
    }
}
