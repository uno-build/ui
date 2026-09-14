import type { Component } from 'svelte'
import type UI from '../../core/UI'
import { flushSync, mount, unmount as unmountSvelte } from 'svelte'
import { UI_CONTEXT } from './context.svelte'
import renderer, { attachRoot, clearRoot, createRoot, detachRoot, flushUI } from './renderer'

export function registerRootComponent<P extends Record<string, any>>(rootComponent: Component<P>, { ui }: { ui: UI }) {
    const root = createRoot(ui)
    const root_props = $state<Record<string, any>>({})
    let instance: Record<string, any> | null = null

    return {
        render(props: P) {
            flushSync(() => {
                for (const name in root_props) {
                    if (!Object.hasOwn(props, name)) delete root_props[name]
                }
                Object.assign(root_props, props)
                if (instance === null) {
                    attachRoot(root)
                    try {
                        instance = mount(rootComponent, {
                            renderer,
                            target: root,
                            props: root_props as P,
                            context: new Map([[UI_CONTEXT, ui]]),
                        })
                    } catch (error) {
                        detachRoot(ui)
                        clearRoot(root)
                        throw error
                    }
                }
            })
            flushUI(ui)
        },
        unmount() {
            if (instance === null) return
            flushSync(() => {
                void unmountSvelte(instance!)
                instance = null
            })
            flushUI(ui)
            detachRoot(ui)
        },
    }
}
