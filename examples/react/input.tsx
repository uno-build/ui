import { useRef, useEffect, useState } from 'react'
import { registerRootComponent, View, Text, Image, Input, type InputHandle } from 'uno-ui/react'
import { loadImage, loadJson } from '../../tests/utils/load-assets'

const TITLE_FONT_FAMILY = 'ChangaOne-Regular'
const TEXT_FONT_FAMILY = 'Poppins-Regular'
const GAME_FONT_FAMILY = 'Nougat-ExtraBlack'
const COIN_SRC = 'assets/images/coin.png'
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
    backgroundColor: '#202125',
    alignItems: 'center',
    justifyContent: 'center',
}
const CARD_STYLE = {
    width: '560px',
    flexDirection: 'column',
    gap: '22px',
    padding: '30px',
    backgroundColor: '#292a2f',
    border: '1px solid #3c3e45',
    borderRadius: '24px',
    boxShadow: '0px 24px 50px -12px #00000066',
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
    backgroundColor: '#263b44',
    border: '1px solid #3c3e45',
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
    color: '#f5f6f7',
    letterSpacing: '0.5px',
    textShadow: '0px 3px 0px #00000066',
}
const SUBTITLE_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '13px',
    lineHeight: '18px',
    color: '#a5a8b0',
}
const DIVIDER_STYLE = {
    height: '1px',
    backgroundColor: '#3c3e45',
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
    color: '#a5a8b0',
}
const NICKNAME_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    color: '#f5f6f7',
    letterSpacing: '0.3px',
    backgroundColor: '#1a1b1f',
    border: '2px solid #3c3e45',
    borderRadius: '12px',
    padding: '10px 14px',
}
const NICKNAME_FOCUS_STYLE = {
    border: '2px solid #82d8f7',
    boxShadow: '0px 0px 0px 4px #82d8f72e',
}
const CLAN_STYLE = {
    fontFamily: GAME_FONT_FAMILY,
    color: '#82d8f7',
    letterSpacing: '3px',
    textAlign: 'center',
    textStroke: '1px #202125',
    textShadow: '0px 2px 0px #00000073',
    backgroundColor: '#1a1b1f',
    border: '2px solid #3c3e45',
    borderRadius: '14px',
    padding: '10px 14px',
}
const CLAN_FOCUS_STYLE = {
    border: '2px solid #82d8f7',
    boxShadow: '0px 0px 0px 4px #82d8f72e',
}
const CODE_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    color: '#82d8f7',
    letterSpacing: '8px',
    textAlign: 'center',
    backgroundColor: '#1a1b1f',
    border: '2px solid #3c3e45',
    borderRadius: '12px',
    padding: '10px 14px',
}
const CODE_FOCUS_STYLE = {
    border: '2px solid #82d8f7',
    boxShadow: '0px 0px 0px 4px #82d8f72e',
}
const CRY_STYLE = {
    fontFamily: TITLE_FONT_FAMILY,
    color: '#82d8f7',
    letterSpacing: '0.5px',
    lineHeight: '22px',
    backgroundColor: '#1a1b1f',
    border: '2px solid #3c3e45',
    borderRadius: '999px',
    padding: '10px 20px',
}
const CRY_FOCUS_STYLE = {
    border: '2px solid #82d8f7',
    boxShadow: '0px 0px 0px 4px #82d8f72e',
}
const FOOTER_STYLE = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
}
const STATUS_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    color: '#a5a8b0',
}
const TAPS_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    color: '#82d8f7',
}

