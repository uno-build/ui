// https://github.com/solidjs/solid/tree/v2.0.0-rc.0/packages/solid-universal

import { createRenderer } from '@solidjs/universal'
import { createComponent as createSolidComponent, flush, onSettled, runWithOwner, useContext } from 'solid-js'
import { UI_CONTEXT } from './context'

const TYPE = {
    ROOT: 'root',
    VIEW: 'view',
    TEXT: 'text',
    $TEXT: '#text',
    SENTINEL: '#sentinel',
}
const HOST_TYPES = new Set([TYPE.VIEW, TYPE.TEXT])
const INSTANCES = new WeakMap()
const PENDING_UIS = new Set()
let update_scheduled = false

export function registerRootComponent(RootComponent, options) {
    const container = createSolidContainer(options)
    let disposeRoot = () => {}

    return {
        render(props) {
            disposeRoot = render(() => createSolidComponent(RootComponent, props), container)
        },
        unmount() {
            disposeRoot()
        },
    }
}

export function createSolidContainer({ ui }) {
    const container = { nodes: { main: ui.root } }
    const instances = new Set([container])

    INSTANCES.set(container, {
        type: TYPE.ROOT,
        node: ui.root,
        ui,
        container,
        instances,
        event_types: createEventTypes(ui),
        props: {},
        listeners: new Map(),
        refs: new Set(),
        children: [],
        parent: null,
    })

    return container
}

function createHostInstance(type, static_props = {}) {
    if (!HOST_TYPES.has(type)) {
        throw new Error(`Unsupported tag element '<${type}>'`)
    }

    const context = useContext(UI_CONTEXT)
    const node = context.ui.create()
    const instance = { nodes: { main: node } }
    const container_instance = getInstance(context.container)

    INSTANCES.set(instance, {
        type,
        node,
        ui: context.ui,
        container: context.container,
        instances: container_instance.instances,
        event_types: container_instance.event_types,
        props: {},
        listeners: new Map(),
        refs: new Set(),
        children: [],
        parent: null,
    })
    container_instance.instances.add(instance)

    for (const name in static_props) {
        setProperty(instance, name, static_props[name])
    }

    return instance
}

function createInternalInstance(type, value) {
    const context = useContext(UI_CONTEXT)
    const container_instance = getInstance(context.container)
    const instance = {}

    INSTANCES.set(instance, {
        type,
        value,
        node: null,
        ui: context.ui,
        container: context.container,
        instances: container_instance.instances,
        refs: new Set(),
        children: [],
        parent: null,
    })
    container_instance.instances.add(instance)

    return instance
}

function applyStyles(node, styles_prev, styles_next) {
    for (const name in styles_prev) {
        if (!Object.prototype.hasOwnProperty.call(styles_next, name)) {
            node.style(name, 'unset')
        }
    }

    for (const name in styles_next) {
        node.style(name, styles_next[name])
    }
}

function setEvent(instance, name, handler) {
    const instance_data = getInstance(instance)
    const type = instance_data.event_types.get(name)

    if (type === undefined) {
        return
    }

    const listener = instance_data.listeners.get(name)

    if (handler == null) {
        if (listener !== undefined) {
            instance_data.node.off(type.name, listener.dispatch)
            instance_data.listeners.delete(name)
        }
    } else if (listener === undefined) {
        const entry = {
            handler,
            dispatch(event) {
                try {
                    flush(() => entry.handler(event))
                } finally {
                    flushUpdates()
                }
            },
        }
        instance_data.listeners.set(name, entry)
        instance_data.node.on(type.name, entry.dispatch)
    } else {
        listener.handler = handler
    }
}

function setProperty(instance, name, value) {
    const instance_data = getInstance(instance)
    const previous_value = instance_data.props[name]

    if (name === 'style') {
        applyStyles(instance_data.node, previous_value ?? {}, value ?? {})
    } else {
        setEvent(instance, name, value)
    }

    if (value === undefined) {
        delete instance_data.props[name]
    } else {
        instance_data.props[name] = value
    }

    enqueueUpdate(instance_data.ui)
}

