<script lang="ts">
    import { onMount } from 'svelte'
    import { Image, Text, View, useUI } from 'uno-ui/svelte'
    import type { ImageProps, NodeHandle, StyleProps } from 'uno-ui/svelte'

    let { title, onReady, onClick }: {
        title: string
        onReady(controls: any): void
        onClick?: ((event: any) => void) | null
    } = $props()
    let count = $state(0)
    let visible = $state(false)
    let text_visible = $state(true)
    let keys = $state(['a', 'b', 'c'])
    let text_parts = $state(['x', 'y'])
    let style = $state<StyleProps>({ width: '100px', height: '120px', backgroundColor: '#f00' })
    let image_src = $state('wide')
    let image_width = $state<string>()
    let image_height = $state<string>()
    let image_style = $state<NonNullable<ImageProps['style']>>({ objectFit: 'fill' })
    let main_ref = $state<NodeHandle | null>()
    let text_ref = $state<NodeHandle | null>()
    let list_ref = $state<NodeHandle | null>()
    let image_ref = $state<NodeHandle | null>()
    let conditional_ref = $state<NodeHandle | null>()
    let mixed_ref = $state<NodeHandle | null>()
    const item_refs: Record<string, NodeHandle | null | undefined> = {}
    const ui = useUI()

    onMount(() => onReady({
        ui,
        get main_ref() { return main_ref },
        get text_ref() { return text_ref },
        get list_ref() { return list_ref },
        get image_ref() { return image_ref },
        get conditional_ref() { return conditional_ref },
        get mixed_ref() { return mixed_ref },
        item_refs,
        style,
        image_style,
        setCount(value: number) { count = value },
        increment() { count++ },
        setVisible(value: boolean) { visible = value },
        setTextVisible(value: boolean) { text_visible = value },
        setKeys(value: string[]) { keys = value },
        setTextParts(value: string[]) { text_parts = value },
        setImage(src: string, width?: string, height?: string) {
            image_src = src
            image_width = width
            image_height = height
        },
    }))
</script>

{#snippet suffix(value: string)}{value}!{/snippet}

<View bind:this={main_ref} {style} {onClick}>
    <Text bind:this={text_ref}>{#if text_visible}{title} {count}{#if visible}!{/if}{/if}</Text>
    <View bind:this={list_ref}>
        <View><Text>before</Text></View>
        {#each keys as key (key)}
            <View bind:this={item_refs[key]}><Text>{key}</Text></View>
        {/each}
        {#if visible}<Text bind:this={conditional_ref}>Conditional</Text>{/if}
        <View><Text>after</Text></View>
    </View>
    <Image bind:this={image_ref} src={image_src} width={image_width} height={image_height} style={image_style} />
    <Text bind:this={mixed_ref}>A{0}{null}{undefined}{true}{false}{#each text_parts as part}{part}{/each}{@render suffix('Z')}</Text>
</View>
