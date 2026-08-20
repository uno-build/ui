// import { useEffect, useState, useRef, universalFor } from 'octane'
// import { universalFor } from 'uno-ui/octane'
import { View, Text, universalFor, useEffect, useState, useRef } from 'uno-ui/octane'

const COLOR_ITEMS = [
    { id: 'red', color: '#e63946', count: 0 },
    { id: 'yellow', color: '#ffb703', count: 0 },
    { id: 'green', color: '#2a9d8f', count: 0 },
    { id: 'blue', color: '#457b9d', count: 0 },
]

export function BasicComponent() {
    const [items, setItems] = useState(COLOR_ITEMS)
    const ref = useRef(null)

    useEffect(() => {
        const interval = setInterval(() => {
            // console.log(ref.current)
            setItems((current_items) =>
                [current_items.at(-1), ...current_items.slice(0, -1)].map((item) => ({
                    ...item,
                    count: item.count + 1,
                })),
            )
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    return (
        <View
            ref={ref}
            style={{
                width: '800px',
                height: '300px',
                padding: '20px',
                gap: '20px',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1d2027',
            }}
        >
            {universalFor(
                items,
                (item) => item.id,
                (item) => (
                    <View
                        style={{
                            width: '150px',
                            height: '150px',
                            borderRadius: '12px',
                            backgroundColor: item.color,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{ color: '#fff', textStroke: '2px #1d2027' }}>{`${item.id} ${item.count}`}</Text>
                    </View>
                ),
            )}
        </View>
    )
}
