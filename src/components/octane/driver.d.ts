import type { ComponentType } from 'octane'
import type { UniversalComponent, UniversalHostDriver, UniversalRoot } from 'octane/universal/native'
import type Node from '../../core/Node'
import type UI from '../../core/UI'

export function registerRootComponent<P>(component: UniversalComponent<P> | ComponentType<P>, options: { ui: UI }): {
    render(props: P): void
    unmount(): void
}

export function createUniversalDriver(options: { ui: UI }): UniversalHostDriver<any, { nodes: { main: Node | null } }> & {
    root: UniversalRoot | null
}
