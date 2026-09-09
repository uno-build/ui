import type { JSX, OctaneNode } from 'octane'

export interface ComponentProps {
    [name: string]: any
    children?: OctaneNode
}

export function View(props: ComponentProps): JSX.Element
export function Text(props: ComponentProps): JSX.Element
export function Image(props: ComponentProps): JSX.Element
export function ScrollView(props: ComponentProps): JSX.Element
export function Input(props: ComponentProps): JSX.Element
