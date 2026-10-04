import type { ReactElement, ReactNode, Ref } from 'react'
import type { NodeEventMap } from '../../events'
import type { StyleProps } from '../../style/types'
import type { BaseProps, ImageOptions, InputOptions, NodeHandle, ScrollViewHandle, InputHandle } from '../props'
import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { CORE_EVENT } from '../../core/constants'
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
import { useUI } from './context'

export type { StyleProps, StyleName } from '../../style/types'
export type { NodeHandle, ScrollViewHandle, InputHandle } from '../props'
export type ComponentProps<TRef = NodeHandle> = BaseProps & { children?: ReactNode; ref?: Ref<TRef> }
export type TextChildren = string | number | boolean | null | undefined | readonly TextChildren[]
export type TextProps = Omit<ComponentProps, 'children'> & { children?: TextChildren }
export type ImageProps = Omit<ComponentProps, 'style'> & ImageOptions
export type ScrollViewProps = ComponentProps<ScrollViewHandle> & { horizontal?: boolean }
export type InputProps = Omit<ComponentProps<InputHandle>, 'style'> & InputOptions & {
    style?: StyleProps
    caretVisible?: boolean
    caretPosition?: number
}

export function View(props: ComponentProps): ReactElement {
    return <view {...props}>{props.children}</view>
}

export function Text({ children, ...props }: TextProps): ReactElement {
    return <text {...props} value={joinText(children)} />
}

export function Image({ src, width, height, style, ...props }: ImageProps): ReactElement {
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

export function ScrollView({ ref, children, horizontal = false, style, ...props }: ScrollViewProps): ReactElement {
    const main_ref = useRef<NodeHandle | null>(null)
    const content_ref = useRef<NodeHandle | null>(null)

    useImperativeHandle(
        ref,
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
    caretVisible: show_caret = true,
    caretPosition: caret_position,
    onFocus,
    onBlur,
    onPointerDown,
    ...props
}: InputProps): ReactElement {
    const ui = useUI()
    const input_ref = useRef<NodeHandle | null>(null)
    const content_ref = useRef<NodeHandle | null>(null)
    const text_ref = useRef<NodeHandle | null>(null)
    const caret_ref = useRef<NodeHandle | null>(null)
    const [is_focused, setIsFocused] = useState(false)
    const [caret_visible, setCaretVisible] = useState(true)
    const value_text = joinText(value)
    const show_placeholder = showInputPlaceholder(value, placeholder, is_focused)

    function handleFocus(event: NodeEventMap['focus']) {
        setIsFocused(true)
        onFocus?.(event)
    }

    function handleBlur(event: NodeEventMap['blur']) {
        setIsFocused(false)
        onBlur?.(event)
    }

    function handlePointerDown(event: NodeEventMap['pointerdown']) {
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
        if (!is_focused || !show_caret) {
            return
        }

        setCaretVisible(true)
        const interval_id = setInterval(() => setCaretVisible((visible) => !visible), 500)
        return () => clearInterval(interval_id)
    }, [is_focused, show_caret, value, caret_position])

    useLayoutEffect(() => {
        const content = content_ref.current!.nodes.main
        const text = text_ref.current!.nodes.main
        const caret = caret_ref.current?.nodes.main
        const position = Math.max(0, Math.min(caret_position ?? value_text.length, value_text.length))
        let active = true
        let scheduled = false

        function updateCaret() {
            if (!active) {
                return
            }

            const text_width = show_placeholder || value_text.length > 0
                ? ui.renderer!.getTextCaretOffset(text, text.text_content!.length)
                : 0
            const caret_width = is_focused && show_caret ? 1 : 0
            const content_width = content.layout.width!
            const free_space = Math.max(0, content_width - text_width - caret_width)
            const alignment_offset =
                style.textAlign === 'right' ? free_space : style.textAlign === 'center' ? free_space / 2 : 0
            const caret_left = alignment_offset + ui.renderer!.getTextCaretOffset(text, position)

            text.style('width', `${text_width + caret_width}px`)
            content.style('justifyContent', text_width + caret_width > content_width
                ? 'flex-start'
                : getInputContentStyle(style).justifyContent)
            caret?.style('left', `${caret_left}px`)
            content.scrollLeft = is_focused
                ? Math.max(0, Math.min(content.scrollLeft, caret_left), caret_left + caret_width - content_width)
                : 0
            ui.update()
        }

        updateCaret()
        const stopObserving = ui.events_source.on(CORE_EVENT.UPDATED, ({ operations }) => {
            if (operations.needUpdateLayout() && !scheduled) {
                scheduled = true
                queueMicrotask(() => {
                    scheduled = false
                    updateCaret()
                })
            }
        })

        return () => {
            active = false
            stopObserving()
        }
    }, [ui, is_focused, show_caret, caret_position, value, placeholder, style])

    useImperativeHandle(
        ref,
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

    return (
        <view
            ref={input_ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onPointerDown={handlePointerDown}
            style={getInputStyle(style)}
            {...props}
        >
            <view ref={content_ref} style={{ ...getInputContentStyle(style), position: 'relative' }}>
                <text
                    ref={text_ref}
                    style={{
                        ...getInputTextStyle(style, show_placeholder, placeholder_text_color),
                        ...(style.fontSize !== undefined && { fontSize: style.fontSize }),
                        whiteSpace: 'pre',
                        textAlign: 'left',
                        flexShrink: '0',
                    }}
                    value={joinText(getInputTextValue(value, placeholder, show_placeholder))}
                />
                {is_focused && show_caret && (
                    <view
                        ref={caret_ref}
                        style={{ ...getInputCaretStyle(style, caret_visible), position: 'absolute', marginLeft: '0px' }}
                    />
                )}
            </view>
        </view>
    )
}

function joinText(children: unknown): string {
    if (children == null || typeof children === 'boolean') {
        return ''
    }
    if (Array.isArray(children)) {
        return children.map(joinText).join('')
    }
    if (typeof children !== 'string' && typeof children !== 'number') {
        throw new Error('<Text> cannot have children.')
    }
    return String(children)
}

// Local host JSX types; the build uses React's automatic JSX runtime.
declare namespace React {
    namespace JSX {
        type Element = ReactElement
        interface ElementChildrenAttribute {
            children: {}
        }
        interface IntrinsicElements {
            view: ComponentProps
            text: Omit<ComponentProps, 'children'> & { value: string }
        }
    }
}