function removeFromParent(instance) {
    const instance_data = getInstance(instance)
    const parent = instance_data.parent

    if (parent === null) {
        return
    }

    const parent_data = getInstance(parent)
    parent_data.children.splice(parent_data.children.indexOf(instance), 1)
    instance_data.parent = null

    if (instance_data.type === TYPE.$TEXT) {
        parent_data.node.text('')
    } else if (instance_data.type !== TYPE.SENTINEL) {
        instance_data.node.detach()
    }
}

function getBeforeNode(parent_data, child_index) {
    for (let index = child_index + 1; index < parent_data.children.length; index++) {
        const sibling_data = getInstance(parent_data.children[index])

        if (sibling_data.node !== null) {
            return sibling_data.node
        }
    }

    return null
}

function insertNode(parent, instance, anchor) {
    const parent_data = getInstance(parent)
    const instance_data = getInstance(instance)

    if (parent_data.type === TYPE.TEXT && ![TYPE.$TEXT, TYPE.SENTINEL].includes(instance_data.type)) {
        throw new Error('<Text> cannot have children.')
    }
    if (instance_data.type === TYPE.$TEXT && parent_data.type !== TYPE.TEXT) {
        throw new Error('Texts must be inserted into a <Text> component.')
    }

    removeFromParent(instance)

    const child_index = anchor == null ? parent_data.children.length : parent_data.children.indexOf(anchor)
    parent_data.children.splice(child_index, 0, instance)
    instance_data.parent = parent

    if (instance_data.type === TYPE.$TEXT) {
        parent_data.node.text(String(instance_data.value))
    } else if (instance_data.type !== TYPE.SENTINEL) {
        parent_data.node.add(instance_data.node, getBeforeNode(parent_data, child_index))
    }

    enqueueUpdate(parent_data.ui)
}

function releaseInstance(instance) {
    const instance_data = getInstance(instance)

    for (const reference of instance_data.refs) {
        applyRef(reference, null)
    }

    for (const child of instance_data.children) {
        releaseInstance(child)
    }

    instance_data.refs.clear()
    instance_data.children.length = 0
    instance_data.parent = null
    instance_data.instances.delete(instance)
    INSTANCES.delete(instance)
}

function destroyInstance(instance) {
    const instance_data = getInstance(instance)

    if (instance_data.node !== null) {
        instance_data.node.destroy()
    }

    releaseInstance(instance)
}

function removeNode(parent, instance) {
    const parent_data = getInstance(parent)
    const instance_data = getInstance(instance)

    parent_data.children.splice(parent_data.children.indexOf(instance), 1)
    instance_data.parent = null

    if (instance_data.type === TYPE.$TEXT) {
        parent_data.node.text('')
        releaseInstance(instance)
    } else if (instance_data.type === TYPE.SENTINEL) {
        releaseInstance(instance)
    } else {
        destroyInstance(instance)
    }

    enqueueUpdate(parent_data.ui)
}

function cleanupContainer(container) {
    const container_data = getInstance(container)

    while (container_data.children.length > 0) {
        removeNode(container, container_data.children[0])
    }

    const detached_instances = [...container_data.instances].filter(
        (instance) => instance !== container && getInstance(instance).parent === null,
    )
    for (const instance of detached_instances) {
        destroyInstance(instance)
    }
}

const SOLID_RENDERER = createRenderer({
    createElement: createHostInstance,
    createTextNode(value) {
        return createInternalInstance(TYPE.$TEXT, value)
    },
    createSentinel() {
        return createInternalInstance(TYPE.SENTINEL, null)
    },
    replaceText(instance, value) {
        const instance_data = getInstance(instance)
        const parent_data = getInstance(instance_data.parent)
        instance_data.value = value
        parent_data.node.text(String(value))
        enqueueUpdate(parent_data.ui)
    },
    isTextNode(instance) {
        return getInstance(instance).type === TYPE.$TEXT
    },
    setProperty,
    insertNode,
    removeNode,
    getParentNode(instance) {
        return getInstance(instance).parent
    },
    getFirstChild(instance) {
        return getInstance(instance).children[0]
    },
    getNextSibling(instance) {
        const instance_data = getInstance(instance)
        const siblings = getInstance(instance_data.parent).children
        return siblings[siblings.indexOf(instance) + 1]
    },
})

