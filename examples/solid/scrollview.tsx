import { registerRootComponent, Image, ScrollView, Text, View } from '../../src/components/solid'
import { For } from 'solid-js'
import { loadImage, loadJson } from '../shared/load-assets'

const TITLE_FONT_FAMILY = 'Nougat-ExtraBlack'
const TEXT_FONT_FAMILY = 'Poppins-Regular'
const LOGO_SRC = 'assets/images/logo.jpg'
const TEXTURE_SRC = 'assets/images/texture.jpg'
const COIN_SRC = 'assets/images/coin.png'

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

const PAGE_STYLE = {
    width: '100%',
    height: '100%',
    backgroundColor: '#f2f3f5',
}
const PAGE_CONTENT_STYLE = {
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px',
    gap: '24px',
}
const PAGE_HEADER_STYLE = {
    width: '988px',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '16px',
}
const BADGE_STYLE = {
    width: '58px',
    height: '58px',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdf3dc',
    border: '2px solid #1c1c1c',
    borderRadius: '20px',
}
const PAGE_TITLE_STYLE = {
    fontFamily: TITLE_FONT_FAMILY,
    fontSize: '30px',
    color: '#1b1b1b',
    letterSpacing: '0.5px',
}
const PAGE_SUBTITLE_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '13px',
    lineHeight: '18px',
    color: '#9a9aa4',
}
const PANELS_STYLE = {
    flexDirection: 'row',
    gap: '28px',
}
const PANEL_STYLE = {
    width: '480px',
    height: '560px',
    backgroundColor: '#ffffff',
    border: '2px solid #1c1c1c',
    borderRadius: '28px',
    boxShadow: '0px 18px 40px -14px #1b1b1b33',
}
const PANEL_CONTENT_STYLE = {
    flexDirection: 'column',
    padding: '24px',
    gap: '18px',
}
const HERO_STYLE = {
    width: '100%',
    height: '190px',
    objectFit: 'cover',
    borderRadius: '16px',
}
const PANEL_TITLE_STYLE = {
    fontFamily: TITLE_FONT_FAMILY,
    fontSize: '22px',
    color: '#1b1b1b',
    letterSpacing: '0.4px',
}
const LABEL_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '11px',
    letterSpacing: '1.6px',
    color: '#9a9aa4',
}
const TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '14px',
    lineHeight: '22px',
    color: '#3a3a42',
    textAlign: 'justify',
}
const DIVIDER_STYLE = {
    height: '1px',
    backgroundColor: '#ececef',
}
const GALLERY_STYLE = {
    width: '100%',
    height: '150px',
    backgroundColor: '#f7f7f9',
    border: '1px solid #e6e6ec',
    borderRadius: '18px',
}
const GALLERY_CONTENT_STYLE = {
    padding: '14px',
    gap: '14px',
    alignItems: 'center',
}
const GALLERY_IMAGE_STYLE = {
    width: '120px',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '14px',
}
const ENTRIES_STYLE = {
    width: '100%',
    height: '290px',
    backgroundColor: '#f7f7f9',
    border: '1px solid #e6e6ec',
    borderRadius: '18px',
}
const ENTRIES_CONTENT_STYLE = {
    flexDirection: 'column',
    padding: '14px',
    gap: '12px',
}
const ENTRY_STYLE = {
    flexDirection: 'row',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #1c1c1c',
    borderRadius: '14px',
}
const ENTRY_THUMB_STYLE = {
    width: '56px',
    height: '56px',
    objectFit: 'cover',
    borderRadius: '12px',
}
const ENTRY_TEXTS_STYLE = {
    flex: '1',
    flexDirection: 'column',
    gap: '4px',
}
const ENTRY_TITLE_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '14px',
    color: '#1b1b1b',
    letterSpacing: '0.3px',
}
const ENTRY_BODY_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    lineHeight: '18px',
    color: '#9a9aa4',
}
const STRIP_STYLE = {
    width: '988px',
    height: '250px',
    backgroundColor: '#ffffff',
    border: '2px solid #1c1c1c',
    borderRadius: '28px',
    boxShadow: '0px 18px 40px -14px #1b1b1b33',
}
const STRIP_CONTENT_STYLE = {
    padding: '20px',
    gap: '16px',
    alignItems: 'stretch',
}
const STRIP_HEADER_STYLE = {
    width: '190px',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '8px',
    paddingRight: '4px',
}
const CARD_STYLE = {
    width: '170px',
    flexDirection: 'column',
    gap: '10px',
    padding: '12px',
    backgroundColor: '#f7f7f9',
    border: '1px solid #1c1c1c',
    borderRadius: '18px',
}
const CARD_IMAGE_STYLE = {
    width: '100%',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '12px',
}
const CARD_TITLE_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '13px',
    color: '#1b1b1b',
}
const CARD_PRICE_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    letterSpacing: '0.4px',
    color: '#4fae7f',
}
const FOOTER_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    color: '#8f83ea',
}

