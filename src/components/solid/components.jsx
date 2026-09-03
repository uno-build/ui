import { useUI } from './context'
import { getImageStyle } from '../shared'

export function View(props) {
    return <view {...props}>{props.children}</view>
}

export function Text(props) {
    return <text {...props}>{props.children}</text>
}

export function Image({ src, width, height, style, ...props }) {
    const ui = useUI()
    return (
        <view
            {...props}
            style={getImageStyle(ui.resources, src, {
                ...(width !== undefined && { width }),
                ...(height !== undefined && { height }),
                ...style,
            })}
        />
    )
}
