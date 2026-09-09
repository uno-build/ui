import { createContext, useContext } from 'octane/universal/native'

export const UI_CONTEXT = createContext(/** @type {import('../../core/UI').default | null} */ (null))

/** @returns {import('../../core/UI').default} */
export function useUI() {
    return useContext(UI_CONTEXT)
}
