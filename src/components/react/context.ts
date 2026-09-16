import type UI from '../../core/UI'
import { createContext, useContext } from 'react'

export const UI_CONTEXT = createContext<UI | null>(null)

export function useUI<TUI extends UI = UI>(): TUI {
    return useContext(UI_CONTEXT) as TUI
}
