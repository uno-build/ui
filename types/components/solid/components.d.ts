import type { Element, Ref } from 'solid-js'
import type Node from '../../../src/core/Node'
import type { StyleProps } from '../../../src/style/types'
import type { BaseProps, ImageOptions, InputOptions, NodeHandle, ScrollViewHandle, InputHandle } from '../props'

export type { StyleProps, StyleName } from '../../../src/style/types'
export type { NodeHandle, ScrollViewHandle, InputHandle } from '../props'
export type ComponentProps<TRef = Node> = BaseProps & { children?: Element, ref?: Ref<TRef> }
export type ImageProps = Omit<ComponentProps, 'style'> & ImageOptions
export type ScrollViewProps = ComponentProps<ScrollViewHandle> & { horizontal?: boolean }
export type InputProps = Omit<ComponentProps<InputHandle>, 'style'> & InputOptions & { style?: StyleProps }

export function View(props: ComponentProps): Element
export function Text(props: ComponentProps): Element
export function Image(props: ImageProps): Element
export function ScrollView(props: ScrollViewProps): Element
export function Input(props: InputProps): Element
