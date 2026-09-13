<script lang="ts">
    import { Image, Text, View } from 'uno-ui/svelte'

    let { kind }: { kind: string } = $props()
</script>

{#if kind === 'tag'}
    <unsupported />
{:else if kind === 'text-child'}
    <Text><View /></Text>
{:else if kind === 'raw-text'}
    <View>Invalid</View>
{:else if kind === 'image'}
    <Image src="missing" />
{:else if kind === 'fit'}
    <Image src="wide" style={{ objectFit: 'invalid' as 'fill' }} />
{/if}
