<script lang="ts">
import type {} from './elements'
import type { ViewProps } from './props'
import { createNode } from './context.svelte'

let { children: renderChildren, class: class_name, css_scope, style, ...props }: ViewProps = $props()
const main_node = createNode()
export const nodes = { main: main_node }
</script>

<uno-view class={class_name} {css_scope} css_tag="View" node={main_node} props={{ ...props, style: { ...style } }}>
    {@render renderChildren?.()}
</uno-view>
