import type UI from '../../core/UI'
import { getContext } from 'svelte'
import { enqueueUpdate } from './renderer'

export const UI_CONTEXT = Symbol('uno-ui')

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
