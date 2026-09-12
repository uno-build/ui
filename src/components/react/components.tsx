import type { ReactElement, ReactNode, Ref } from 'react'
import type { BaseProps, ImageOptions, NodeHandle } from '../props'
import { getImageStyle } from '../shared'
import { useUI } from './context'

export type { StyleProps, StyleName } from '../../style/types'
export type { NodeHandle } from '../props'
export type ComponentProps = BaseProps & { children?: ReactNode; ref?: Ref<NodeHandle> }
export type TextChildren = string | number | boolean | null | undefined | readonly TextChildren[]
export type TextProps = Omit<ComponentProps, 'children'> & { children?: TextChildren }
export type ImageProps = Omit<ComponentProps, 'style'> & ImageOptions

export function View(props: ComponentProps): ReactElement {
    return <view {...props}>{props.children}</view>
}

export function Text({ children, ...props }: TextProps): ReactElement {
    return <text {...props} value={joinText(children)} />
}

export function Image({ src, width, height, style, ...props }: ImageProps): ReactElement {
    const ui = useUI()
    return (
        <view
            {...props}
            style={getImageStyle(ui.resources!, src, {
                ...(width !== undefined && { width }),
                ...(height !== undefined && { height }),
                ...style,
            })}
        />
    )
}

function joinText(children: unknown): string {
    if (children == null || typeof children === 'boolean') {
        return ''
    }
    if (Array.isArray(children)) {
        return children.map(joinText).join('')
    }
    if (typeof children !== 'string' && typeof children !== 'number') {
        throw new Error('<Text> cannot have children.')
    }
    return String(children)
}

// Local host JSX types; the build uses React's automatic JSX runtime.
declare namespace React {
    namespace JSX {
        type Element = ReactElement
        interface ElementChildrenAttribute {
            children: {}
        }
        interface IntrinsicElements {
            view: ComponentProps
            text: Omit<ComponentProps, 'children'> & { value: string }
        }
    }
}
