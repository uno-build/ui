/** @jsxRuntime classic */
import type { Element as SolidElement, Ref } from 'solid-js'
import type Node from '../../core/Node'
import type { NodeEventMap } from '../../events'
import type { StyleProps } from '../../style/types'
import type { BaseProps, ImageOptions, InputOptions, NodeHandle, ScrollViewHandle, InputHandle } from '../props'
import { createEffect, createSignal, flatten, omit } from 'solid-js'
import { CORE_EVENT } from '../../core/constants'
import { useUI } from './context'
import {
    getImageStyle,
    getInputCaretStyle,
    getInputContentStyle,
    getInputSelection,
    getInputStyle,
    getInputTextStyle,
    getInputTextValue,
    getScrollContentStyle,
    getScrollViewStyle,
    showInputPlaceholder,
    updateInputLayout,
} from '../shared'

export type { StyleProps, StyleName } from '../../style/types'
export type { NodeHandle, ScrollViewHandle, InputHandle } from '../props'
export type ComponentProps<TRef = Node> = BaseProps & { children?: SolidElement; ref?: Ref<TRef> }
export type ImageProps = Omit<ComponentProps, 'style'> & ImageOptions
export type ScrollViewProps = ComponentProps<ScrollViewHandle> & { horizontal?: boolean }
export type InputProps = Omit<ComponentProps<InputHandle>, 'style'> & InputOptions & { style?: StyleProps }

export function View(props: ComponentProps) {
    return <view {...props}>{props.children}</view>
}

export function Text(props: ComponentProps) {
    return <text {...omit(props, 'children')} value={joinText(props.children)} />
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

export function ScrollView(props: ScrollViewProps) {
    let main_node!: Node
    let content_node!: Node

    const tree = (
        <view
            ref={main_node}
            {...omit(props, 'ref', 'children', 'horizontal', 'style')}
            style={getScrollViewStyle(props.horizontal ?? false, props.style)}
        >
            <view ref={content_node} style={getScrollContentStyle(props.horizontal ?? false)}>
                {props.children}
            </view>
        </view>
    )

    ;(props.ref as ((handle: ScrollViewHandle) => void) | undefined)?.({
        nodes: { main: main_node, content: content_node },
    })

    return tree
}

export function Input(props: InputProps) {
    const ui = useUI()
    let input_node!: Node
    let content_node!: Node
    let text_node!: Node
    let caret_node!: Node
    let selection_node!: Node
    const [isFocused, setIsFocused] = createSignal(false)
    const [caretVisible, setCaretVisible] = createSignal(true)

    function onFocus(event: NodeEventMap['focus']) {
        setIsFocused(true)
        props.onFocus?.(event)
    }

    function onBlur(event: NodeEventMap['blur']) {
        setIsFocused(false)
        props.onBlur?.(event)
    }

    function onPointerDown(event: NodeEventMap['pointerdown']) {
        event.source_event.preventDefault()
        props.onPointerDown?.(event)
    }

    function focus() {
        input_node.focus()
    }

    function blur() {
        input_node.blur()
    }

    function showPlaceholder() {
        return showInputPlaceholder(props.value, props.placeholder, isFocused())
    }

    function showCaret() {
        return props.caretVisible ?? true
    }

    function showSelection() {
        const { start, end } = getInputSelection(props)
        return isFocused() && end > start
    }

    createEffect(
        () => [isFocused(), showCaret(), props.value, getInputSelection(props).position],
        ([is_focused, show_caret]) => {
            if (!is_focused || !show_caret) {
                return
            }

            setCaretVisible(true)
            const interval_id = setInterval(() => setCaretVisible((visible) => !visible), 500)

            return () => clearInterval(interval_id)
        },
    )

    const tree = (
        <view
            ref={input_node}
            onFocus={onFocus}
            onBlur={onBlur}
            onPointerDown={onPointerDown}
            style={getInputStyle(props.style)}
            {...omit(
                props,
                'ref',
                'style',
                'value',
                'placeholder',
                'placeholderTextColor',
                'caretVisible',
                'caretPosition',
                'selection',
                'selectionColor',
                'onFocus',
                'onBlur',
                'onPointerDown',
            )}
        >
            <view ref={content_node} style={getInputContentStyle(props.style)}>
                {showSelection() && (
                    <view
                        ref={selection_node}
                        style={{
                            position: 'absolute',
                            backgroundColor: props.selectionColor ?? '#3390ff55',
                            pointerEvents: 'none',
                        }}
                    />
                )}
                <text
                    ref={text_node}
                    style={getInputTextStyle(props.style, showPlaceholder(), props.placeholderTextColor ?? '#777777')}
                    value={joinText(getInputTextValue(props.value, props.placeholder, showPlaceholder()))}
                />
                {isFocused() && showCaret() && <view ref={caret_node} style={getInputCaretStyle(props.style, caretVisible())} />}
            </view>
        </view>
    )

    createEffect(
        () => ({
            value: props.value,
            placeholder: props.placeholder,
            style: props.style,
            caretVisible: showCaret(),
            caretPosition: props.caretPosition,
            selection: props.selection,
            is_focused: isFocused(),
        }),
        ({ is_focused, ...options }) => {
            let active = true
            let scheduled = false

            function updateCaret() {
                if (!active) {
                    return
                }

                ui.update()
                updateInputLayout({
                    content: content_node,
                    text: text_node,
                    caret: is_focused && options.caretVisible ? caret_node : null,
                    selection: showSelection() ? selection_node : null,
                }, options, is_focused)
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
        },
    )

    ;(props.ref as ((handle: InputHandle) => void) | undefined)?.({
        get nodes() {
            return {
                main: input_node,
                content: content_node,
                text: text_node,
                caret: isFocused() && showCaret() ? caret_node : null,
            }
        },
        focus,
        blur,
    })

    return tree
}

// HELPERS

function joinText(children: SolidElement) {
    const values = flatten(children, { skipNonRendered: true })
    return (Array.isArray(values) ? values : [values ?? '']).map(toTextValue).join('')
}

function toTextValue(value: unknown) {
    if (typeof value !== 'string' && typeof value !== 'number') {
        throw new Error('<Text> cannot have children.')
    }

    return value
}

// Local host JSX types; the framework compiler handles the JSX output.
declare namespace React {
    namespace JSX {
        type Element = SolidElement
        interface ElementChildrenAttribute {
            children: {}
        }
        interface IntrinsicElements {
            view: ComponentProps<Node>
            text: ComponentProps<Node> & { value?: string | number | null }
        }
    }
}
