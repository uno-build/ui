import { createEffect, createSignal, flatten, omit } from 'solid-js'
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

export function View(props) {
    return <view {...props}>{props.children}</view>
}

export function Text(props) {
    return <text {...omit(props, 'children')} value={joinText(props.children)} />
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

export function ScrollView(props) {
    let main_node
    let content_node

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

    props.ref?.({ nodes: { main: main_node, content: content_node } })

    return tree
}

export function Input(props) {
    let input_node
    let content_node
    let text_node
    let caret_node
    const [isFocused, setIsFocused] = createSignal(false)
    const [caretVisible, setCaretVisible] = createSignal(true)

    function onFocus(event) {
        setIsFocused(true)
        props.onFocus?.(event)
    }

    function onBlur(event) {
        setIsFocused(false)
        props.onBlur?.(event)
    }

    function onPointerDown(event) {
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

    createEffect(
        () => [isFocused(), props.value],
        ([is_focused]) => {
            if (is_focused === false) {
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
                'onFocus',
                'onBlur',
                'onPointerDown',
            )}
        >
            <view ref={content_node} style={getInputContentStyle(props.style)}>
                <text
                    ref={text_node}
                    style={getInputTextStyle(props.style, showPlaceholder(), props.placeholderTextColor ?? '#777777')}
                    value={getInputTextValue(props.value, props.placeholder, showPlaceholder())}
                />
                {isFocused() && <view ref={caret_node} style={getInputCaretStyle(props.style, caretVisible())} />}
            </view>
        </view>
    )

    props.ref?.({
        get nodes() {
            return {
                main: input_node,
                content: content_node,
                text: text_node,
                caret: isFocused() ? caret_node : null,
            }
        },
        focus,
        blur,
    })

    return tree
}

// HELPERS

function joinText(children) {
    const values = flatten(children, { skipNonRendered: true })
    return (Array.isArray(values) ? values : [values ?? '']).map(toTextValue).join('')
}

function toTextValue(value) {
    if (typeof value !== 'string' && typeof value !== 'number') {
        throw new Error('<Text> cannot have children.')
    }

    return value
}
