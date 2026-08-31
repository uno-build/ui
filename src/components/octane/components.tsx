import { useUI } from './context'
import { getImageStyle, getScrollViewStyle, getScrollContentStyle } from '../utils'

export function View({ children, ...props }) {
    return <view {...props}>{children}</view>
}

export function Text({ children, ...props }) {
    return <text {...props}>{children}</text>
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

export function ScrollView({ children, horizontal = false, style, contentStyle, ...props }) {
    return (
        <view {...props} style={getScrollViewStyle(horizontal, style)}>
            <view style={getScrollContentStyle(horizontal, contentStyle)}>{children}</view>
        </view>
    )
}

export function Input({ style, value, ...props }) {
    return (
        <view
            style={{
                backgroundColor: '#ffffff',
                border: '1px solid #999999',
                borderRadius: '3px',
                minWidth: '150px',
                maxWidth: '150px',
                alignSelf: 'flex-start',
                overflowX: 'hidden',
                ...style,
            }}
            {...props}
        >
            <text style={{ fontSize: style.fontSize || '12px', whiteSpace: 'nowrap' }}>{value}</text>
        </view>
    )
}
