import type Node from '../../core/Node'
import type { BaseProps } from './props'
import type { StyleProps } from '../../style/types'
import type {} from 'svelte/elements'

declare module 'svelte/elements' {
    interface SvelteHTMLElements {
        'uno-view': ElementProps
        'uno-text': ElementProps
    }
}

type ElementProps = Omit<BaseProps, 'style'> & {
    css_tag?: string
    node?: Node
    props?: BaseProps
    style?: string | null
    receiveStyles?(style: StyleProps): void
    resolvedStyle?: StyleProps
}
