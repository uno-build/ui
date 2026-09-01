import { useRef, useEffect, useState } from 'octane'
import { registerRootComponent, View, Input, useUI } from 'uno-ui/octane'
import { loadImage, loadJson } from '../../tests/utils/load-assets'

const IMAGE_SRC = 'assets/images/coin.png'

export function OctaneImage() {
    const input1Ref = useRef(null)
    const [focused, setFocused] = useState(null)
    const [values, setValues] = useState({
        input1: 'Hi',
        input2: 'Hello World esto es un mundo cruel de ejemplo hola que tal',
        input3: 'Hello World esto es un mundo cruel de ejemplo hola que tal',
    })

    const styles = {
        input1: { border: focused === 'input1' ? '1px solid #007aff' : '1px solid #777777', width: '50%' },
        input2: {
            border: focused === 'input2' ? '1px solid #007aff' : '1px solid #777777',
            padding: '4px',
            width: '75%',
        },
        input3: { border: focused === 'input3' ? '1px solid #007aff' : '1px solid #777777', width: '100%' },
    }

    function onChange(id, value) {
        setValues({ ...values, [id]: value })
    }

    useEffect(() => {
        input1Ref.current.focus()
    }, [])

    return (
        <View
            style={{
                // backgroundColor: '#1d2027',
                width: '100%',
                height: '100%',
                flexDirection: 'column',
            }}
        >
            <Input
                id="input1"
                ref={input1Ref}
                style={styles.input1}
                value={values.input1}
                onFocus={(event) => {
                    setFocused('input1')
                    ShowPlatformKeyboard({
                        node: event.target,
                        value: values.input1,
                        onChange: (value) => onChange('input1', value),
                    })
                }}
                onBlur={() => setFocused(null)}
            />
            <Input
                id="input2"
                value={values.input2}
                style={styles.input2}
                onFocus={(event) => {
                    setFocused('input2')
                    ShowPlatformKeyboard({
                        node: event.target,
                        value: values.input2,
                        onChange: (value) => onChange('input2', value),
                    })
                }}
                onBlur={() => setFocused(null)}
            />
            <Input
                id="input3"
                value={values.input3}
                style={styles.input3}
                onFocus={(event) => {
                    setFocused('input3')
                    ShowPlatformKeyboard({
                        node: event.target,
                        value: values.input3,
                        onChange: (value) => onChange('input3', value),
                    })
                }}
                onBlur={() => setFocused(null)}
            />
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
