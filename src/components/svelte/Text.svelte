<script lang="ts">
import type {} from './elements'
import type { TextProps } from './props'
import { createNode } from './context.svelte'

let { children: renderChildren, style, ...props }: TextProps = $props()
const main_node = createNode()
main_node.text('')
export const nodes = { main: main_node }
</script>

<uno-text node={main_node} props={{ ...props, style: { ...style } }}>
    {@render renderChildren?.()}
</uno-text>
