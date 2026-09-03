import { flatten, omit } from 'solid-js'
import { useUI } from './context'
import { getImageStyle } from '../shared'

export function View(props) {
    return <view {...props}>{props.children}</view>
}

export function Text(props) {
    return <text {...omit(props, 'children')} value={joinText(props.children)} />
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

function joinText(children) {
    const values = flatten(children, { skipNonRendered: true })
    return (Array.isArray(values) ? values : [values ?? '']).map(toTextValue).join('')
}

function toTextValue(value) {
    if (typeof value !== 'string' && typeof value !== 'number') {
        throw new Error('<Text> cannot have children.')
    }

    return value
}
