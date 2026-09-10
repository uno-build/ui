import { createContext, useContext } from 'octane/universal/native'

export const UI_CONTEXT = createContext(/** @type {import('../../core/UI').default | null} */ (null))

/**
 * @template {import('../../core/UI').default} [TUI=import('../../core/UI').default]
 * @returns {TUI}
 */
export function useUI() {
    return useContext(UI_CONTEXT)
}
