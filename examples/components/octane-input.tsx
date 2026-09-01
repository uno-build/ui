import { useRef, useEffect } from 'octane'
import { registerRootComponent, View, Input, useUI } from 'uno-ui/octane'
import { loadImage, loadJson } from '../../tests/utils/load-assets'

const IMAGE_SRC = 'assets/images/coin.png'

export function OctaneImage() {
    const inputRef1 = useRef()
    const inputRef2 = useRef()
    const inputRef3 = useRef()
    const ui = useUI()

    useEffect(() => {
        ui.events.on('focus', (event) => {
            console.log('Focus event:', event.target)
        })
        ui.events.on('blur', (event) => {
            console.log('Blur event:', event.target)
        })
        // console.log(ui, inputRef1.current, inputRef2.current, inputRef3.current)
    })

    return (
        <View
            style={{
                // backgroundColor: '#1d2027',
                width: '100%',
                height: '100%',
                flexDirection: 'column',
            }}
        >
            <Input ref={inputRef1} />
            <Input
                ref={inputRef2}
                value="Hello World esto es un mundo cruel de ejemplo hola que tal"
                style={{ width: '50%', padding: '4px' }}
            />
            <Input ref={inputRef3} value="Hello World esto es un mundo cruel de ejemplo hola que tal" style={{}} />
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
