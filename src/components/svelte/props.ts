import type { Snippet } from 'svelte'
import type { StyleProps } from '../../style/types'
import type { BaseProps, ImageOptions, InputOptions } from '../props'

export type ViewProps = BaseProps & { children?: Snippet }
export type TextProps = BaseProps & { children?: Snippet }
export type ImageProps = Omit<BaseProps, 'style'> & ImageOptions
export type ScrollViewProps = ViewProps & { horizontal?: boolean }
export type InputProps = Omit<BaseProps, 'style'> & InputOptions & { style?: StyleProps }
