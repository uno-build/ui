<script lang="ts">
    import { onMount } from 'svelte'
    import { Image, Input, ScrollView, Text, View } from 'uno-ui/svelte'
    import type { InputHandle, NodeHandle, ScrollViewHandle, StyleProps } from 'uno-ui/svelte'
    import CssChild from './CssChild.svelte'

    let { title, panel_id = 'panel', onReady, onNativeClick }: {
        title: string
        panel_id?: string
        onReady(controls: any): void
        onNativeClick?: ((event: any) => void) | null
    } = $props()
    let active = $state(false)
    let compact = $state(false)
    let native_style = $state('width: 150px; padding-left: 7px; opacity: .9')
    let native_height = $state<string | undefined>('32px')
    let keys = $state(['a', 'b', 'c'])
    const mixed_classes = $state({ 'runtime-target': true, highlighted: false })
    const image_classes = $state(['photo'])
    let image_style = $state<StyleProps>({})
    let horizontal = $state(false)
    let main_ref = $state<NodeHandle | null>()
    let input_ref = $state<InputHandle | null>()
    let scroll_ref = $state<ScrollViewHandle | null>()

    onMount(() => onReady({
        get main_ref() { return main_ref },
        get input_ref() { return input_ref },
        get scroll_ref() { return scroll_ref },
        setActive(value: boolean) { active = value },
        setCompact(value: boolean) { compact = value },
        setNativeStyle(value: string) { native_style = value },
        setNativeHeight(value: string | undefined) { native_height = value },
        setKeys(value: string[]) { keys = value },
        setMixedHighlighted(value: boolean) { mixed_classes.highlighted = value },
        setImageClass(value: string) { image_classes.splice(0, image_classes.length, value) },
        setImageThumbnail(value: boolean) {
            if (value) image_classes.push('thumbnail')
            else image_classes.pop()
        },
        setImageStyle(value: StyleProps) { image_style = value },
        setHorizontal(value: boolean) { horizontal = value },
    }))
</script>

<View id={panel_id} class={['container', { compact }]} bind:this={main_ref}>
    <uno-view class="card" class:active style={native_style} style:height={native_height} onclick={onNativeClick}>
        <uno-text class="label">{title}</uno-text>
    </uno-view>
    <CssChild />
    <View class="list">
        {#each keys as key (key)}
            <View class="item"><Text>{key}</Text></View>
        {/each}
    </View>
    <View class={mixed_classes}><Text class="label">Mixed</Text></View>
    <Image class={image_classes} src="wide" style={image_style} />
    <Input class="field" value="Value" bind:this={input_ref} />
    <ScrollView class="scroll" {horizontal} bind:this={scroll_ref}>
        <Text class="label">Scroll</Text>
    </ScrollView>
</View>

<style>
    .container {
        width: 260px;
        padding: 10px;
        flex-direction: column;
    }

    #changed {
        width: 320px;
    }

    .card {
        width: 100px;
        height: 24px;
        padding: 4px;
        opacity: .6 !important;
    }

    .card.active {
        background-color: #abcdef;
    }

    .container.compact > .card {
        padding-left: 6px;
    }

    .label {
        color: #123456;
    }

    View > Text {
        font-size: 13px;
    }

    Image {
        border-radius: 7px;
    }

    .list {
        gap: 3px;
    }

    .item {
        height: 12px;
    }

    .container .photo {
        width: 120px;
        object-fit: contain;
    }

    .container .highlighted {
        background-color: #789abc;
    }

    .container .photo.thumbnail {
        opacity: .4;
    }

    .container.compact .photo {
        width: 60px;
        object-fit: cover;
    }

    .container .field {
        width: 160px;
        color: #112233;
        line-height: 18px;
        letter-spacing: 1px;
        text-align: center;
        border-left-width: 3px;
    }

    .container.compact .field {
        color: #445566;
        line-height: 24px;
        text-align: right;
    }

    .container .scroll {
        width: 180px;
        height: 40px;
    }
</style>
