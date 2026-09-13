<script module lang="ts">
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

<script lang="ts">
import { Image, Text, View } from 'uno-ui/svelte'

const PAGE_STYLE = {
    width: '100%',
    height: '100%',
    padding: '32px',
    gap: '24px',
    backgroundColor: '#ebf0f4',
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
    border: '1px solid #e8eef2',
    borderRadius: '24px',
    boxShadow: '0px 24px 50px -12px #1414141a',
    flexDirection: 'column',
}
const IMAGE_STAGE_STYLE = {
    flex: '1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #e8eef2',
    borderRadius: '18px',
}
const IMAGE_LABEL_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '13px',
    lineHeight: '18px',
    letterSpacing: '0.3px',
    color: '#141414',
}
</script>

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
