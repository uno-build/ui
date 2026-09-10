/**
 * @template {import('../../core/UI').default} [TUI=import('../../core/UI').default]
 * @returns {TUI}
 */
export function useUI<TUI extends import("../../../src/core/UI").default = import("../../../src/core/UI").default<import("../../../src/core/Renderer").default<unknown, unknown, unknown, unknown>, import("../../../src/core/Resources").default<unknown, import("../../../src/core/Resources").ResourceTypes>>>(): TUI;
export const UI_CONTEXT: import("octane/universal/native").NativeUniversalContext<import("../../../src/core/UI").default<import("../../../src/core/Renderer").default<unknown, unknown, unknown, unknown>, import("../../../src/core/Resources").default<unknown, import("../../../src/core/Resources").ResourceTypes>> | null>;
