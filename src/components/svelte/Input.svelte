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
import { createNode } from './context.svelte'
import View from './View.svelte'

let {
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

<uno-view node={main_node} props={{ ...props, onFocus: handleFocus, onBlur: handleBlur, onPointerDown: handlePointerDown, style: getInputStyle(style) }}>
    <uno-view node={content_node} props={{ style: getInputContentStyle(style) }}>
        <uno-text node={text_node} props={{ style: getInputTextStyle(style, show_placeholder, placeholder_text_color) }}>{getInputTextValue(value, placeholder, show_placeholder)}</uno-text>
        {#if is_focused}
            <View bind:this={caret_ref} style={getInputCaretStyle(style, caret_visible)} />
        {/if}
    </uno-view>
</uno-view>
