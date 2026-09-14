<script lang="ts">
import type ResourcesDom from 'uno-ui/ResourcesDom'
import type ResourcesWebGPU from 'uno-ui/ResourcesWebGPU'
import { loadImage, loadJson } from '../../tests/utils/load-assets'

const TITLE_FONT_FAMILY = 'Nougat-ExtraBlack'
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

<script setup lang="ts">
import { Image, ScrollView, Text, View } from 'uno-ui/vue'

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

<template>
    <ScrollView class="page">
        <View class="page-content">
            <View class="page-header">
                <View class="badge">
                    <Image :src="COIN_SRC" width="38px" />
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
                        <Image :src="LOGO_SRC" class="hero" />
                        <Text class="text">{{ PARAGRAPHS[0] }}</Text>

                        <ScrollView horizontal class="gallery">
                            <View class="gallery-content">
                                <Image v-for="(src, index) in GALLERY_SOURCES" :key="index" :src="src" class="gallery-image" />
                            </View>
                        </ScrollView>

                        <View class="divider" />
                        <Text v-for="paragraph in PARAGRAPHS" :key="paragraph" class="text">{{ paragraph }}</Text>
                        <Text class="footer">Drag the strip sideways</Text>
                    </View>
                </ScrollView>

                <ScrollView class="panel">
                    <View class="panel-content">
                        <Text class="label">VERTICAL + INNER VERTICAL</Text>
                        <Text class="panel-title">Patch notes</Text>
                        <Image :src="TEXTURE_SRC" class="hero hero-short" />

                        <ScrollView class="entries">
                            <View class="entries-content">
                                <View v-for="entry in ENTRIES" :key="entry.title" class="entry">
                                    <Image :src="COIN_SRC" class="entry-thumb" />
                                    <View class="entry-texts">
                                        <Text class="entry-title">{{ entry.title }}</Text>
                                        <Text class="entry-body">{{ entry.body }}</Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View class="divider" />
                        <Text v-for="paragraph in PARAGRAPHS" :key="paragraph" class="text">{{ paragraph }}</Text>
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
                    <View v-for="item in ITEMS" :key="item.title" class="card">
                        <Image :src="item.src" class="card-image" />
                        <Text class="card-title">{{ item.title }}</Text>
                        <Text class="card-price">{{ item.price }}</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    </ScrollView>
</template>

<style scoped>
.page {
    width: 100%;
    height: 100%;
    background-color: #f2f7f4;
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
    background-color: #d9f0e4;
    border: 2px solid #a8cdb8;
    border-radius: 20px;
}

.page-title {
    font-family: Nougat-ExtraBlack;
    font-size: 30px;
    color: #203b2e;
    letter-spacing: 0.5px;
}

.page-subtitle {
    font-family: Poppins-Regular;
    font-size: 13px;
    line-height: 18px;
    color: #658273;
}

.panels {
    flex-direction: row;
    gap: 28px;
}

.panel {
    width: 480px;
    height: 560px;
    background-color: #ffffff;
    border: 2px solid #a8cdb8;
    border-radius: 28px;
    box-shadow: 0px 18px 40px -14px #203b2e22;
}

.panel-content {
    flex-direction: column;
    padding: 24px;
    gap: 18px;
}

.hero {
    width: 100%;
    height: 190px;
    object-fit: cover;
    border-radius: 16px;
}

.panel-title {
    font-family: Nougat-ExtraBlack;
    font-size: 22px;
    color: #203b2e;
    letter-spacing: 0.4px;
}

.label {
    font-family: Poppins-Regular;
    font-size: 11px;
    letter-spacing: 1.6px;
    color: #4fae7f;
}

.text {
    font-family: Poppins-Regular;
    font-size: 14px;
    line-height: 22px;
    color: #203b2e;
    text-align: justify;
}

.divider {
    height: 1px;
    background-color: #a8cdb8;
}

.gallery {
    width: 100%;
    height: 150px;
    background-color: #eaf4ee;
    border: 1px solid #a8cdb8;
    border-radius: 18px;
}

.gallery-content {
    padding: 14px;
    gap: 14px;
    align-items: center;
}

.gallery-image {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 14px;
}

.entries {
    width: 100%;
    height: 290px;
    background-color: #eaf4ee;
    border: 1px solid #a8cdb8;
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
    border: 1px solid #a8cdb8;
    border-radius: 14px;
}

.entry-thumb {
    width: 56px;
    height: 56px;
    object-fit: cover;
    border-radius: 12px;
}

.header-texts,
.entry-texts {
    flex: 1;
    flex-direction: column;
    gap: 4px;
}

.entry-title {
    font-family: Poppins-Regular;
    font-size: 14px;
    color: #203b2e;
    letter-spacing: 0.3px;
}

.entry-body {
    font-family: Poppins-Regular;
    font-size: 12px;
    line-height: 18px;
    color: #658273;
}

.strip {
    width: 988px;
    height: 250px;
    background-color: #ffffff;
    border: 2px solid #a8cdb8;
    border-radius: 28px;
    box-shadow: 0px 18px 40px -14px #203b2e22;
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
    background-color: #eaf4ee;
    border: 1px solid #a8cdb8;
    border-radius: 18px;
}

.card-image {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 12px;
}

.card-title {
    font-family: Poppins-Regular;
    font-size: 13px;
    color: #203b2e;
}

.card-price {
    font-family: Poppins-Regular;
    font-size: 12px;
    letter-spacing: 0.4px;
    color: #4fae7f;
}

.footer {
    font-family: Poppins-Regular;
    font-size: 12px;
    color: #4fae7f;
}

.hero-short {
    height: 140px;
}
</style>
