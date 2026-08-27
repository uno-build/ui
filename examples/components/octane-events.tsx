import { useState } from 'octane/universal/native'
import { registerRootComponent, Text, View } from 'uno-ui/octane'
import { loadImage, loadJson } from '../../tests/utils/load-assets'

const FONT_FAMILY = 'Supercell-Magic'
const LABEL_STYLE = {
    color: '#ffffff',
    fontFamily: FONT_FAMILY,
    fontSize: '18px',
}

export function OctaneEvents() {
    const [event_name, setEventName] = useState('none')
    const [click_count, setClickCount] = useState(0)

    return (
        <View
            style={{
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                backgroundColor: '#1d2027',
                flexDirection: 'column',
            }}
        >
            <Text style={LABEL_STYLE}>Last event: {event_name}</Text>
            <Text style={LABEL_STYLE}>Clicks: {click_count}</Text>
            <View
                onPointerOver={() => setEventName('pointerover')}
                onPointerMove={() => setEventName('pointermove')}
                onPointerDown={() => setEventName('pointerdown')}
                onPointerUp={() => setEventName('pointerup')}
                onPointerOut={() => setEventName('pointerout')}
                onClick={() => {
                    setEventName('click')
                    setClickCount((count) => count + 1)
                }}
                style={{
                    width: '320px',
                    height: '180px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#252b36',
                    border: '4px solid #64748b',
                    borderRadius: '12px',
                }}
            >
                <Text style={LABEL_STYLE}>Interact with me</Text>
            </View>
        </View>
    )
}

export default function createOctaneEvents({ ui, resources }) {
    return Promise.all([
        loadImage(`/assets/fonts/${FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${FONT_FAMILY}.mtsdf.json`),
    ]).then(([font_image, font_json]) => {
        resources.registerFont(FONT_FAMILY, font_image, font_json)

        const renderer = registerRootComponent(OctaneEvents, { ui })
        renderer.render({})
    })
}
