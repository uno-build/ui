import { useEffect, useState, useRef } from 'octane'
import { universalFor } from 'octane/universal/native'

const COLOR_ITEMS = [
    { id: 'red', color: '#e63946' },
    { id: 'yellow', color: '#ffb703' },
    { id: 'green', color: '#2a9d8f' },
    { id: 'blue', color: '#457b9d' },
]

export function BasicComponent() {
    const [items, setItems] = useState(COLOR_ITEMS)
    const ref = useRef(null)

    useEffect(() => {
        const interval = setInterval(() => {
            console.log(ref.current)

            setItems((current_items) => [current_items.at(-1), ...current_items.slice(0, -1)])
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    return (
        <View
            ref={ref}
            style={{
                width: '500px',
                height: '140px',
                padding: '20px',
                gap: '20px',
                alignItems: 'center',
                backgroundColor: '#1d2027',
            }}
        >
            {universalFor(
                items,
                (item) => item.id,
                (item) => (
                    <View
                        style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '12px',
                            backgroundColor: item.color,
                        }}
                    />
                ),
            )}
        </View>
    )
}

function View({ children, ...props }) {
    return <view {...props}>{children}</view>
}
