import type { JSX, OctaneNode, Ref } from 'octane'
import type Node from '../../../src/core/Node'
import type { StyleProps } from '../../style/types'
import type { BaseProps, ImageOptions, InputOptions, NodeHandle, ScrollViewHandle, InputHandle } from '../props'

export type { StyleProps, StyleName } from '../../style/types'
export type { NodeHandle, ScrollViewHandle, InputHandle } from '../props'
export type ComponentProps<TRef = NodeHandle> = BaseProps & { children?: OctaneNode, ref?: Ref<TRef> }
export type ImageProps = Omit<ComponentProps, 'style'> & ImageOptions
export type ScrollViewProps = ComponentProps<ScrollViewHandle> & { horizontal?: boolean }
export type InputProps = Omit<ComponentProps<InputHandle>, 'style'> & InputOptions & { style?: StyleProps }

export function View(props: ComponentProps): JSX.Element
export function Text(props: ComponentProps): JSX.Element
export function Image(props: ImageProps): JSX.Element
export function ScrollView(props: ScrollViewProps): JSX.Element
export function Input(props: InputProps): JSX.Element
