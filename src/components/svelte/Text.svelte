<script lang="ts">
import type {} from './elements'
import type { TextProps } from './props'
import { createNode } from './context.svelte'

let { children: renderChildren, class: class_name, css_scope, style, ...props }: TextProps = $props()
const main_node = createNode()
main_node.text('')
export const nodes = { main: main_node }
</script>

<uno-text class={class_name} {css_scope} css_tag="Text" node={main_node} props={{ ...props, style: { ...style } }}>
    {@render renderChildren?.()}
</uno-text>
