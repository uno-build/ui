import type { STYLE } from './index'

export type StyleName = typeof STYLE[keyof typeof STYLE]['name']
// Values are parsed by Uno at runtime; unlike CSS-in-JS, numeric values are not accepted.
export type StyleProps = Partial<Record<StyleName, string>> & { [name: string]: string | undefined }
export type ResolvedStyle = { value: string, parsed: unknown }
export type StyleUpdate = {
    name: StyleName | (string & {})
    value: string
    expanded: Array<ResolvedStyle & { name: StyleName | (string & {}) }>
}
export type LayoutEdges = { top: number, right: number, bottom: number, left: number }
export type NodeLayout = Partial<{
    x: number
    y: number
    width: number
    height: number
    top: number
    left: number
    centerX: number
    centerY: number
    padding: LayoutEdges
    border: LayoutEdges
}>
export type ComputedLayout = Required<Omit<NodeLayout, 'padding' | 'border'>> & Pick<NodeLayout, 'padding' | 'border'>

export type StyleRule = {
    normalize: Array<(value: string) => string>
    validate: Array<(value: string) => void>
    parse: Array<(value: string) => ResolvedStyle>
}

export type StyleContext = { root_size: number, viewport_width: number, viewport_height: number }
