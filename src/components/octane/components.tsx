import { useUI } from './context'
import { getImageStyle, getScrollViewStyle, getScrollContentStyle } from '../utils'

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

export function ScrollView({ children, horizontal = false, style, contentStyle, ...props }) {
    return (
        <view {...props} style={getScrollViewStyle(horizontal, style)}>
            <view style={getScrollContentStyle(horizontal, contentStyle)}>{children}</view>
        </view>
    )
}