const {
    render: renderSolid,
    ref: setSolidRef,
    effect: createSolidEffect,
    memo,
    createComponent,
    createElement,
    createTextNode,
    insert: insertSolid,
    insertNode: insertSolidNode,
    spread: spreadSolid,
    setProp,
    mergeProps,
    applyRef,
} = SOLID_RENDERER

export {
    memo,
    createComponent,
    createElement,
    createTextNode,
    insertSolid as insert,
    insertSolidNode as insertNode,
    setProp,
    mergeProps,
    applyRef,
}

function updateRefs(instance, reference) {
    const refs = getInstance(instance).refs
    const is_registered = refs.has(reference)

    for (const previous_reference of refs) {
        if (previous_reference !== reference) {
            applyRef(previous_reference, null)
            refs.delete(previous_reference)
        }
    }

    const is_reference = typeof reference === 'function' || Array.isArray(reference)

    if (is_reference) {
        refs.add(reference)
    }

    return is_reference && !is_registered
}

function omitRef(props) {
    return new Proxy(
        {},
        {
            get(_target, name) {
                return name === 'ref' ? undefined : props[name]
            },
            has(_target, name) {
                return name !== 'ref' && name in props
            },
            ownKeys() {
                return Reflect.ownKeys(props).filter((name) => name !== 'ref')
            },
            getOwnPropertyDescriptor(_target, name) {
                if (name === 'ref' || !(name in props)) {
                    return undefined
                }

                return {
                    configurable: true,
                    enumerable: true,
                    get() {
                        return props[name]
                    },
                }
            },
        },
    )
}

export function effect(getValue, applyValue, options) {
    createSolidEffect(
        getValue,
        (value, previous_value) => {
            applyValue(value, previous_value)
        },
        options,
    )
}

export function spread(instance, props, skip_children) {
    const next_props = props ?? {}

    createSolidEffect(
        () => next_props.ref,
        (reference) => {
            if (updateRefs(instance, reference)) {
                setSolidRef(() => reference, instance)
            }
        },
    )

    return spreadSolid(instance, omitRef(next_props), skip_children)
}

export function ref(getRef, instance) {
    const reference = getRef()
    if (updateRefs(instance, reference)) {
        setSolidRef(() => reference, instance)
    }
}

export function render(code, container) {
    const container_data = getInstance(container)
    let disposeRoot

    try {
        disposeRoot = renderSolid(
            () =>
                createSolidComponent(UI_CONTEXT, {
                    value: { ui: container_data.ui, container },
                    get children() {
                        return code()
                    },
                }),
            container,
        )
        flushUpdates()
    } catch (error) {
        cleanupContainer(container)
        flushUpdates()
        throw error
    }

    return () => {
        disposeRoot()
        cleanupContainer(container)
        flushUpdates()
    }
}

function getInstance(instance) {
    return INSTANCES.get(instance)
}

function enqueueUpdate(ui) {
    PENDING_UIS.add(ui)

    if (update_scheduled) {
        return
    }

    update_scheduled = true
    runWithOwner(null, () => onSettled(flushUpdates))
}

function flushUpdates() {
    const pending_uis = [...PENDING_UIS]
    PENDING_UIS.clear()
    update_scheduled = false

    for (const ui of pending_uis) {
        ui.update()
    }
}

function createEventTypes(ui) {
    const event_types = new Map()

    for (const defined_event of ui.defined_events) {
        for (const type of defined_event.types) {
            event_types.set(type.prop, type)
        }
    }

    return event_types
}
