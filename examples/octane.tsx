import { useEffect, useState } from 'octane'

export function BasicComponent() {
    const [background_color, setBackgroundColor] = useState('#f00')

    useEffect(() => {
        const timeout = setTimeout(() => setBackgroundColor('#ff0'), 2000)
        return () => clearTimeout(timeout)
    }, [])

    return (
        <view style={{ width: '100px', height: '100px', backgroundColor: background_color }}>
            <view style={{ width: '25px', height: '25px', backgroundColor: '#0f0' }} />
            <view style={{ width: '25px', height: '25px', backgroundColor: '#00f' }} />
        </view>
    )
}
