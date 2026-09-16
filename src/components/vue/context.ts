import type { InjectionKey } from 'vue'
import type UI from '../../core/UI'
import { inject } from 'vue'

export const UI_CONTEXT: InjectionKey<UI> = Symbol('uno-ui')

export function useUI<TUI extends UI = UI>(): TUI {
    return inject(UI_CONTEXT) as TUI
}
