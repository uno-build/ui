import { useRef, useEffect, useState } from 'octane'
import { registerRootComponent, View, Text, Image, Input } from 'uno-ui/octane'
import { loadImage, loadJson } from '../../tests/utils/load-assets'

const TITLE_FONT_FAMILY = 'ChangaOne-Regular'
const TEXT_FONT_FAMILY = 'Poppins-Regular'
const GAME_FONT_FAMILY = 'Nougat-ExtraBlack'
const COIN_SRC = 'assets/images/coin.png'

const PAGE_STYLE = {
    width: '100%',
    height: '100%',
    padding: '32px',
    backgroundColor: '#0b0e14',
    alignItems: 'center',
    justifyContent: 'center',
}
const CARD_STYLE = {
    width: '560px',
    flexDirection: 'column',
    gap: '22px',
    padding: '30px',
    backgroundColor: '#141a24',
    border: '1px solid #232c3a',
    borderRadius: '24px',
    boxShadow: '0px 24px 50px -12px #000000cc',
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
    backgroundColor: '#1b2432',
    border: '1px solid #2c3849',
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
    color: '#ffffff',
    letterSpacing: '0.5px',
    textShadow: '0px 3px 0px #00000066',
}
const SUBTITLE_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '13px',
    lineHeight: '18px',
    color: '#7d8ba0',
}
const DIVIDER_STYLE = {
    height: '1px',
    backgroundColor: '#222b39',
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
    width: '190px',
    flexDirection: 'column',
    gap: '8px',
}
const LABEL_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '11px',
    letterSpacing: '1.6px',
    color: '#7c8aa0',
}
const NICKNAME_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    color: '#e9f0fb',
    letterSpacing: '0.3px',
    backgroundColor: '#0d121b',
    border: '2px solid #253044',
    borderRadius: '12px',
    padding: '10px 14px',
}
const NICKNAME_FOCUS_STYLE = {
    border: '2px solid #4c8dff',
    boxShadow: '0px 0px 0px 4px #4c8dff2e',
}
const CLAN_STYLE = {
    fontFamily: GAME_FONT_FAMILY,
    color: '#ffd76a',
    letterSpacing: '3px',
    textAlign: 'center',
    textStroke: '1px #4a2f00',
    textShadow: '0px 2px 0px #00000073',
    backgroundColor: '#2a2114',
    border: '2px solid #6d5220',
    borderRadius: '14px',
    padding: '10px 14px',
}
const CLAN_FOCUS_STYLE = {
    border: '2px solid #ffb020',
    boxShadow: '0px 0px 0px 4px #ffb0202e',
}
const CODE_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    color: '#ff9f7d',
    letterSpacing: '8px',
    textAlign: 'center',
    backgroundColor: '#1c1116',
    border: '2px solid #40242c',
    borderRadius: '12px',
    padding: '10px 14px',
}
const CODE_FOCUS_STYLE = {
    border: '2px solid #ff6b6b',
    boxShadow: '0px 0px 0px 4px #ff6b6b2e',
}
const CRY_STYLE = {
    fontFamily: TITLE_FONT_FAMILY,
    color: '#8ef7c8',
    letterSpacing: '0.5px',
    lineHeight: '22px',
    backgroundColor: '#0c1a16',
    border: '2px solid #1f4c3f',
    borderRadius: '999px',
    padding: '10px 20px',
}
const CRY_FOCUS_STYLE = {
    border: '2px solid #3ddc9a',
    boxShadow: '0px 0px 0px 4px #3ddc9a2e',
}
const FOOTER_STYLE = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
}
const STATUS_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    color: '#6d7b90',
}
const TAPS_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    color: '#4c8dff',
}

export function OctaneInput() {
    const nickname_ref = useRef(null)
    const [focused, setFocused] = useState(null)
    const [taps, setTaps] = useState(0)
    const [values, setValues] = useState({
        nickname: '',
        clan: '',
        code: '',
        cry: '',
    })

    function handleFocus(id, event) {
        setTaps((count) => count + 1)
        setFocused(id)
        ShowPlatformKeyboard({
            node: event.target,
            value: values[id],
            onChange: (value) => setValues({ ...values, [id]: value }),
        })
    }

    function handleBlur() {
        setFocused(null)
    }

    useEffect(() => {
        nickname_ref.current.focus()
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
                        placeholderTextColor="#4e5a6e"
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
                            placeholderTextColor="#8a6a2f"
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
                            placeholderTextColor="#6b3f42"
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
                        placeholderTextColor="#3f6b5d"
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

const ShowPlatformKeyboard = (function () {
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

    return ({ node, value, onChange }) => {
        input.value = value
        input.oninput = () => onChange(input.value)
        input.onblur = () => node.blur()
        input.focus({ preventScroll: true })
    }
})()

export default function createOctaneInput({ ui, resources }) {
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

            const renderer = registerRootComponent(OctaneInput, { ui })
            renderer.render({})
        },
    )
}
