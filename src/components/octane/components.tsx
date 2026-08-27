import { useUI } from './context'
import { getImageStyle } from './utils'

export function View({ children, ...props }) {
    return <view {...props}>{children}</view>
}

export function Text({ children, ...props }) {
    return <text {...props}>{children}</text>
}

export function Image({ src, style, ...props }) {
    const ui = useUI()
    return <view {...props} style={getImageStyle(ui.resources, src, style)} />
}
