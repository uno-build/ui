import { createContext, useContext } from 'solid-js'

export const UI_CONTEXT = createContext(null)

export function useUI() {
    return useContext(UI_CONTEXT).ui
}
