import { useLayoutEffect } from 'octane'

export function BasicComponent() @{
    console.log('[octane example] render')

    useLayoutEffect(() => {
        console.log('[octane example] mounted')
        return () => console.log('[octane example] unmounted')
    }, [])

    <view name="basic" style={{ color: 'red' }} />
}
