<script lang="ts">
import type {} from './elements'
import type { ScrollViewProps } from './props'
import { getScrollContentStyle, getScrollViewStyle } from '../shared'
import { createNode, createStyles } from './context.svelte'

let { children: renderChildren, horizontal = false, class: class_name, css_scope, style, ...props }: ScrollViewProps = $props()
const main_node = createNode()
const content_node = createNode()
const css_styles = createStyles()
export const nodes = { main: main_node, content: content_node }
</script>

<uno-view class={class_name} {css_scope} css_tag="ScrollView" node={main_node} props={{ ...props, style: { ...style } }} receiveStyles={css_styles.setCurrent} resolvedStyle={getScrollViewStyle(horizontal, css_styles.current)}>
    <uno-view node={content_node} props={{ style: getScrollContentStyle(horizontal) }}>
        {@render renderChildren?.()}
    </uno-view>
</uno-view>
