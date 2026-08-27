import { useRef } from 'octane/universal/native'
import { useUI } from './context'
import { getImageStyle, getScrollContentStyle, getScrollViewStyle } from './utils'

const SCROLL_SLOP = 10

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
    const ui = useUI()
    const drag = useRef(null)

    function onPointerDown(event) {
        if (event.source_event.pointerType === 'mouse') {
            return
        }

        const node = event.current_target
        if (horizontal ? node.scrollWidth <= node.clientWidth : node.scrollHeight <= node.clientHeight) {
            return
        }
        drag.current = { x: event.x, y: event.y, left: node.scrollLeft, top: node.scrollTop }
        event.stopPropagation()
    }

    function onPointerMove(event) {
        if (drag.current === null) {
            return
        }

        const node = event.current_target
        const delta = horizontal ? event.x - drag.current.x : event.y - drag.current.y

        if (horizontal) {
            node.scrollLeft = drag.current.left - delta
        } else {
            node.scrollTop = drag.current.top - delta
        }
        if (Math.abs(delta) > SCROLL_SLOP) {
            node.scrolling = true
        }
        ui.update()
    }

    return (
        <view
            {...props}
            style={getScrollViewStyle(horizontal, style)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
        >
            <view style={getScrollContentStyle(horizontal, contentStyle)}>{children}</view>
        </view>
    )
}
