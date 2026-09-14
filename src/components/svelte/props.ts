import type { Snippet } from 'svelte'
import type { ClassValue } from 'svelte/elements'
import type { StyleProps } from '../../style/types'
import type { BaseProps as SharedProps, ImageOptions, InputOptions } from '../props'

export type BaseProps = SharedProps & { class?: ClassValue, css_scope?: string }

export type ViewProps = BaseProps & { children?: Snippet }
export type TextProps = BaseProps & { children?: Snippet }
export type ImageProps = Omit<BaseProps, 'style'> & ImageOptions
export type ScrollViewProps = ViewProps & { horizontal?: boolean }
export type InputProps = Omit<BaseProps, 'style'> & InputOptions & { style?: StyleProps }
