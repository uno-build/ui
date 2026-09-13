<script lang="ts">
import type {} from './elements'
import type { ScrollViewProps } from './props'
import { getScrollContentStyle, getScrollViewStyle } from '../shared'
import { createNode } from './context.svelte'

let { children: renderChildren, horizontal = false, style, ...props }: ScrollViewProps = $props()
const main_node = createNode()
const content_node = createNode()
export const nodes = { main: main_node, content: content_node }
</script>

<uno-view node={main_node} props={{ ...props, style: getScrollViewStyle(horizontal, style) }}>
    <uno-view node={content_node} props={{ style: getScrollContentStyle(horizontal) }}>
        {@render renderChildren?.()}
    </uno-view>
</uno-view>
