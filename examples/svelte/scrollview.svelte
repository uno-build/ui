<script module lang="ts">
import type ResourcesDom from 'uno-ui/ResourcesDom'
import type ResourcesWebGPU from 'uno-ui/ResourcesWebGPU'
import { loadImage, loadJson } from '../../tests/utils/load-assets'

const TITLE_FONT_FAMILY = 'ChangaOne-Regular'
const TEXT_FONT_FAMILY = 'Poppins-Regular'
const LOGO_SRC = 'assets/images/logo.jpg'
const TEXTURE_SRC = 'assets/images/texture.jpg'
const COIN_SRC = 'assets/images/coin.png'

export async function loadResources(resources: ResourcesDom | ResourcesWebGPU) {
    const [logo, texture, coin, title_font_image, title_font_json, text_font_image, text_font_json] = await Promise.all([
        loadImage(`/${LOGO_SRC}`),
        loadImage(`/${TEXTURE_SRC}`),
        loadImage(`/${COIN_SRC}`),
        loadImage(`/assets/fonts/${TITLE_FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${TITLE_FONT_FAMILY}.mtsdf.json`),
        loadImage(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.json`),
    ])
    resources.registerImage(LOGO_SRC, logo)
    resources.registerImage(TEXTURE_SRC, texture)
    resources.registerImage(COIN_SRC, coin)
    resources.registerFont(TITLE_FONT_FAMILY, title_font_image, title_font_json)
    resources.registerFont(TEXT_FONT_FAMILY, text_font_image, text_font_json)
}
</script>

<script lang="ts">
import { Image, ScrollView, Text, View } from 'uno-ui/svelte'

const GALLERY_SOURCES = [TEXTURE_SRC, LOGO_SRC, COIN_SRC, TEXTURE_SRC, LOGO_SRC, COIN_SRC, TEXTURE_SRC, LOGO_SRC]

const PARAGRAPHS = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
]

const ENTRIES = [
    { title: 'Season one', body: PARAGRAPHS[0] },
    { title: 'Arena rework', body: PARAGRAPHS[1] },
    { title: 'Coin economy', body: PARAGRAPHS[2] },
    { title: 'Clan ladder', body: PARAGRAPHS[3] },
    { title: 'Night market', body: PARAGRAPHS[0] },
    { title: 'Ranked reset', body: PARAGRAPHS[1] },
]

const ITEMS = [
    { src: COIN_SRC, title: 'Golden coin', price: '120 gems' },
    { src: LOGO_SRC, title: 'Founder badge', price: '340 gems' },
    { src: TEXTURE_SRC, title: 'Stone banner', price: '80 gems' },
    { src: COIN_SRC, title: 'Lucky charm', price: '210 gems' },
    { src: LOGO_SRC, title: 'Season frame', price: '450 gems' },
    { src: TEXTURE_SRC, title: 'Arena skin', price: '150 gems' },
    { src: COIN_SRC, title: 'Coin bundle', price: '999 gems' },
]
</script>

<ScrollView class="scroll-page">
    <View class="page-content">
        <View class="page-header">
            <View class="badge">
                <Image src={COIN_SRC} width="38px" />
            </View>
            <View class="header-texts">
                <Text class="page-title">Scroll playground</Text>
                <Text class="page-subtitle">Two panels, each with a nested scroll area.</Text>
            </View>
        </View>

        <View class="panels">
            <ScrollView class="panel">
                <View class="panel-content">
                    <Text class="label">VERTICAL + INNER HORIZONTAL</Text>
                    <Text class="panel-title">Featured drop</Text>
                    <Image src={LOGO_SRC} class="hero" />
                    <Text class="text">{PARAGRAPHS[0]}</Text>

                    <ScrollView horizontal class="gallery">
                        <View class="gallery-content">
                            {#each GALLERY_SOURCES as src, index (index)}
                                <Image src={src} class="gallery-image" />
                            {/each}
                        </View>
                    </ScrollView>

                    <View class="divider" />

                    {#each PARAGRAPHS as paragraph (paragraph)}
                        <Text class="text">{paragraph}</Text>
                    {/each}
                    <Text class="footer">Drag the strip sideways</Text>
                </View>
            </ScrollView>

            <ScrollView class="panel">
                <View class="panel-content">
                    <Text class="label">VERTICAL + INNER VERTICAL</Text>
                    <Text class="panel-title">Patch notes</Text>
                    <Image src={TEXTURE_SRC} class="hero hero-compact" />

                    <ScrollView class="entries">
                        <View class="entries-content">
                            {#each ENTRIES as entry (entry.title)}
                                <View class="entry">
                                    <Image src={COIN_SRC} class="entry-thumb" />
                                    <View class="entry-texts">
                                        <Text class="entry-title">{entry.title}</Text>
                                        <Text class="entry-body">{entry.body}</Text>
                                    </View>
                                </View>
                            {/each}
                        </View>
                    </ScrollView>

                    <View class="divider" />

                    {#each PARAGRAPHS as paragraph (paragraph)}
                        <Text class="text">{paragraph}</Text>
                    {/each}
                    <Text class="footer">Inner list scrolls on its own</Text>
                </View>
            </ScrollView>
        </View>

        <ScrollView horizontal class="strip">
            <View class="strip-content">
                <View class="strip-header">
                    <Text class="label">HORIZONTAL</Text>
                    <Text class="panel-title">Night market</Text>
                    <Text class="entry-body">Drag left and right to browse the offers.</Text>
                </View>
                {#each ITEMS as item (item.title)}
                    <View class="card">
                        <Image src={item.src} class="card-image" />
                        <Text class="card-title">{item.title}</Text>
                        <Text class="card-price">{item.price}</Text>
                    </View>
                {/each}
            </View>
        </ScrollView>
    </View>
</ScrollView>

<style>
    .scroll-page {
        width: 100%;
        height: 100%;
        background-color: #ebf0f4;
    }

    .page-content {
        flex-direction: column;
        align-items: center;
        padding: 32px;
        gap: 24px;
    }

    .page-header {
        width: 988px;
        flex-direction: row;
        align-items: center;
        gap: 16px;
    }

    .badge {
        width: 58px;
        height: 58px;
        align-items: center;
        justify-content: center;
        background-color: #ffffff;
        border: 1px solid #e8eef2;
        border-radius: 18px;
    }

    .page-title {
        font-family: ChangaOne-Regular;
        font-size: 30px;
        color: #141414;
        letter-spacing: 0.5px;
        text-shadow: 0px 3px 0px #1414141a;
    }

    .page-subtitle {
        font-family: Poppins-Regular;
        font-size: 13px;
        line-height: 18px;
        color: #141414;
    }

    .panels {
        flex-direction: row;
        gap: 28px;
    }

    .page-content .panel {
        width: 480px;
        height: 560px;
        background-color: #ffffff;
        border: 1px solid #e8eef2;
        border-radius: 24px;
        box-shadow: 0px 24px 50px -12px #1414141a;
    }

    .panel-content {
        flex-direction: column;
        padding: 24px;
        gap: 18px;
    }

    .page-content .hero {
        width: 100%;
        height: 190px;
        object-fit: cover;
        border-radius: 16px;
    }

    .panel-title {
        font-family: ChangaOne-Regular;
        font-size: 22px;
        color: #141414;
        letter-spacing: 0.4px;
    }

    .label {
        font-family: Poppins-Regular;
        font-size: 11px;
        letter-spacing: 1.6px;
        color: #141414;
    }

    .text {
        font-family: Poppins-Regular;
        font-size: 14px;
        line-height: 22px;
        color: #141414;
        text-align: justify;
    }

    .divider {
        height: 1px;
        background-color: #e8eef2;
    }

    .page-content .gallery {
        width: 100%;
        height: 150px;
        background-color: #ffffff;
        border: 1px solid #e8eef2;
        border-radius: 18px;
    }

    .gallery-content {
        padding: 14px;
        gap: 14px;
        align-items: center;
    }

    .page-content .gallery-image {
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 14px;
    }

    .page-content .entries {
        width: 100%;
        height: 290px;
        background-color: #ffffff;
        border: 1px solid #e8eef2;
        border-radius: 18px;
    }

    .entries-content {
        flex-direction: column;
        padding: 14px;
        gap: 12px;
    }

    .entry {
        flex-direction: row;
        gap: 12px;
        padding: 12px;
        background-color: #ffffff;
        border: 1px solid #e8eef2;
        border-radius: 14px;
    }

    .page-content .entry-thumb {
        width: 56px;
        height: 56px;
        object-fit: cover;
        border-radius: 12px;
    }

    .entry-texts {
        flex: 1;
        flex-direction: column;
        gap: 4px;
    }

    .entry-title {
        font-family: Poppins-Regular;
        font-size: 14px;
        color: #d43109;
        letter-spacing: 0.3px;
    }

    .entry-body {
        font-family: Poppins-Regular;
        font-size: 12px;
        line-height: 18px;
        color: #141414;
    }

    .page-content .strip {
        width: 988px;
        height: 250px;
        background-color: #ffffff;
        border: 1px solid #e8eef2;
        border-radius: 24px;
        box-shadow: 0px 24px 50px -12px #1414141a;
    }

    .strip-content {
        padding: 20px;
        gap: 16px;
        align-items: stretch;
    }

    .strip-header {
        width: 190px;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
        padding-right: 4px;
    }

    .card {
        width: 170px;
        flex-direction: column;
        gap: 10px;
        padding: 12px;
        background-color: #ffffff;
        border: 1px solid #e8eef2;
        border-radius: 18px;
    }

    .page-content .card-image {
        width: 100%;
        height: 120px;
        object-fit: cover;
        border-radius: 12px;
    }

    .card-title {
        font-family: Poppins-Regular;
        font-size: 13px;
        color: #141414;
    }

    .card-price {
        font-family: Poppins-Regular;
        font-size: 12px;
        letter-spacing: 0.4px;
        color: #d43109;
    }

    .footer {
        font-family: Poppins-Regular;
        font-size: 12px;
        color: #d43109;
    }

    .header-texts {
        flex: 1;
        flex-direction: column;
        gap: 4px;
    }

    .page-content .hero-compact {
        height: 140px;
    }
</style>
