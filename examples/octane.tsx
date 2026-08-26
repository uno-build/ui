import { useEffect, useState, useRef } from 'octane'
import { universalFor } from 'octane/universal/native'
import { View, Text, Image } from 'uno-ui/octane'

const COLOR_ITEMS = [
    { id: 'red', color: '#e63946', count: 0 },
    { id: 'yellow', color: '#ffb703', count: 0 },
    { id: 'green', color: '#2a9d8f', count: 0 },
    { id: 'blue', color: '#457b9d', count: 0 },
]

export function BasicComponent() {
    const [items, setItems] = useState(COLOR_ITEMS)
    const [disabled_prop, setDisabledProp] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const interval = setInterval(() => {
            // console.log(ref.current)
            setDisabledProp((current) => !current)
            setItems((current_items) =>
                [current_items.at(-1), ...current_items.slice(0, -1)].map((item) => ({
                    ...item,
                    count: item.count + 1,
                })),
            )
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    const styles = {
        width: '800px',
        height: '300px',
        padding: '20px',
        gap: `${items[0].count}px`,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1d2027',
    }

    if (disabled_prop) {
        delete styles.backgroundColor
    }

    return (
        <View>
            <Image src="assets/images/coin.png" style={{ width: '100%', height: '100%' }} />
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
