<script module lang="ts">
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

<script lang="ts">
import { onMount } from 'svelte'
import { Image, Input, Text, View } from 'uno-ui/svelte'
import type { InputHandle } from 'uno-ui/svelte'
import type { NodeEventMap } from 'uno-ui/events'

const MAX_LENGTHS = {
    nickname: 16,
    clan: 3,
    code: 6,
    cry: 40,
}

let nickname_ref = $state<InputHandle>()
let focused = $state<keyof typeof MAX_LENGTHS | null>(null)
let taps = $state(0)
let values = $state({ nickname: '', clan: '', code: '', cry: '' })
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
    taps++
    focused = id
    keyboard_input.value = values[id]
    keyboard_input.maxLength = MAX_LENGTHS[id]
    keyboard_input.oninput = () => { values[id] = keyboard_input.value }
    keyboard_input.onblur = () => event.target.blur()
    keyboard_input.focus({ preventScroll: true })
}

function handleBlur() {
    focused = null
}

onMount(() => {
    document.body.appendChild(keyboard_input)
    nickname_ref!.focus()

    return () => {
        keyboard_input.oninput = null
        keyboard_input.onblur = null
        keyboard_input.remove()
    }
})
</script>

<View class="page">
    <View class="card">
        <View class="header">
            <View class="badge">
                <Image src={COIN_SRC} width="42px" />
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
                bind:this={nickname_ref}
                class={['nickname', (focused === 'nickname' && 'focus')]}
                value={values.nickname}
                placeholder="Player one"
                placeholderTextColor="#141414"
                onFocus={(event) => handleFocus('nickname', event)}
                onBlur={handleBlur}
            />
        </View>

        <View class="row">
            <View class="clan-field">
                <Text class="label">CLAN TAG</Text>
                <Input
                    id="clan"
                    class={['clan', (focused === 'clan' && 'focus')]}
                    value={values.clan}
                    placeholder="UNO"
                    placeholderTextColor="#141414"
                    onFocus={(event) => handleFocus('clan', event)}
                    onBlur={handleBlur}
                />
            </View>
            <View class="row-field">
                <Text class="label">ACCESS CODE</Text>
                <Input
                    id="code"
                    class={['code', (focused === 'code' && 'focus')]}
                    value={values.code.replace(/./g, '•').trim()}
                    placeholder="000000"
                    placeholderTextColor="#141414"
                    onFocus={(event) => handleFocus('code', event)}
                    onBlur={handleBlur}
                />
            </View>
        </View>

        <View class="field">
            <Text class="label">BATTLE CRY</Text>
            <Input
                id="cry"
                class={['cry', (focused === 'cry' && 'focus')]}
                value={values.cry}
                placeholder="For glory and coins!"
                placeholderTextColor="#141414"
                onFocus={(event) => handleFocus('cry', event)}
                onBlur={handleBlur}
            />
        </View>

        <View class="divider" />

        <View class="footer">
            <Text class="status">{focused === null ? 'Tap a field to edit' : `Editing ${focused}`}</Text>
            <Text class="taps">{`${taps} taps`}</Text>
        </View>
    </View>
</View>

<style>
    .page {
        width: 100%;
        height: 100%;
        padding: 32px;
        background-color: #ebf0f4;
        align-items: center;
        justify-content: center;
    }

    .card {
        width: 560px;
        flex-direction: column;
        gap: 22px;
        padding: 30px;
        background-color: #ffffff;
        border: 1px solid #e8eef2;
        border-radius: 24px;
        box-shadow: 0px 24px 50px -12px #1414141a;
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
        background-color: #ff3e00;
        border: 1px solid #e8eef2;
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
        color: #141414;
        letter-spacing: 0.5px;
        text-shadow: 0px 3px 0px #1414141a;
    }

    .subtitle {
        font-family: Poppins-Regular;
        font-size: 13px;
        line-height: 18px;
        color: #141414;
    }

    .divider {
        height: 1px;
        background-color: #e8eef2;
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
        color: #141414;
    }

    .page .nickname {
        font-family: Poppins-Regular;
        color: #141414;
        letter-spacing: 0.3px;
        background-color: #ffffff;
        border: 2px solid #e8eef2;
        border-radius: 12px;
        padding: 10px 14px;
    }

    .page .clan {
        font-family: Nougat-ExtraBlack;
        color: #d43109;
        letter-spacing: 3px;
        text-align: center;
        text-stroke: 1px #141414;
        text-shadow: 0px 2px 0px #14141433;
        background-color: #ffffff;
        border: 2px solid #e8eef2;
        border-radius: 14px;
        padding: 10px 14px;
    }

    .page .code {
        font-family: Poppins-Regular;
        color: #d43109;
        letter-spacing: 8px;
        text-align: center;
        background-color: #ffffff;
        border: 2px solid #e8eef2;
        border-radius: 12px;
        padding: 10px 14px;
    }

    .page .cry {
        font-family: ChangaOne-Regular;
        color: #d43109;
        letter-spacing: 0.5px;
        line-height: 22px;
        background-color: #ffffff;
        border: 2px solid #e8eef2;
        border-radius: 999px;
        padding: 10px 20px;
    }

    .page .focus {
        border: 2px solid #ff3e00;
        box-shadow: 0px 0px 0px 4px #ff3e002e;
    }

    .footer {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }

    .status {
        font-family: Poppins-Regular;
        font-size: 12px;
        color: #141414;
    }

    .taps {
        font-family: Poppins-Regular;
        font-size: 12px;
        color: #d43109;
    }
</style>
