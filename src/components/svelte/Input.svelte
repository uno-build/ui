<script lang="ts">
import type {} from './elements'
import type { NodeEventMap } from '../../events'
import type { NodeHandle } from '../props'
import type { InputProps } from './props'
import {
    getInputCaretStyle,
    getInputContentStyle,
    getInputStyle,
    getInputTextStyle,
    getInputTextValue,
    showInputPlaceholder,
} from '../shared'
import { createNode, createStyles } from './context.svelte'
import View from './View.svelte'

let {
    class: class_name,
    css_scope,
    style = {},
    value,
    placeholder,
    placeholderTextColor: placeholder_text_color = '#777777',
    onFocus,
    onBlur,
    onPointerDown,
    ...props
}: InputProps = $props()

const main_node = createNode()
const css_styles = createStyles()
const input_style = $derived(css_styles.current)
const content_node = createNode()
const text_node = createNode()
text_node.text('')
let caret_ref = $state<NodeHandle | null>(null)
let is_focused = $state(false)
let caret_visible = $state(true)
const show_placeholder = $derived(showInputPlaceholder(value, placeholder, is_focused))

export const nodes = {
    main: main_node,
    content: content_node,
    text: text_node,
    get caret() { return caret_ref?.nodes.main ?? null },
}

export function focus() {
    main_node.focus()
}

export function blur() {
    main_node.blur()
}

function handleFocus(event: NodeEventMap['focus']) {
    is_focused = true
    onFocus?.(event)
}

function handleBlur(event: NodeEventMap['blur']) {
    is_focused = false
    onBlur?.(event)
}

function handlePointerDown(event: NodeEventMap['pointerdown']) {
    event.source_event.preventDefault()
    onPointerDown?.(event)
}

$effect(() => {
    void value
    if (!is_focused) {
        return
    }

    caret_visible = true
    const interval_id = setInterval(() => { caret_visible = !caret_visible }, 500)
    return () => clearInterval(interval_id)
})
</script>

<uno-view class={class_name} {css_scope} css_tag="Input" node={main_node} props={{ ...props, onFocus: handleFocus, onBlur: handleBlur, onPointerDown: handlePointerDown, style: { ...style } }} receiveStyles={css_styles.setCurrent} resolvedStyle={getInputStyle(input_style)}>
    <uno-view node={content_node} props={{ style: getInputContentStyle(input_style) }}>
        <uno-text node={text_node} props={{ style: getInputTextStyle(input_style, show_placeholder, placeholder_text_color) }}>{getInputTextValue(value, placeholder, show_placeholder)}</uno-text>
        {#if is_focused}
            <View bind:this={caret_ref} style={getInputCaretStyle(input_style, caret_visible)} />
        {/if}
    </uno-view>
</uno-view>
