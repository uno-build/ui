import type { Component } from 'vue'
import type Node from '../../core/Node'
import type UI from '../../core/UI'
import type { DefinedEvent } from '../../core/UI'
import type { StyleProps } from '../../style/types'
import { createRenderer, defineComponent, h, provide, queuePostFlushCb } from 'vue'
import { UI_CONTEXT } from './context'

export function registerRootComponent<P extends Record<string, any>>(
    RootComponent: Component & (new (...args: any[]) => { $props: P }),
    { ui }: { ui: UI },
) {
    const event_types = new Map<string, DefinedEvent['types'][number]>()
    const styles = new WeakMap<Node, StyleProps>()
    for (const defined_event of ui.defined_events) {
        for (const type of defined_event.types) {
            event_types.set(type.prop, type)
        }
    }

    function updateUI() {
        ui.update()
    }

    function createSentinel() {
        const node = ui.create()!
        node.style('display', 'none')
        return node
    }

    const renderer = createRenderer<Node, Node>({
        createElement(type) {
            if (type !== 'view' && type !== 'text') {
                throw new Error(`Unsupported tag element '<${type}>'`)
            }
            const node = ui.create()!
            if (type === 'text') {
                node.text('')
            }
            return node
        },
        createText(value) {
            rejectText(value)
            return createSentinel()
        },
        createComment: createSentinel,
        setText(_node, value) {
            rejectText(value)
        },
        setElementText(node, value) {
            rejectText(value)
            for (const child of [...node.children]) {
                child.destroy()
            }
            queuePostFlushCb(updateUI)
        },
        insert(node, parent, anchor = null) {
            if (parent.isTextNode()) {
                throw new Error('<Text> cannot have children.')
            }
            if (node === anchor) {
                return
            }
            if (node.parent !== null) {
                node.detach()
            }
            parent.add(node, anchor)
            queuePostFlushCb(updateUI)
        },
        remove(node) {
            node.destroy()
            queuePostFlushCb(updateUI)
        },
        parentNode: (node) => node.parent,
        nextSibling(node) {
            const siblings = node.parent!.children
            return siblings[siblings.indexOf(node) + 1] ?? null
        },
        patchProp(node, name, previous_value, next_value) {
            if (name === 'style') {
                const styles_prev = styles.get(node) ?? {}
                const styles_next: StyleProps = { ...next_value }
                for (const key in styles_next) {
                    if (styles_next[key] === undefined) {
                        delete styles_next[key]
                    }
                }
                for (const key in styles_prev) {
                    if (styles_next.hasOwnProperty(key) === false) {
                        node.style(key, 'unset')
                    }
                }
                for (const key in styles_next) {
                    if (styles_next[key] !== styles_prev[key]) {
                        node.style(key, styles_next[key]!)
                    }
                }
                styles.set(node, styles_next)
            } else if (name === 'value') {
                node.text(next_value)
            } else {
                const type = event_types.get(name)
                if (type === undefined) {
                    return
                }
                if (previous_value != null) {
                    node.off(type.name, previous_value)
                }
                if (next_value != null) {
                    node.on(type.name, next_value)
                }
            }
            queuePostFlushCb(updateUI)
        },
    })

    const RootProvider = defineComponent({
        setup(_props, { slots }) {
            provide(UI_CONTEXT, ui)
            return () => slots.default!()[0]!
        },
    })

    return {
        render(props: P) {
            renderer.render(h(RootProvider, null, { default: () => h(RootComponent, { ...props }) }), ui.root!)
        },
        unmount() {
            renderer.render(null, ui.root!)
        },
    }
}

function rejectText(value: string) {
    if (value !== '') {
        throw new Error('Texts must be inserted into a <Text> component.')
    }
}
