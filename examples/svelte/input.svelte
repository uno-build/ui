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

const PAGE_STYLE = {
    width: '100%',
    height: '100%',
    padding: '32px',
    backgroundColor: '#ebf0f4',
    alignItems: 'center',
    justifyContent: 'center',
}
const CARD_STYLE = {
    width: '560px',
    flexDirection: 'column',
    gap: '22px',
    padding: '30px',
    backgroundColor: '#ffffff',
    border: '1px solid #e8eef2',
    borderRadius: '24px',
    boxShadow: '0px 24px 50px -12px #1414141a',
}
const HEADER_STYLE = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '16px',
}
const BADGE_STYLE = {
    width: '64px',
    height: '64px',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff3e00',
    border: '1px solid #e8eef2',
    borderRadius: '20px',
}
const HEADER_TEXTS_STYLE = {
    flex: '1',
    flexDirection: 'column',
    gap: '4px',
}
const TITLE_STYLE = {
    fontFamily: TITLE_FONT_FAMILY,
    fontSize: '30px',
    color: '#141414',
    letterSpacing: '0.5px',
    textShadow: '0px 3px 0px #1414141a',
}
const SUBTITLE_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '13px',
    lineHeight: '18px',
    color: '#141414',
}
const DIVIDER_STYLE = {
    height: '1px',
    backgroundColor: '#e8eef2',
}
const ROW_STYLE = {
    flexDirection: 'row',
    gap: '16px',
}
const FIELD_STYLE = {
    flexDirection: 'column',
    gap: '8px',
}
const ROW_FIELD_STYLE = {
    flex: '1',
    flexDirection: 'column',
    gap: '8px',
}
const CLAN_FIELD_STYLE = {
    width: '96px',
    flexDirection: 'column',
    gap: '8px',
}
const LABEL_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '11px',
    letterSpacing: '1.6px',
    color: '#141414',
}
const NICKNAME_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    color: '#141414',
    letterSpacing: '0.3px',
    backgroundColor: '#ffffff',
    border: '2px solid #e8eef2',
    borderRadius: '12px',
    padding: '10px 14px',
}
const FOCUS_STYLE = {
    border: '2px solid #ff3e00',
    boxShadow: '0px 0px 0px 4px #ff3e002e',
}
const CLAN_STYLE = {
    fontFamily: GAME_FONT_FAMILY,
    color: '#d43109',
    letterSpacing: '3px',
    textAlign: 'center',
    textStroke: '1px #141414',
    textShadow: '0px 2px 0px #14141433',
    backgroundColor: '#ffffff',
    border: '2px solid #e8eef2',
    borderRadius: '14px',
    padding: '10px 14px',
}
const CODE_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    color: '#d43109',
    letterSpacing: '8px',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    border: '2px solid #e8eef2',
    borderRadius: '12px',
    padding: '10px 14px',
}
const CRY_STYLE = {
    fontFamily: TITLE_FONT_FAMILY,
    color: '#d43109',
    letterSpacing: '0.5px',
    lineHeight: '22px',
    backgroundColor: '#ffffff',
    border: '2px solid #e8eef2',
    borderRadius: '999px',
    padding: '10px 20px',
}
const FOOTER_STYLE = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
}
const STATUS_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    color: '#141414',
}
const TAPS_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    color: '#d43109',
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

<View style={PAGE_STYLE}>
    <View style={CARD_STYLE}>
        <View style={HEADER_STYLE}>
            <View style={BADGE_STYLE}>
                <Image src={COIN_SRC} width="42px" />
            </View>
            <View style={HEADER_TEXTS_STYLE}>
                <Text style={TITLE_STYLE}>Player profile</Text>
                <Text style={SUBTITLE_STYLE}>Four inputs, four type treatments.</Text>
            </View>
        </View>

        <View style={DIVIDER_STYLE} />

        <View style={FIELD_STYLE}>
            <Text style={LABEL_STYLE}>NICKNAME</Text>
            <Input
                id="nickname"
                bind:this={nickname_ref}
                style={{
                    ...NICKNAME_STYLE,
                    ...(focused === 'nickname' && FOCUS_STYLE),
                }}
                value={values.nickname}
                placeholder="Player one"
                placeholderTextColor="#141414"
                onFocus={(event) => handleFocus('nickname', event)}
                onBlur={handleBlur}
            />
        </View>

        <View style={ROW_STYLE}>
            <View style={CLAN_FIELD_STYLE}>
                <Text style={LABEL_STYLE}>CLAN TAG</Text>
                <Input
                    id="clan"
                    style={{ ...CLAN_STYLE, ...(focused === 'clan' && FOCUS_STYLE) }}
                    value={values.clan}
                    placeholder="UNO"
                    placeholderTextColor="#141414"
                    onFocus={(event) => handleFocus('clan', event)}
                    onBlur={handleBlur}
                />
            </View>
            <View style={ROW_FIELD_STYLE}>
                <Text style={LABEL_STYLE}>ACCESS CODE</Text>
                <Input
                    id="code"
                    style={{ ...CODE_STYLE, ...(focused === 'code' && FOCUS_STYLE) }}
                    value={values.code.replace(/./g, '•').trim()}
                    placeholder="000000"
                    placeholderTextColor="#141414"
                    onFocus={(event) => handleFocus('code', event)}
                    onBlur={handleBlur}
                />
            </View>
        </View>

        <View style={FIELD_STYLE}>
            <Text style={LABEL_STYLE}>BATTLE CRY</Text>
            <Input
                id="cry"
                style={{ ...CRY_STYLE, ...(focused === 'cry' && FOCUS_STYLE) }}
                value={values.cry}
                placeholder="For glory and coins!"
                placeholderTextColor="#141414"
                onFocus={(event) => handleFocus('cry', event)}
                onBlur={handleBlur}
            />
        </View>

        <View style={DIVIDER_STYLE} />

        <View style={FOOTER_STYLE}>
            <Text style={STATUS_STYLE}>{focused === null ? 'Tap a field to edit' : `Editing ${focused}`}</Text>
            <Text style={TAPS_STYLE}>{`${taps} taps`}</Text>
        </View>
    </View>
</View>
