import { useEffect, useState } from 'octane'

export function BasicComponent() {
    const [background_color, setBackgroundColor] = useState('0')

    useEffect(() => {
        const timeout = setTimeout(() => setBackgroundColor('f'), 2000)
        return () => clearTimeout(timeout)
    }, [])

    return (
        <View id="root" style={{ width: '500px', height: '500px', backgroundColor: `#${background_color}00` }}>
            <View id="first" style={{ width: '100px', height: '100px', backgroundColor: `#0${background_color}0` }}>
                <View
                    id="first-a"
                    style={{ width: '25px', height: '25px', backgroundColor: `#f${background_color}0` }}
                />
                <View
                    id="first-b"
                    style={{ width: '25px', height: '25px', backgroundColor: `#f0${background_color}` }}
                />
            </View>
            <View id="second" style={{ width: '100px', height: '100px', backgroundColor: `#00${background_color}` }}>
                <View
                    id="second-a"
                    style={{ width: '25px', height: '25px', backgroundColor: `#f${background_color}0` }}
                />
                <View
                    id="second-b"
                    style={{ width: '25px', height: '25px', backgroundColor: `#f0${background_color}` }}
                />
            </View>
        </View>
    )
}

function View({ children, ...props }) {
    return <view {...props}>{children}</view>
}
