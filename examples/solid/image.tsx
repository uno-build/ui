import { registerRootComponent, Image, Text, View } from '../../src/components/solid'
import { loadImage, loadJson } from '../shared/load-assets'

const TEXT_FONT_FAMILY = 'Poppins-Regular'
const IMAGE_SRC = 'assets/images/coin.png'
const PAGE_STYLE = {
    width: '100%',
    height: '100%',
    padding: '32px',
    gap: '24px',
    backgroundColor: '#f2f3f5',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    overflow: 'scroll',
}
const IMAGE_CARD_STYLE = {
    width: '350px',
    height: '330px',
    padding: '20px',
    gap: '14px',
    backgroundColor: '#ffffff',
    border: '2px solid #1c1c1c',
    borderRadius: '28px',
    boxShadow: '0px 18px 40px -14px #1b1b1b33',
    flexDirection: 'column',
}
const IMAGE_STAGE_STYLE = {
    flex: '1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f7f9',
    border: '1px solid #e6e6ec',
    borderRadius: '18px',
}
const IMAGE_LABEL_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '13px',
    lineHeight: '18px',
    letterSpacing: '0.3px',
    color: '#9a9aa4',
}

export function SolidImage() {
    return (
        <View style={PAGE_STYLE}>
            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>No width or height - 256x256</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>Width only: 160px - result 160x160</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} width="160px" />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>Height only: 120px - result 120x120</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} height="120px" />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>objectFit: fill - 180x90 box</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} width="180px" height="90px" style={{ objectFit: 'fill' }} />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>objectFit: contain - 180x90 box</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} width="180px" height="90px" style={{ objectFit: 'contain' }} />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>objectFit: cover - 180x90 box</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} width="180px" height="90px" style={{ objectFit: 'cover' }} />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>objectFit: none - 180x90 box</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} width="180px" height="90px" style={{ objectFit: 'none' }} />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>Width only: 50% - height preserves the aspect ratio</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} width="50%" />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>Height only: 50% - width preserves the aspect ratio</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} height="50%" />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>Width and height: 50% - independent box</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} width="50%" height="50%" />
                </View>
            </View>
        </View>
    )
}

export default function createSolidImage({ ui, resources }) {
    return Promise.all([
        loadImage(IMAGE_SRC),
        loadImage(`assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.png`),
        loadJson(`assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.json`),
    ]).then(([image, font_image, font_json]) => {
        resources.registerImage(IMAGE_SRC, image)
        resources.registerFont(TEXT_FONT_FAMILY, font_image, font_json)

        const renderer = registerRootComponent(SolidImage, { ui })
        renderer.render({})
    })
}
