import { Image, registerRootComponent, View, ScrollView, Text } from 'uno-ui/octane'
import { loadImage, loadJson } from '../../tests/utils/load-assets'

const TITLE_FONT_FAMILY = 'ChangaOne-Regular'
const TEXT_FONT_FAMILY = 'Poppins-Regular'
const LOGO_SRC = 'assets/images/logo.jpg'
const TEXTURE_SRC = 'assets/images/texture.jpg'
const COIN_SRC = 'assets/images/coin.png'

const STRIP_SOURCES = [
    TEXTURE_SRC,
    LOGO_SRC,
    COIN_SRC,
    TEXTURE_SRC,
    LOGO_SRC,
    COIN_SRC,
    TEXTURE_SRC,
    LOGO_SRC,
    COIN_SRC,
    TEXTURE_SRC,
    LOGO_SRC,
    COIN_SRC,
]

const PARAGRAPHS = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
]

const PAGE_STYLE = {
    width: '100%',
    height: '100%',
    backgroundColor: '#eef3f7',
}
const PAGE_CONTENT_STYLE = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    padding: '40px',
    gap: '40px',
}
const PANEL_STYLE = {
    width: '450px',
    height: '400px',
    backgroundColor: '#ffffff',
    border: '2px solid #243447',
}
const PANEL_CONTENT_STYLE = {
    padding: '24px',
    gap: '20px',
    flexDirection: 'column',
}
const STRIP_STYLE = {
    width: '940px',
    height: '250px',
    backgroundColor: '#ffffff',
    backgroundImage: COIN_SRC,
    backgroundRepeat: 'repeat',
    backgroundSize: '20px 20px',
    border: '2px solid #243447',
}
const STRIP_CONTENT_STYLE = {
    padding: '24px',
    gap: '24px',
}
const INNER_PANEL_STYLE = {
    width: '100%',
    height: '280px',
    backgroundColor: '#263238',
    border: '2px solid #0d161a',
}
const INNER_PANEL_CONTENT_STYLE = {
    padding: '16px',
    gap: '12px',
    flexDirection: 'column',
}
const TITLE_STYLE = {
    width: '100%',
    fontFamily: TITLE_FONT_FAMILY,
    fontSize: '28px',
}
const STRIP_TITLE_STYLE = {
    width: '300px',
    fontFamily: TITLE_FONT_FAMILY,
    fontSize: '28px',
    color: '#ffffff',
    textStroke: '1px #000000',
    textShadow: '0px 3px 0px #00000088',
}
const TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#444444',
    textAlign: 'justify',
}
const FOOTER_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '16px',
    lineHeight: '24px',
    color: '#243447',
}
const INNER_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '14px',
    lineHeight: '20px',
    color: '#ffffff',
}

export function OctaneScrollView() {
    return (
        <ScrollView style={PAGE_STYLE} onScroll={(event) => console.log('Scroll event:', event)}>
            <View style={{ ...PAGE_CONTENT_STYLE }}>
                <ScrollView style={{ ...PANEL_STYLE, border: '2px solid #1b2a38' }}>
                    <View style={{ ...PANEL_CONTENT_STYLE }}>
                        <Text style={TITLE_STYLE}>Vertical drag scroll example</Text>
                        <Image src={LOGO_SRC} style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
                        {PARAGRAPHS.map((paragraph) => (
                            <Text style={TEXT_STYLE}>{paragraph}</Text>
                        ))}
                    </View>
                </ScrollView>

                <ScrollView style={PANEL_STYLE}>
                    <View style={{ ...PANEL_CONTENT_STYLE, gap: '24px' }}>
                        <Text style={TITLE_STYLE}>Vertical scroll with inner scroll example</Text>
                        <Image src={LOGO_SRC} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                        <ScrollView style={INNER_PANEL_STYLE}>
                            <View style={{ ...INNER_PANEL_CONTENT_STYLE }}>
                                {PARAGRAPHS.flatMap((paragraph) => [
                                    <Text style={INNER_TEXT_STYLE}>{paragraph}</Text>,
                                    <Image
                                        onClick={() => console.log('Image clicked')}
                                        src={TEXTURE_SRC}
                                        style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                                    />,
                                ])}
                            </View>
                        </ScrollView>
                        <Text style={FOOTER_TEXT_STYLE}>{PARAGRAPHS[0]}</Text>
                    </View>
                </ScrollView>

                <ScrollView horizontal style={{ ...STRIP_STYLE, width: '100%' }}>
                    <View style={{ ...STRIP_CONTENT_STYLE }}>
                        <Text style={STRIP_TITLE_STYLE}>Horizontal drag scroll example</Text>
                        {STRIP_SOURCES.map((src) => (
                            <Image src={src} style={{ width: '180px', height: '180px', objectFit: 'cover' }} />
                        ))}
                    </View>
                </ScrollView>
            </View>
        </ScrollView>
    )
}

export default function createOctaneScrollView({ ui, resources }) {
    return Promise.all([
        loadImage(`/${LOGO_SRC}`),
        loadImage(`/${TEXTURE_SRC}`),
        loadImage(`/${COIN_SRC}`),
        loadImage(`/assets/fonts/${TITLE_FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${TITLE_FONT_FAMILY}.mtsdf.json`),
        loadImage(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.json`),
    ]).then(([logo, texture, coin, title_font_image, title_font_json, text_font_image, text_font_json]) => {
        resources.registerImage(LOGO_SRC, logo)
        resources.registerImage(TEXTURE_SRC, texture)
        resources.registerImage(COIN_SRC, coin)
        resources.registerFont(TITLE_FONT_FAMILY, title_font_image, title_font_json)
        resources.registerFont(TEXT_FONT_FAMILY, text_font_image, text_font_json)

        const renderer = registerRootComponent(OctaneScrollView, { ui })
        renderer.render({})
    })
}
