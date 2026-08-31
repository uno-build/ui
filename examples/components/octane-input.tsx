import { registerRootComponent, View, Input } from 'uno-ui/octane'
import { loadImage, loadJson } from '../../tests/utils/load-assets'

const IMAGE_SRC = 'assets/images/coin.png'

export function OctaneImage() {
    return (
        <View
            style={{
                // backgroundColor: '#1d2027',
                width: '100%',
                height: '100%',
                flexDirection: 'column',
            }}
        >
            <Input />
            <Input value="Hello World esto es un mundo cruel de ejemplo hola que tal" style={{ width: '50%' }} />
            <Input value="Hello World esto es un mundo cruel de ejemplo hola que tal" style={{}} />
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
