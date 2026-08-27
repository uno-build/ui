import { onSettled } from 'solid-js'

export function BasicComponent() {
    console.log('[solid example] render')

    onSettled(() => {
        console.log('[solid example] mounted')
        return () => console.log('[solid example] unmounted')
    })

    return <view name="basic" style={{ color: 'red' }} />
}
