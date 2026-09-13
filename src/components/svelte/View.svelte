<script lang="ts">
import type {} from './elements'
import type { ViewProps } from './props'
import { createNode } from './context.svelte'

let { children: renderChildren, style, ...props }: ViewProps = $props()
const main_node = createNode()
export const nodes = { main: main_node }
</script>

<uno-view node={main_node} props={{ ...props, style: { ...style } }}>
    {@render renderChildren?.()}
</uno-view>
