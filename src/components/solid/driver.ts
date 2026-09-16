import type Node from '../../core/Node'
import type UI from '../../core/UI'
import type { DefinedEvent } from '../../core/UI'
import type { Component } from 'solid-js'
import type { StyleProps } from '../../style/types'
import { createRenderer } from '@solidjs/universal'
import { onSettled, runWithOwner, useContext } from 'solid-js'
import { UI_CONTEXT } from './context'

// https://github.com/solidjs/solid/tree/v2.0.0-rc.0/packages/solid-universal

const TYPE = {
    VIEW: 'view',
    TEXT: 'text',
}
const TYPES = Object.values(TYPE)
const TEXT_NODES = new WeakSet<Node>()
const EVENT_TYPES = new WeakMap<UI, Map<string, DefinedEvent['types'][number]>>()
const PENDING_UIS = new Set<UI>()
const DETACHED_NODES = new Set<Node>()

const {
    render,
    effect,
    memo,
    createComponent,
    createElement,
    createTextNode,
    insert,
    insertNode,
    spread,
    setProp,
    mergeProps,
    applyRef,
    ref,
} = createRenderer<Node>({
    createElement(type, static_props) {
        if (!TYPES.includes(type)) {
            throw new Error(`Unsupported tag element '<${type}>'`)
        }

        const node = useContext(UI_CONTEXT)!.create()!

        if (type === TYPE.TEXT) {
            TEXT_NODES.add(node)
        }

        for (const name in static_props) {
            setProperty(node, name, static_props[name])
        }

        return node
    },
    // Solid represents an empty slot as an empty text node.
    createTextNode(value) {
        if (value !== '') {
            rejectText()
        }

        return createSentinel()
    },
    replaceText: rejectText,
    isTextNode: () => false,
    createSentinel,
    setProperty,
    insertNode(parent, node, anchor: Node | null = null) {
        if (TEXT_NODES.has(parent)) {
            throw new Error('<Text> cannot have children.')
        }

        if (node.parent !== null) {
            node.detach()
        }

        parent.add(node, anchor)
        enqueueUpdate(parent.ui!)
    },
    // Moving a node is a removal followed by an insertion in the same pass, so the node is only
    // destroyed once the update settles and it is still out of the tree.
    removeNode(parent, node) {
        node.detach()
        DETACHED_NODES.add(node)
        enqueueUpdate(parent.ui!)
    },
    cleanupNodes(parent, nodes) {
        for (const node of nodes) {
            if (node.parent === parent) {
                node.destroy()
            }
        }
    },
    getParentNode(node) {
        return node.parent!
    },
    getFirstChild(node) {
        return node.children[0]
    },
    getNextSibling(node) {
        const siblings = node.parent!.children
        return siblings[siblings.indexOf(node) + 1]
    },
})

export {
    effect,
    memo,
    createComponent,
    createElement,
    createTextNode,
    insert,
    insertNode,
    spread,
    setProp,
    mergeProps,
    applyRef,
    ref,
}

export function registerRootComponent<P extends Record<string, any>>(RootComponent: Component<P>, { ui }: { ui: UI }) {
    let disposeRoot: (() => void) | null = null

    return {
        render(props: P) {
            disposeRoot = render(
                () =>
                    createComponent(UI_CONTEXT as unknown as (props: { value: UI; children: Node }) => Node, {
                        value: ui,
                        get children() {
                            return createComponent(RootComponent as (props: P) => Node, props)
                        },
                    }),
                ui.root!,
            )
        },
        unmount() {
            disposeRoot!()
            ui.update()
        },
    }
}

function rejectText() {
    throw new Error('Texts must be inserted into a <Text> component.')
}

function createSentinel() {
    const node = useContext(UI_CONTEXT)!.create()!
    node.style('display', 'none')
    return node
}

function setProperty(node: Node, name: string, value: any, previous_value?: any) {
    if (name === 'style') {
        applyStyles(node, previous_value ?? {}, value ?? {})
    } else if (name === 'value') {
        node.text(value)
    } else {
        const type = getEventTypes(node.ui!).get(name)

        if (type === undefined) {
            return
        }

        if (previous_value != null) {
            node.off(type.name, previous_value)
        }

        if (value != null) {
            node.on(type.name, value)
        }
    }

    enqueueUpdate(node.ui!)
}

function applyStyles(node: Node, styles_prev: StyleProps, styles_next: StyleProps) {
    for (const name in styles_prev) {
        if (styles_next.hasOwnProperty(name) === false) {
            node.style(name, 'unset')
        }
    }

    for (const name in styles_next) {
        if (styles_next[name] !== styles_prev[name]) {
            node.style(name, styles_next[name]!)
        }
    }
}

function getEventTypes(ui: UI) {
    let event_types = EVENT_TYPES.get(ui)

    if (event_types === undefined) {
        event_types = new Map()

        for (const defined_event of ui.defined_events) {
            for (const type of defined_event.types) {
                event_types.set(type.prop, type)
            }
        }

        EVENT_TYPES.set(ui, event_types)
    }

    return event_types
}

function enqueueUpdate(ui: UI) {
    if (PENDING_UIS.has(ui)) {
        return
    }

    PENDING_UIS.add(ui)
    runWithOwner(null, () =>
        onSettled(() => {
            PENDING_UIS.delete(ui)

            for (const node of DETACHED_NODES) {
                if (node.parent === null) {
                    node.destroy()
                }
            }
            DETACHED_NODES.clear()

            ui.update()
        }),
    )
}
