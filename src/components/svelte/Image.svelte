<script lang="ts">
import type {} from './elements'
import type { ImageProps } from './props'
import { getImageStyle } from '../shared'
import { createNode, useUI } from './context.svelte'

let { src, width, height, style, ...props }: ImageProps = $props()
const ui = useUI()
const main_node = createNode()
const image_style = $derived(getImageStyle(ui.resources!, src, {
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
    ...style,
}))
export const nodes = { main: main_node }
</script>

<uno-view node={main_node} props={{ ...props, style: image_style }}></uno-view>
