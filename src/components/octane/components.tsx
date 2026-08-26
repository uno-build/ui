export function View({ children, ...props }) {
    return <view {...props}>{children}</view>
}

export function Text({ children, ...props }) {
    return <text {...props}>{children}</text>
}

export function Image({ src, style, ...props }) {
    return <view style={{ ...style, backgroundImage: src, backgroundSize: '100% 100%' }} {...props} />
}
