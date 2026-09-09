import type { Element } from 'solid-js'

export interface ComponentProps {
    [name: string]: any
    children?: Element
}

export function View(props: ComponentProps): Element
export function Text(props: ComponentProps): Element
export function Image(props: ComponentProps): Element
export function ScrollView(props: ComponentProps): Element
export function Input(props: ComponentProps): Element
