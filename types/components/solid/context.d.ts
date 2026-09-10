/**
 * @template {import('../../core/UI').default} [TUI=import('../../core/UI').default]
 * @returns {TUI}
 */
export function useUI<TUI extends import("../../core/UI").default = import("../../core/UI").default<import("../../core/Renderer").default<any, unknown>, import("../../core/Resources").default<any>>>(): TUI;
export const UI_CONTEXT: import("solid-js").Context<import("../../core/UI").default<import("../../core/Renderer").default<any, unknown>, import("../../core/Resources").default<any>> | null>;
