import type Node from '../../core/Node'
import type UI from '../../core/UI'
import type { BaseProps } from './props'
import type { StyleProps } from '../../style/types'
import type { CssRule } from './styles'
import type { EventProps } from '../../events/types'
import { flushSync, tick } from 'svelte'
import { createRenderer } from 'svelte/renderer'
import { normalizeClass, resolveStyles } from './styles'

class HostNode {
    type: 'element' | 'fragment' | 'text' | 'comment'
    name: string
    value: string
    parent: HostNode | null = null
    children: HostNode[] = []
    node: Node | null = null
    attributes: Record<string, any> = {}
    props: BaseProps = {}
    styles: StyleProps = {}
    listeners = new Map<string, Set<(event: any) => void>>()

    get class_name() { return `${normalizeClass(this.attributes.class ?? this.props.class)} ${this.attributes.css_scope ?? ''}` }
    get tag_name() { return this.attributes.css_tag ?? this.name }
    get id() { return this.attributes.id ?? this.props.id }
    get nodes() { return { main: this.node! } }

    constructor(type: HostNode['type'], name = '', value = '') {
        this.type = type
        this.name = name
        this.value = value
    }
}

const PENDING_UIS = new Set<UI>()
const ROOTS = new Map<UI, HostNode>()
const STYLESHEETS = new Map<string, CssRule[]>()

export function registerStyles(id: string, rules: CssRule[]) {
    STYLESHEETS.set(id, rules)
    for (const ui of ROOTS.keys()) enqueueUpdate(ui)
}

export function enqueueUpdate(ui: UI) {
    if (PENDING_UIS.has(ui)) return
    PENDING_UIS.add(ui)
    void tick().then(() => flushUI(ui))
}

export function flushUI(ui: UI) {
    if (!PENDING_UIS.has(ui)) return
    while (PENDING_UIS.delete(ui)) {
        const root = ROOTS.get(ui)
        if (root) flushSync(() => syncStyles(root))
    }
    ui.update()
}

export function createRoot(ui: UI) {
    const root = new HostNode('element', 'root')
    root.node = ui.root!
    return root
}

export function attachRoot(root: HostNode) {
    ROOTS.set(root.node!.ui!, root)
}

export function detachRoot(ui: UI) {
    ROOTS.delete(ui)
}

export function clearRoot(root: HostNode) {
    for (const child of [...root.children]) {
        removeNode(child)
        destroyNodes(child)
    }
}

function syncStyles(host: HostNode) {
    if (host.node?.ui && host.name !== 'root') {
        const styles = resolveStyles(host, STYLESHEETS.values(), host.attributes.style ?? host.props.style)
        if (host.attributes.receiveStyles) host.attributes.receiveStyles(styles)
        else applyNodeStyles(host, styles)
    }
    for (const child of host.children) syncStyles(child)
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
            if (parent.node !== null && child.type === 'element' && child.node === null) {
                child.node = parent.node.ui!.create()!
                if (child.name === 'uno-text') child.node.text('')
                applyProps(child, child.attributes.props ?? {})
                for (const [name, listeners] of child.listeners) {
                    for (const listener of listeners) child.node.on(name, listener)
                }
                syncChildren(child)
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

function applyNodeStyles(host: HostNode, styles_next: StyleProps) {
    const node = host.node
    if (!node?.ui) return
    const styles_prev = host.styles
    for (const name in styles_prev) {
        if (!Object.hasOwn(styles_next, name)) node.style(name, 'unset')
    }
    for (const name in styles_next) {
        if (styles_next[name] !== styles_prev[name]) node.style(name, styles_next[name]!)
    }
    host.styles = styles_next
}

function applyProps(host: HostNode, props: BaseProps) {
    const node = host.node
    if (node === null) return
    for (const event of node.ui!.defined_events) {
        for (const type of event.types) {
            const previousListener = host.props[type.prop as keyof EventProps]
            const nextListener = props[type.prop as keyof EventProps]
            if (previousListener === nextListener) continue
            if (typeof previousListener === 'function') node.off(type.name, previousListener)
            if (typeof nextListener === 'function') node.on(type.name, nextListener)
        }
    }
    host.props = { ...props, style: { ...props.style } }
    updateNode(host)
}

function destroyNodes(host: HostNode) {
    for (const child of host.children) destroyNodes(child)
    if (host.type === 'element' && !host.attributes.node) host.node?.destroy()
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
        } else if (name === 'resolvedStyle') {
            applyNodeStyles(host, resolveStyles(host, [], value))
        }
        updateNode(host)
    },
    removeAttribute(host, name) {
        delete host.attributes[name]
        if (name === 'props') applyProps(host, {})
        updateNode(host)
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
    remove(host) {
        removeNode(host)
        destroyNodes(host)
    },
    addEventListener(host, type, listener) {
        const name = type.toLowerCase()
        let listeners = host.listeners.get(name)
        if (!listeners) host.listeners.set(name, listeners = new Set())
        listeners.add(listener)
        host.node?.on(name, listener)
    },
    removeEventListener(host, type, listener) {
        const name = type.toLowerCase()
        host.listeners.get(name)?.delete(listener)
        host.node?.off(name, listener)
    },
})

export default renderer
