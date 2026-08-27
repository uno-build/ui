import { createContext, useContext } from 'octane/universal/native'

export const UI_CONTEXT = createContext(null)

export function useUI() {
    return useContext(UI_CONTEXT)!
}
