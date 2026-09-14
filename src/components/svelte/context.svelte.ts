import type UI from '../../core/UI'
import type { StyleProps } from '../../style/types'
import { getContext } from 'svelte'
import { enqueueUpdate } from './renderer'

export const UI_CONTEXT = Symbol('uno-ui')

export function createStyles() {
    let current = $state.raw<StyleProps>({})
    return {
        get current() { return current },
        setCurrent(styles: StyleProps) {
            if (Object.keys(current).length !== Object.keys(styles).length ||
                Object.keys(styles).some((name) => current[name] !== styles[name])) current = styles
        },
    }
}

export function useUI<TUI extends UI = UI>(): TUI {
    return getContext<TUI>(UI_CONTEXT)
}

export function createNode() {
    const ui = useUI()
    const node = ui.create()!
    enqueueUpdate(ui)
    $effect.pre(() => () => {
        node.destroy()
        enqueueUpdate(ui)
    })
    return node
}
