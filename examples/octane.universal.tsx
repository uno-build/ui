import { useEffect } from 'octane'

export function BasicComponent() @{
    console.log('[octane example] render')

    useEffect(() => {
        console.log('[octane example] mounted')
        return () => console.log('[octane example] unmounted')
    }, [])

    <view name="basic" style={{ color: 'red' }} />
}