export function SolidScrollView() {
    return (
        <ScrollView style={PAGE_STYLE}>
            <View style={PAGE_CONTENT_STYLE}>
                <View style={PAGE_HEADER_STYLE}>
                    <View style={BADGE_STYLE}>
                        <Image src={COIN_SRC} width="38px" />
                    </View>
                    <View style={{ flex: '1', flexDirection: 'column', gap: '4px' }}>
                        <Text style={PAGE_TITLE_STYLE}>Scroll playground</Text>
                        <Text style={PAGE_SUBTITLE_STYLE}>Two panels, each with a nested scroll area.</Text>
                    </View>
                </View>

                <View style={PANELS_STYLE}>
                    <ScrollView style={PANEL_STYLE}>
                        <View style={PANEL_CONTENT_STYLE}>
                            <Text style={LABEL_STYLE}>VERTICAL + INNER HORIZONTAL</Text>
                            <Text style={PANEL_TITLE_STYLE}>Featured drop</Text>
                            <Image src={LOGO_SRC} style={HERO_STYLE} />
                            <Text style={TEXT_STYLE}>{PARAGRAPHS[0]}</Text>

                            <ScrollView horizontal style={GALLERY_STYLE}>
                                <View style={GALLERY_CONTENT_STYLE}>
                                    <For each={GALLERY_SOURCES}>
                                        {(src) => <Image src={src} style={GALLERY_IMAGE_STYLE} />}
                                    </For>
                                </View>
                            </ScrollView>

                            <View style={DIVIDER_STYLE} />

                            <For each={PARAGRAPHS}>{(paragraph) => <Text style={TEXT_STYLE}>{paragraph}</Text>}</For>
                            <Text style={FOOTER_STYLE}>Drag the strip sideways</Text>
                        </View>
                    </ScrollView>

                    <ScrollView style={PANEL_STYLE}>
                        <View style={PANEL_CONTENT_STYLE}>
                            <Text style={LABEL_STYLE}>VERTICAL + INNER VERTICAL</Text>
                            <Text style={PANEL_TITLE_STYLE}>Patch notes</Text>
                            <Image src={TEXTURE_SRC} style={{ ...HERO_STYLE, height: '140px' }} />

                            <ScrollView style={ENTRIES_STYLE}>
                                <View style={ENTRIES_CONTENT_STYLE}>
                                    <For each={ENTRIES}>
                                        {(entry) => (
                                            <View style={ENTRY_STYLE}>
                                                <Image src={COIN_SRC} style={ENTRY_THUMB_STYLE} />
                                                <View style={ENTRY_TEXTS_STYLE}>
                                                    <Text style={ENTRY_TITLE_STYLE}>{entry.title}</Text>
                                                    <Text style={ENTRY_BODY_STYLE}>{entry.body}</Text>
                                                </View>
                                            </View>
                                        )}
                                    </For>
                                </View>
                            </ScrollView>

                            <View style={DIVIDER_STYLE} />

                            <For each={PARAGRAPHS}>{(paragraph) => <Text style={TEXT_STYLE}>{paragraph}</Text>}</For>
                            <Text style={FOOTER_STYLE}>Inner list scrolls on its own</Text>
                        </View>
                    </ScrollView>
                </View>

                <ScrollView horizontal style={STRIP_STYLE}>
                    <View style={STRIP_CONTENT_STYLE}>
                        <View style={STRIP_HEADER_STYLE}>
                            <Text style={LABEL_STYLE}>HORIZONTAL</Text>
                            <Text style={PANEL_TITLE_STYLE}>Night market</Text>
                            <Text style={ENTRY_BODY_STYLE}>Drag left and right to browse the offers.</Text>
                        </View>
                        <For each={ITEMS}>
                            {(item) => (
                                <View style={CARD_STYLE}>
                                    <Image src={item.src} style={CARD_IMAGE_STYLE} />
                                    <Text style={CARD_TITLE_STYLE}>{item.title}</Text>
                                    <Text style={CARD_PRICE_STYLE}>{item.price}</Text>
                                </View>
                            )}
                        </For>
                    </View>
                </ScrollView>
            </View>
        </ScrollView>
    )
}

export default function createSolidScrollView({ ui, resources }) {
    return Promise.all([
        loadImage(LOGO_SRC),
        loadImage(TEXTURE_SRC),
        loadImage(COIN_SRC),
        loadImage(`assets/fonts/${TITLE_FONT_FAMILY}.mtsdf.png`),
        loadJson(`assets/fonts/${TITLE_FONT_FAMILY}.mtsdf.json`),
        loadImage(`assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.png`),
        loadJson(`assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.json`),
    ]).then(([logo, texture, coin, title_font_image, title_font_json, text_font_image, text_font_json]) => {
        resources.registerImage(LOGO_SRC, logo)
        resources.registerImage(TEXTURE_SRC, texture)
        resources.registerImage(COIN_SRC, coin)
        resources.registerFont(TITLE_FONT_FAMILY, { image: title_font_image.image, data: title_font_json })
        resources.registerFont(TEXT_FONT_FAMILY, { image: text_font_image.image, data: text_font_json })

        const renderer = registerRootComponent(SolidScrollView, { ui })
        renderer.render({})
    })
}
