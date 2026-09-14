<script lang="ts">
import type {} from './elements'
import type { ImageProps } from './props'
import { getImageStyle } from '../shared'
import { createNode, createStyles, useUI } from './context.svelte'

let { src, width, height, class: class_name, css_scope, style, ...props }: ImageProps = $props()
const ui = useUI()
const main_node = createNode()
const css_styles = createStyles()
const image_style = $derived(getImageStyle(ui.resources!, src, {
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
    ...css_styles.current,
}))
export const nodes = { main: main_node }
</script>

<uno-view class={class_name} {css_scope} css_tag="Image" node={main_node} props={{ ...props, style: { ...style } }} receiveStyles={css_styles.setCurrent} resolvedStyle={image_style}></uno-view>
