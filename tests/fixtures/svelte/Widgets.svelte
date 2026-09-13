<script lang="ts">
    import { onMount } from 'svelte'
    import { Input, ScrollView, Text, View } from 'uno-ui/svelte'
    import type { InputHandle, InputProps, ScrollViewHandle, StyleProps } from 'uno-ui/svelte'

    let { title, onReady, onScroll, onFocus, onBlur, onPointerDown }: {
        title: string
        onReady(controls: any): void
        onScroll?: ((event: any) => void) | null
        onFocus?: ((event: any) => void) | null
        onBlur?: ((event: any) => void) | null
        onPointerDown?: ((event: any) => void) | null
    } = $props()
    let horizontal = $state(false)
    let input_visible = $state(true)
    let input_value = $state<InputProps['value']>()
    let input_placeholder = $state<InputProps['placeholder']>('Name')
    let input_placeholder_color = $state<string | undefined>('#abcdef')
    let input_style = $state<StyleProps>({
        width: '120px', height: '40px', color: '#123456', lineHeight: '20px',
        letterSpacing: '1px', textAlign: 'right',
    })
    const scroll_style = $state<StyleProps>({ width: '100px', height: '50px' })
    let scroll_ref = $state<ScrollViewHandle | null>()
    let horizontal_ref = $state<ScrollViewHandle | null>()
    let input_ref = $state<InputHandle | null>()

    onMount(() => onReady({
        get scroll_ref() { return scroll_ref },
        get horizontal_ref() { return horizontal_ref },
        get input_ref() { return input_ref },
        get input_style() { return input_style },
        scroll_style,
        setHorizontal(value: boolean) { horizontal = value },
        setInputVisible(value: boolean) { input_visible = value },
        setInputValue(value: InputProps['value']) { input_value = value },
        setInputPlaceholder(value: InputProps['placeholder']) { input_placeholder = value },
        setInputPlaceholderColor(value: string | undefined) { input_placeholder_color = value },
        setInputStyle(value: StyleProps) { input_style = value },
    }))
</script>

<ScrollView bind:this={scroll_ref} {horizontal} style={scroll_style} {onScroll}>
    <View style={{ width: '200px', height: '100px' }}><Text>{title}</Text></View>
</ScrollView>
<ScrollView bind:this={horizontal_ref} horizontal><Text>Horizontal</Text></ScrollView>
{#if input_visible}
    <Input
        bind:this={input_ref}
        value={input_value}
        placeholder={input_placeholder}
        placeholderTextColor={input_placeholder_color}
        style={input_style}
        {onFocus}
        {onBlur}
        {onPointerDown}
    />
{/if}
