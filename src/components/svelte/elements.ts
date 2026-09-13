import type Node from '../../core/Node'
import type { BaseProps } from '../props'
import type {} from 'svelte/elements'

declare module 'svelte/elements' {
    interface SvelteHTMLElements {
        'uno-view': { node: Node; props: BaseProps }
        'uno-text': { node: Node; props: BaseProps }
    }
}
