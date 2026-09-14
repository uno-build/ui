<script lang="ts">
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

<script setup lang="ts">
import { Image, Text, View } from 'uno-ui/vue'
</script>

<template>
    <View class="page">
        <View class="image-card">
            <Text class="image-label">No width or height - 256x256</Text>
            <View class="image-stage">
                <Image :src="IMAGE_SRC" />
            </View>
        </View>

        <View class="image-card">
            <Text class="image-label">Width only: 160px - result 160x160</Text>
            <View class="image-stage">
                <Image :src="IMAGE_SRC" width="160px" />
            </View>
        </View>

        <View class="image-card">
            <Text class="image-label">Height only: 120px - result 120x120</Text>
            <View class="image-stage">
                <Image :src="IMAGE_SRC" height="120px" />
            </View>
        </View>

        <View class="image-card">
            <Text class="image-label">objectFit: fill - 180x90 box</Text>
            <View class="image-stage">
                <Image :src="IMAGE_SRC" width="180px" height="90px" class="fit-fill" />
            </View>
        </View>

        <View class="image-card">
            <Text class="image-label">objectFit: contain - 180x90 box</Text>
            <View class="image-stage">
                <Image :src="IMAGE_SRC" width="180px" height="90px" class="fit-contain" />
            </View>
        </View>

        <View class="image-card">
            <Text class="image-label">objectFit: cover - 180x90 box</Text>
            <View class="image-stage">
                <Image :src="IMAGE_SRC" width="180px" height="90px" class="fit-cover" />
            </View>
        </View>

        <View class="image-card">
            <Text class="image-label">objectFit: none - 180x90 box</Text>
            <View class="image-stage">
                <Image :src="IMAGE_SRC" width="180px" height="90px" class="fit-none" />
            </View>
        </View>

        <View class="image-card">
            <Text class="image-label">Width only: 50% - height preserves the aspect ratio</Text>
            <View class="image-stage">
                <Image :src="IMAGE_SRC" width="50%" />
            </View>
        </View>

        <View class="image-card">
            <Text class="image-label">Height only: 50% - width preserves the aspect ratio</Text>
            <View class="image-stage">
                <Image :src="IMAGE_SRC" height="50%" />
            </View>
        </View>

        <View class="image-card">
            <Text class="image-label">Width and height: 50% - independent box</Text>
            <View class="image-stage">
                <Image :src="IMAGE_SRC" width="50%" height="50%" />
            </View>
        </View>
    </View>
</template>

<style scoped>
.page {
    width: 100%;
    height: 100%;
    padding: 32px;
    gap: 24px;
    background-color: #f2f7f4;
    flex-direction: row;
    flex-wrap: wrap;
    align-content: flex-start;
    overflow: scroll;
}

.image-card {
    width: 350px;
    height: 330px;
    padding: 20px;
    gap: 14px;
    background-color: #ffffff;
    border: 1px solid #a8cdb8;
    border-radius: 24px;
    box-shadow: 0px 18px 40px -14px #203b2e22;
    flex-direction: column;
}

.image-stage {
    flex: 1;
    align-items: center;
    justify-content: center;
    background-color: #eaf4ee;
    border: 1px solid #a8cdb8;
    border-radius: 18px;
}

.image-label {
    font-family: Poppins-Regular;
    font-size: 13px;
    line-height: 18px;
    letter-spacing: 0.3px;
    color: #658273;
}

.fit-fill {
    object-fit: fill;
}

.fit-contain {
    object-fit: contain;
}

.fit-cover {
    object-fit: cover;
}

.fit-none {
    object-fit: none;
}
</style>
