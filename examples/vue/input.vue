<script lang="ts">
import type ResourcesDom from 'uno-ui/ResourcesDom'
import type ResourcesWebGPU from 'uno-ui/ResourcesWebGPU'
import { loadImage, loadJson } from '../../tests/utils/load-assets'

const TITLE_FONT_FAMILY = 'ChangaOne-Regular'
const TEXT_FONT_FAMILY = 'Poppins-Regular'
const GAME_FONT_FAMILY = 'Nougat-ExtraBlack'
const COIN_SRC = 'assets/images/coin.png'

export async function loadResources(resources: ResourcesDom | ResourcesWebGPU) {
    const [coin, text_font_image, text_font_json, title_font_image, title_font_json, game_font_image, game_font_json] = await Promise.all([
        loadImage(`/${COIN_SRC}`),
        loadImage(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.json`),
        loadImage(`/assets/fonts/${TITLE_FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${TITLE_FONT_FAMILY}.mtsdf.json`),
        loadImage(`/assets/fonts/${GAME_FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${GAME_FONT_FAMILY}.mtsdf.json`),
    ])
    resources.registerImage(COIN_SRC, coin)
    resources.registerFont(TEXT_FONT_FAMILY, text_font_image, text_font_json)
    resources.registerFont(TITLE_FONT_FAMILY, title_font_image, title_font_json)
    resources.registerFont(GAME_FONT_FAMILY, game_font_image, game_font_json)
}
</script>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { Image, Input, Text, View } from 'uno-ui/vue'
import type { InputHandle } from 'uno-ui/vue'
import type { NodeEventMap } from 'uno-ui/events'

const MAX_LENGTHS = { nickname: 16, clan: 3, code: 6, cry: 40 }

const nickname_ref = ref<InputHandle | null>(null)
const focused = ref<keyof typeof MAX_LENGTHS | null>(null)
const taps = ref(0)
const values = reactive({ nickname: '', clan: '', code: '', cry: '' })
const keyboard_input = document.createElement('input')
keyboard_input.style.position = 'fixed'
keyboard_input.style.width = '1px'
keyboard_input.style.height = '1px'
keyboard_input.style.opacity = '0'
keyboard_input.style.pointerEvents = 'none'
keyboard_input.style.left = '0'
keyboard_input.style.bottom = '0'
keyboard_input.tabIndex = -1

function handleFocus(id: keyof typeof MAX_LENGTHS, event: NodeEventMap['focus']) {
    taps.value++
    focused.value = id
    keyboard_input.value = values[id]
    keyboard_input.maxLength = MAX_LENGTHS[id]
    keyboard_input.oninput = () => { values[id] = keyboard_input.value }
    keyboard_input.onblur = () => event.target.blur()
    keyboard_input.focus({ preventScroll: true })
}

function handleBlur() {
    focused.value = null
}

onMounted(() => {
    document.body.appendChild(keyboard_input)
    nickname_ref.value!.focus()
})

onUnmounted(() => {
    keyboard_input.oninput = null
    keyboard_input.onblur = null
    keyboard_input.remove()
})
</script>

<template>
    <View class="page">
        <View class="card">
            <View class="header">
                <View class="badge">
                    <Image :src="COIN_SRC" width="42px" />
                </View>
                <View class="header-texts">
                    <Text class="title">Player profile</Text>
                    <Text class="subtitle">Four inputs, four type treatments.</Text>
                </View>
            </View>

            <View class="divider" />

            <View class="field">
                <Text class="label">NICKNAME</Text>
                <Input
                    id="nickname"
                    ref="nickname_ref"
                    class="nickname"
                    :class="{ focus: focused === 'nickname' }"
                    :value="values.nickname"
                    placeholder="Player one"
                    placeholder-text-color="#658273"
                    @focus="handleFocus('nickname', $event)"
                    @blur="handleBlur"
                />
            </View>

            <View class="row">
                <View class="clan-field">
                    <Text class="label">CLAN TAG</Text>
                    <Input
                        id="clan"
                        class="clan"
                        :class="{ focus: focused === 'clan' }"
                        :value="values.clan"
                        placeholder="UNO"
                        placeholder-text-color="#a86a12"
                        @focus="handleFocus('clan', $event)"
                        @blur="handleBlur"
                    />
                </View>
                <View class="row-field">
                    <Text class="label">ACCESS CODE</Text>
                    <Input
                        id="code"
                        class="code"
                        :class="{ focus: focused === 'code' }"
                        :value="values.code.replace(/./g, '•').trim()"
                        placeholder="000000"
                        placeholder-text-color="#658273"
                        @focus="handleFocus('code', $event)"
                        @blur="handleBlur"
                    />
                </View>
            </View>

            <View class="field">
                <Text class="label">BATTLE CRY</Text>
                <Input
                    id="cry"
                    class="cry"
                    :class="{ focus: focused === 'cry' }"
                    :value="values.cry"
                    placeholder="For glory and coins!"
                    placeholder-text-color="#658273"
                    @focus="handleFocus('cry', $event)"
                    @blur="handleBlur"
                />
            </View>

            <View class="divider" />

            <View class="footer">
                <Text class="status">{{ focused === null ? 'Tap a field to edit' : `Editing ${focused}` }}</Text>
                <Text class="taps">{{ taps }} taps</Text>
            </View>
        </View>
    </View>
</template>

<style scoped>
.page {
    width: 100%;
    height: 100%;
    padding: 32px;
    background-color: #f2f7f4;
    align-items: center;
    justify-content: center;
}

.card {
    width: 560px;
    flex-direction: column;
    gap: 22px;
    padding: 30px;
    background-color: #ffffff;
    border: 1px solid #0a1f16;
    border-radius: 24px;
    box-shadow: 0px 24px 50px -12px #0a1f1633;
}

.header {
    flex-direction: row;
    align-items: center;
    gap: 16px;
}

.badge {
    width: 64px;
    height: 64px;
    align-items: center;
    justify-content: center;
    background-color: #d9f0e4;
    border: 1px solid #0a1f16;
    border-radius: 20px;
}

.header-texts {
    flex: 1;
    flex-direction: column;
    gap: 4px;
}

.title {
    font-family: ChangaOne-Regular;
    font-size: 30px;
    color: #0a1f16;
    letter-spacing: 0.5px;
}

.subtitle {
    font-family: Poppins-Regular;
    font-size: 13px;
    line-height: 18px;
    color: #658273;
}

.divider {
    height: 1px;
    background-color: #a8cdb8;
}

.row {
    flex-direction: row;
    gap: 16px;
}

.field {
    flex-direction: column;
    gap: 8px;
}

.row-field {
    flex: 1;
    flex-direction: column;
    gap: 8px;
}

.clan-field {
    width: 96px;
    flex-direction: column;
    gap: 8px;
}

.label {
    font-family: Poppins-Regular;
    font-size: 11px;
    letter-spacing: 1.6px;
    color: #658273;
}

.nickname {
    font-family: Poppins-Regular;
    color: #0a1f16;
    letter-spacing: 0.3px;
    background-color: #eaf4ee;
    border: 2px solid #0a1f16;
    border-radius: 12px;
    padding: 10px 14px;
}

.clan {
    font-family: Nougat-ExtraBlack;
    color: #ffffff;
    letter-spacing: 3px;
    text-align: center;
    text-stroke: 1px #0a1f16;
    text-shadow: 0px 2px 0px #0a1f1666;
    background-color: #e8a33d;
    border: 2px solid #0a1f16;
    border-radius: 14px;
    padding: 10px 14px;
}

.code {
    font-family: Poppins-Regular;
    color: #1f8a5b;
    letter-spacing: 8px;
    text-align: center;
    background-color: #eaf4ee;
    border: 2px solid #0a1f16;
    border-radius: 12px;
    padding: 10px 14px;
}

.cry {
    font-family: ChangaOne-Regular;
    color: #0a1f16;
    letter-spacing: 0.5px;
    line-height: 22px;
    background-color: #d9f0e4;
    border: 2px solid #0a1f16;
    border-radius: 999px;
    padding: 10px 20px;
}

.focus {
    border: 2px solid #1f8a5b;
    box-shadow: 0px 0px 0px 4px #1f8a5b2e;
}

.footer {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
}

.status {
    font-family: Poppins-Regular;
    font-size: 12px;
    color: #658273;
}

.taps {
    font-family: Poppins-Regular;
    font-size: 12px;
    color: #a86a12;
}
</style>
