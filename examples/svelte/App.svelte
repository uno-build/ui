<script module lang="ts">
    import type ResourcesDom from 'uno-ui/ResourcesDom'
    import type ResourcesWebGPU from 'uno-ui/ResourcesWebGPU'
    import { loadImage, loadJson } from '../../tests/utils/load-assets'

    const TEXT_FONT_FAMILY = 'Poppins-Regular'
    const IMAGE_SRC = 'assets/images/coin.png'

    export async function loadResources(resources: ResourcesDom | ResourcesWebGPU) {
        const [image, font_image, font_json] = await Promise.all([
            loadImage(`/${IMAGE_SRC}`),
            loadImage(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.png`),
            loadJson(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.json`),
        ])

        resources.registerImage(IMAGE_SRC, image)
        resources.registerFont(TEXT_FONT_FAMILY, font_image, font_json)
    }
</script>

<script lang="ts">
    import { Image, Text, View } from 'uno-ui/svelte'

    let { title }: { title: string } = $props()
    let count = $state(0)
    let items = $state([1, 2, 3])

    const PAGE_STYLE = {
        width: '100%',
        height: '100%',
        padding: '32px',
        gap: '24px',
        backgroundColor: '#ebf0f4',
        flexDirection: 'column',
        alignItems: 'flex-start',
    }
    const TEXT_STYLE = {
        fontFamily: TEXT_FONT_FAMILY,
        fontSize: '16px',
        lineHeight: '24px',
        color: '#141414',
    }
    const BUTTON_STYLE = {
        padding: '12px 20px',
        backgroundColor: '#ffffff',
        border: '1px solid #ff3e00',
        borderRadius: '12px',
    }
    const CARD_STYLE = {
        width: '180px',
        padding: '20px',
        gap: '14px',
        backgroundColor: '#ffffff',
        border: '1px solid #e8eef2',
        borderRadius: '24px',
        flexDirection: 'column',
        alignItems: 'center',
    }
</script>

<View style={PAGE_STYLE}>
    <Text style={{ ...TEXT_STYLE, fontSize: '28px', lineHeight: '36px' }}>{title}</Text>
    <Text style={TEXT_STYLE}>Clicks: {count}{#if count > 0} — updated with Svelte runes{/if}</Text>

    <View style={{ flexDirection: 'row', gap: '12px' }}>
        <View style={BUTTON_STYLE} onClick={() => count += 1}>
            <Text style={{ ...TEXT_STYLE, color: '#d43109' }}>Count and toggle images</Text>
        </View>
        <View style={BUTTON_STYLE} onClick={() => items = [...items].reverse()}>
            <Text style={{ ...TEXT_STYLE, color: '#d43109' }}>Reverse cards</Text>
        </View>
    </View>

    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '20px' }}>
        {#each items as item (item)}
            <View style={CARD_STYLE}>
                <Text style={TEXT_STYLE}>Coin {item}</Text>
                {#if count % 2 === 0}
                    <Image src={IMAGE_SRC} width="120px" height="90px" style={{ objectFit: 'contain' }} />
                {/if}
            </View>
        {/each}
    </View>
</View>
