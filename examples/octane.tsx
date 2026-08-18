import { useEffect } from 'octane'

export function BasicComponent() {
    // console.log('[octane example] render')

    useEffect(() => {
        // console.log('[octane example] mounted')
        return () => console.log('[octane example] unmounted')
    })

    return (
        <view style={{ width: '100px', height: '100px', backgroundColor: '#f00' }}>
            <view style={{ width: '25px', height: '25px', backgroundColor: '#0f0' }} />
            <view style={{ width: '25px', height: '25px', backgroundColor: '#00f' }} />
        </view>
    )
}
