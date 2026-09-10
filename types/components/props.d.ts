import type Node from '../core/Node'
import type { EventProps } from '../events/types'
import type { StyleProps } from '../style/types'

export type NodeHandle = { nodes: { main: Node } }
export type ScrollViewHandle = { nodes: { main: Node, content: Node } }
export type InputHandle = {
    readonly nodes: { main: Node, content: Node, text: Node, caret: Node | null }
    focus(): void
    blur(): void
}
export type BaseProps = EventProps & { id?: string, key?: string | number, style?: StyleProps | null }
export type ImageOptions = { src: string, width?: string, height?: string, style?: StyleProps & { objectFit?: 'fill' | 'contain' | 'cover' | 'none' } | null }
export type InputOptions = { value?: string | number | null, placeholder?: string | number | null, placeholderTextColor?: string }