export function ReactInput() {
    const nickname_ref = useRef<InputHandle | null>(null)
    const [focused, setFocused] = useState<keyof typeof MAX_LENGTHS | null>(null)
    const [taps, setTaps] = useState(0)
    const [values, setValues] = useState({
        nickname: '',
        clan: '',
        code: '',
        cry: '',
    })

    function handleFocus(id: keyof typeof MAX_LENGTHS, event) {
        setTaps((count) => count + 1)
        setFocused(id)
        showPlatformKeyboard({
            node: event.target,
            value: values[id],
            max_length: MAX_LENGTHS[id],
            onChange: (value) => setValues((current_values) => ({ ...current_values, [id]: value })),
        })
    }

    function handleBlur() {
        setFocused(null)
    }

    useEffect(() => {
        nickname_ref.current!.focus()
    }, [])

    return (
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
                        ref={nickname_ref}
                        style={{
                            ...NICKNAME_STYLE,
                            ...(focused === 'nickname' && NICKNAME_FOCUS_STYLE),
                        }}
                        value={values.nickname}
                        placeholder="Player one"
                        placeholderTextColor="#7d818c"
                        onFocus={(event) => handleFocus('nickname', event)}
                        onBlur={handleBlur}
                    />
                </View>

                <View style={ROW_STYLE}>
                    <View style={CLAN_FIELD_STYLE}>
                        <Text style={LABEL_STYLE}>CLAN TAG</Text>
                        <Input
                            id="clan"
                            style={{ ...CLAN_STYLE, ...(focused === 'clan' && CLAN_FOCUS_STYLE) }}
                            value={values.clan}
                            placeholder="UNO"
                            placeholderTextColor="#7d818c"
                            onFocus={(event) => handleFocus('clan', event)}
                            onBlur={handleBlur}
                        />
                    </View>
                    <View style={ROW_FIELD_STYLE}>
                        <Text style={LABEL_STYLE}>ACCESS CODE</Text>
                        <Input
                            id="code"
                            style={{ ...CODE_STYLE, ...(focused === 'code' && CODE_FOCUS_STYLE), textAlign: 'center' }}
                            value={values.code.replace(/./g, '•').trim()}
                            placeholder="000000"
                            placeholderTextColor="#7d818c"
                            onFocus={(event) => handleFocus('code', event)}
                            onBlur={handleBlur}
                        />
                    </View>
                </View>

                <View style={FIELD_STYLE}>
                    <Text style={LABEL_STYLE}>BATTLE CRY</Text>
                    <Input
                        id="cry"
                        style={{ ...CRY_STYLE, ...(focused === 'cry' && CRY_FOCUS_STYLE) }}
                        value={values.cry}
                        placeholder="For glory and coins!"
                        placeholderTextColor="#7d818c"
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
    )
}

const showPlatformKeyboard = (function () {
    const input = document.createElement('input')
    input.id = 'HiddenInput' + Math.random().toString(36).substr(2, 9)
    input.style.position = 'fixed'
    input.style.width = '1px'
    input.style.height = '1px'
    input.style.opacity = '0'
    input.style.pointerEvents = 'none'
    input.style.left = '0'
    input.style.bottom = '0'
    input.tabIndex = -1
    document.body.appendChild(input)

    return ({ node, value, max_length, onChange }) => {
        input.value = value
        input.maxLength = max_length
        input.oninput = () => onChange(input.value)
        input.onblur = () => node.blur()
        input.focus({ preventScroll: true })
    }
})()

export default function createReactInput({ ui, resources }) {
    return Promise.all([
        loadImage(`/${COIN_SRC}`),
        loadImage(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.json`),
        loadImage(`/assets/fonts/${TITLE_FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${TITLE_FONT_FAMILY}.mtsdf.json`),
        loadImage(`/assets/fonts/${GAME_FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${GAME_FONT_FAMILY}.mtsdf.json`),
    ]).then(
        ([
            coin,
            text_font_image,
            text_font_json,
            title_font_image,
            title_font_json,
            game_font_image,
            game_font_json,
        ]) => {
            resources.registerImage(COIN_SRC, coin)
            resources.registerFont(TEXT_FONT_FAMILY, text_font_image, text_font_json)
            resources.registerFont(TITLE_FONT_FAMILY, title_font_image, title_font_json)
            resources.registerFont(GAME_FONT_FAMILY, game_font_image, game_font_json)

            const renderer = registerRootComponent(ReactInput, { ui })
            renderer.render({})
        },
    )
}
