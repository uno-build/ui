import { useEffect, useState, useRef } from 'octane'
import { universalFor } from 'octane/universal/native'
import { View, Text, Image } from 'uno-ui/octane'

const COLOR_ITEMS = [
    { id: 'red', color: '#e63946', count: 0 },
    { id: 'yellow', color: '#ffb703', count: 0 },
    { id: 'green', color: '#2a9d8f', count: 0 },
    { id: 'blue', color: '#457b9d', count: 0 },
]
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

export function BasicComponent() {
    // const ref = useRef(null)

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
                <Text style={IMAGE_LABEL_STYLE}>Sin width ni height · 256 × 256</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>Solo width: 160px · resultado 160 × 160</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} style={{ width: '160px' }} />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>Solo height: 120px · resultado 120 × 120</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} style={{ height: '120px' }} />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>Width y height · resultado 180 × 90</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} style={{ width: '180px', height: '90px' }} />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>Solo width: 50% · height mantiene el ratio</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} style={{ width: '50%' }} />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>Solo height: 50% · width mantiene el ratio</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} style={{ height: '50%' }} />
                </View>
            </View>

            <View style={IMAGE_CARD_STYLE}>
                <Text style={IMAGE_LABEL_STYLE}>Width y height: 50% · caja independiente</Text>
                <View style={IMAGE_STAGE_STYLE}>
                    <Image src={IMAGE_SRC} style={{ width: '50%', height: '50%' }} />
                </View>
            </View>

            {/* <View style={styles} ref={ref}>
                {universalFor(
                    items,
                    (item) => item.id,
                    (item) => (
                        <View
                            onClick={(e) => {
                                console.log('clicked', item.id, e)
                                setItems((current_items) =>
                                    current_items.map((entry) =>
                                        entry.id === item.id ? { ...entry, count: entry.count + 1 } : entry,
                                    ),
                                )
                            }}
                            style={{
                                width: '150px',
                                height: '150px',
                                borderRadius: '12px',
                                backgroundColor: item.color,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text
                                style={{ color: '#fff', textStroke: '2px #1d2027' }}
                            >{`${item.id} ${item.count}`}</Text>
                        </View>
                    ),
                )}
            </View> */}
        </View>
    )
}
