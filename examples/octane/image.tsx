import { Image, registerRootComponent, Text, View } from 'uno-ui/octane'
import { loadImage, loadJson } from '../../tests/utils/load-assets'

const IMAGE_SRC = 'assets/images/coin.png'
const IMAGE_CARD_STYLE = {
    width: '350px',
    height: '330px',
    padding: '16px',
    gap: '12px',
    backgroundColor: '#252b36',
    flexDirection: 'column',
}
const IMAGE_STAGE_STYLE = {
    flex: '1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151922',
}
const IMAGE_LABEL_STYLE = {
    color: '#ffffff',
    fontSize: '16px',
}

export function OctaneImage() {
    return (
        <View
            style={{
                backgroundColor: '#1d2027',
                width: '100%',
                height: '100%',
                padding: '20px',
                gap: '20px',
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignContent: 'flex-start',
                overflow: 'scroll',
            }}
        >
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

export default function createOctaneImage({ ui, resources }) {
    return Promise.all([
        loadImage('/assets/images/coin.png'),
        loadImage(`/assets/fonts/Poppins-Regular.mtsdf.png`),
        loadJson(`/assets/fonts/Poppins-Regular.mtsdf.json`),
    ]).then(([image, font_image, font_json]) => {
        resources.registerImage(IMAGE_SRC, image)
        resources.registerFont('Poppins-Regular', font_image, font_json)

        const renderer = registerRootComponent(OctaneImage, { ui })
        renderer.render({})
    })
}
