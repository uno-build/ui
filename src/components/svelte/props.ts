import type { Snippet } from 'svelte'
import type { BaseProps, ImageOptions } from '../props'

export type ViewProps = BaseProps & { children?: Snippet }
export type TextProps = BaseProps & { children?: Snippet }
export type ImageProps = Omit<BaseProps, 'style'> & ImageOptions
