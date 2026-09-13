import type Node from '../../core/Node'
import type UI from '../../core/UI'
import type { BaseProps } from '../props'
import type { StyleProps } from '../../style/types'
import { tick } from 'svelte'
import { createRenderer } from 'svelte/renderer'

class HostNode {
    type: 'element' | 'fragment' | 'text' | 'comment'
    name: string
    value: string
    parent: HostNode | null = null
    children: HostNode[] = []
    node: Node | null = null
    attributes: Record<string, any> = {}
    props: BaseProps = {}

    constructor(type: HostNode['type'], name = '', value = '') {
        this.type = type
        this.name = name
        this.value = value
    }
}

const PENDING_UIS = new Set<UI>()

export function enqueueUpdate(ui: UI) {
    if (PENDING_UIS.has(ui)) return
    PENDING_UIS.add(ui)
    void tick().then(() => flushUI(ui))
}

export function flushUI(ui: UI) {
    if (PENDING_UIS.delete(ui)) ui.update()
}

export function createRoot(ui: UI) {
    const root = new HostNode('element', 'root')
    root.node = ui.root!
    return root
}

function updateNode(host: HostNode) {
    if (host.node?.ui) enqueueUpdate(host.node.ui)
}

function syncChildren(parent: HostNode) {
    if (parent.type === 'fragment') return

    if (parent.name === 'uno-text') {
        let value = ''
        for (const child of parent.children) {
            if (child.type === 'element') throw new Error('<Text> cannot have children.')
            if (child.type === 'text') value += child.value
        }
        parent.node?.text(value)
    } else {
        let index = 0
        for (const child of parent.children) {
            if (child.type === 'text' && child.value.trim() !== '') {
                throw new Error('Texts must be inserted into a <Text> component.')
            }
            if (parent.node !== null && child.node !== null) {
                const anchor = parent.node.children[index] ?? null
                if (anchor !== child.node) {
                    child.node.detach()
                    parent.node.add(child.node, anchor)
                }
                index++
            }
        }
    }
    updateNode(parent)
}

function removeNode(host: HostNode) {
    const parent = host.parent
    if (parent === null) return
    parent.children.splice(parent.children.indexOf(host), 1)
    host.parent = null
    host.node?.detach()
    syncChildren(parent)
}

function insertNode(parent: HostNode, host: HostNode, anchor: HostNode | null) {
    if (host === anchor) return
    if (host.type === 'fragment') {
        for (const child of [...host.children]) insertNode(parent, child, anchor)
        return
    }
    removeNode(host)
    const index = anchor === null ? parent.children.length : parent.children.indexOf(anchor)
    parent.children.splice(index, 0, host)
    host.parent = parent
    syncChildren(parent)
}

function applyProps(host: HostNode, props: BaseProps) {
    const node = host.node
    if (node === null) return
    const styles_prev = host.props.style ?? {}
    const styles_next: StyleProps = { ...props.style }
    for (const name in styles_next) {
        if (styles_next[name] === undefined) delete styles_next[name]
    }
    for (const name in styles_prev) {
        if (!Object.hasOwn(styles_next, name)) node.style(name, 'unset')
    }
    for (const name in styles_next) {
        if (styles_next[name] !== styles_prev[name]) node.style(name, styles_next[name]!)
    }
    for (const event of node.ui!.defined_events) {
        for (const type of event.types) {
            const previousListener = host.props[type.prop as keyof BaseProps]
            const nextListener = props[type.prop as keyof BaseProps]
            if (previousListener === nextListener) continue
            if (typeof previousListener === 'function') node.off(type.name, previousListener)
            if (typeof nextListener === 'function') node.on(type.name, nextListener)
        }
    }
    host.props = { ...props, style: styles_next }
    updateNode(host)
}

const renderer = createRenderer<{
    fragment: HostNode
    element: HostNode
    text: HostNode
    comment: HostNode
}>({
    createFragment: () => new HostNode('fragment'),
    createElement(name) {
        if (name !== 'uno-view' && name !== 'uno-text') {
            throw new Error(`Unsupported tag element '<${name}>'`)
        }
        return new HostNode('element', name)
    },
    createTextNode: (value) => new HostNode('text', '', value),
    createComment: (value) => new HostNode('comment', '', value),
    nodeType: (host) => host.type,
    getNodeValue: (host) => host.value,
    getAttribute: (host, name) => host.attributes[name] ?? null,
    hasAttribute: (host, name) => Object.hasOwn(host.attributes, name),
    setAttribute(host, name, value) {
        host.attributes[name] = value
        if (name === 'node') {
            host.node = value
            applyProps(host, host.attributes.props ?? {})
            syncChildren(host)
            if (host.parent !== null) syncChildren(host.parent)
        } else if (name === 'props') {
            applyProps(host, value)
        }
    },
    removeAttribute(host, name) {
        delete host.attributes[name]
        if (name === 'props') applyProps(host, {})
    },
    setText(host, value) {
        if (host.type === 'text' || host.type === 'comment') {
            host.value = value
            if (host.parent !== null) syncChildren(host.parent)
        } else {
            for (const child of [...host.children]) removeNode(child)
            if (value !== '') insertNode(host, new HostNode('text', '', value), null)
            else syncChildren(host)
        }
    },
    getFirstChild: (host) => host.children[0] ?? null,
    getLastChild: (host) => host.children.at(-1) ?? null,
    getNextSibling(host) {
        if (host.parent === null) return null
        return host.parent.children[host.parent.children.indexOf(host) + 1] ?? null
    },
    getParent: (host) => host.parent,
    insert: insertNode,
    remove: removeNode,
    addEventListener(host, type, listener) {
        host.node!.on(type, listener)
    },
    removeEventListener(host, type, listener) {
        host.node!.off(type, listener)
    },
})

export default renderer
