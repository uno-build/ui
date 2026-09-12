import type { ComponentType } from 'react'
import type Node from '../../core/Node'
import type UI from '../../core/UI'
import type { DefinedEvent } from '../../core/UI'
import type { StyleProps } from '../../style/types'
import type { NodeHandle } from '../props'
import { createContext, createElement } from 'react'
import createReconciler from 'react-reconciler'
import {
    ConcurrentRoot,
    ContinuousEventPriority,
    DefaultEventPriority,
    DiscreteEventPriority,
    NoEventPriority,
} from 'react-reconciler/constants.js'
import { UI_CONTEXT } from './context'

type HostProps = Record<string, any> & { style?: StyleProps | null; value?: string }
type Container = { ui: UI; event_types: Map<string, DefinedEvent['types'][number]> }
type HostInstance = {
    type: 'view' | 'text'
    props: HostProps
    container: Container
    initial_children: HostInstance[]
    node: Node | null
    public_instance: NodeHandle | null
    listeners: Map<string, (event: any) => void>
}
type HostConfig = createReconciler.HostConfig<
    string, HostProps, Container, HostInstance, never, never, never, never,
    NodeHandle, object, never, ReturnType<typeof setTimeout>, -1, null
>

const HOST_CONTEXT = {}
const EVENT_PRIORITIES: Record<string, number> = {
    discrete: DiscreteEventPriority,
    continuous: ContinuousEventPriority,
    default: DefaultEventPriority,
}
let current_update_priority: number = NoEventPriority
let current_event: { type: string; time_stamp: number } | null = null

const HOST_CONFIG: HostConfig = {
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    supportsMicrotasks: true,
    isPrimaryRenderer: false,
    getRootHostContext: () => HOST_CONTEXT,
    getChildHostContext: () => HOST_CONTEXT,
    getPublicInstance: (instance) => instance.public_instance!,
    createInstance(type, props, container) {
        if (type !== 'view' && type !== 'text') {
            throw new Error(`Unsupported tag element '<${type}>'`)
        }
        if (type === 'text' && props.children != null) {
            throw new Error('<Text> cannot have children.')
        }
        return {
            type, props, container, initial_children: [], node: null,
            public_instance: null, listeners: new Map(),
        }
    },
    createTextInstance() {
        throw new Error('Texts must be inserted into a <Text> component.')
    },
    appendInitialChild(parent, child) {
        if (parent.type === 'text') {
            throw new Error('<Text> cannot have children.')
        }
        parent.initial_children.push(child)
    },
    finalizeInitialChildren: () => false,
    shouldSetTextContent: () => false,
    prepareForCommit: () => null,
    resetAfterCommit: ({ ui }) => { ui.update() },
    appendChild: (parent, child) => insertNode(parent.node!, child),
    appendChildToContainer: ({ ui }, child) => insertNode(ui.root!, child),
    insertBefore: (parent, child, anchor) => insertNode(parent.node!, child, anchor),
    insertInContainerBefore: ({ ui }, child, anchor) => insertNode(ui.root!, child, anchor),
    removeChild: (_parent, child) => child.node!.destroy(),
    removeChildFromContainer: (_container, child) => child.node!.destroy(),
    clearContainer({ ui }) {
        for (const child of [...ui.root!.children]) {
            child.destroy()
        }
    },
    commitUpdate(instance, _type, previous_props, next_props) {
        applyProps(instance, previous_props, next_props)
    },
    detachDeletedInstance(instance) {
        instance.node = null
        instance.public_instance = null
        instance.listeners.clear()
    },
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    noTimeout: -1,
    scheduleMicrotask: queueMicrotask,
    setCurrentUpdatePriority(priority) { current_update_priority = priority },
    getCurrentUpdatePriority: () => current_update_priority,
    resolveUpdatePriority: () => current_update_priority === NoEventPriority ? DefaultEventPriority : current_update_priority,
    resolveEventType: () => current_event?.type ?? null,
    resolveEventTimeStamp: () => current_event?.time_stamp ?? -1,
    shouldAttemptEagerTransition: () => false,
    trackSchedulerEvent() {},
    maySuspendCommit: () => false,
    preloadInstance: () => true,
    startSuspendingCommit() {},
    suspendInstance() {},
    waitForCommitToBeReady: () => null,
    NotPendingTransition: null,
    HostTransitionContext: createContext(null) as unknown as createReconciler.ReactContext<null>,
    resetFormInstance() {},
    requestPostPaintCallback() {},
    preparePortalMount() {},
    getInstanceFromNode: () => null,
    beforeActiveInstanceBlur() {},
    afterActiveInstanceBlur() {},
    prepareScopeUpdate() {},
    getInstanceFromScope: () => null,
}

const renderer = createReconciler(HOST_CONFIG)
// The types declare these callbacks on the factory, but React exports them on the renderer.
const reconciler = renderer as typeof renderer & Pick<typeof createReconciler,
    'defaultOnUncaughtError' | 'defaultOnCaughtError' | 'defaultOnRecoverableError'>

export function registerRootComponent<P extends Record<string, any>>(RootComponent: ComponentType<P>, { ui }: { ui: UI }) {
    const event_types = new Map<string, DefinedEvent['types'][number]>()
    for (const defined_event of ui.defined_events) {
        for (const type of defined_event.types) {
            event_types.set(type.prop, type)
        }
    }
    const container = reconciler.createContainer(
        { ui, event_types }, ConcurrentRoot, null, false, null, '',
        reconciler.defaultOnUncaughtError,
        reconciler.defaultOnCaughtError,
        reconciler.defaultOnRecoverableError,
        () => {},
    )
    return {
        render(props: P) {
            const tree = createElement(UI_CONTEXT, { value: ui }, createElement(RootComponent, props))
            reconciler.updateContainerSync(tree, container, null, null)
            reconciler.flushSyncWork()
        },
        unmount() {
            reconciler.updateContainerSync(null, container, null, null)
            reconciler.flushSyncWork()
        },
    }
}

function materialize(instance: HostInstance): Node {
    if (instance.node === null) {
        // Uno allocates renderer resources immediately, so nodes are created only during commit.
        const node = instance.container.ui.create()!
        instance.node = node
        instance.public_instance = { nodes: { main: node } }
        applyProps(instance, {}, instance.props)
        for (const child of instance.initial_children) {
            node.add(materialize(child))
        }
        instance.initial_children.length = 0
    }
    return instance.node
}

function insertNode(parent: Node, instance: HostInstance, anchor: HostInstance | null = null) {
    const node = materialize(instance)
    if (node.parent !== null) {
        node.detach()
    }
    parent.add(node, anchor === null ? null : anchor.node)
}

function applyProps(instance: HostInstance, previous_props: HostProps, next_props: HostProps) {
    const node = instance.node!
    const styles_prev = previous_props.style ?? {}
    const styles_next = next_props.style ?? {}
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
    if (instance.type === 'text' && previous_props.value !== next_props.value) {
        node.text(next_props.value!)
    }
    instance.props = next_props
    for (const [prop, type] of instance.container.event_types) {
        const dispatch = instance.listeners.get(type.name)
        if (next_props[prop] == null) {
            if (dispatch !== undefined) {
                node.off(type.name, dispatch)
                instance.listeners.delete(type.name)
            }
        } else if (dispatch === undefined) {
            function dispatchEvent(event: any) {
                const previous_priority = current_update_priority
                const previous_event = current_event
                current_update_priority = EVENT_PRIORITIES[type.priority]!
                current_event = { type: type.name, time_stamp: performance.now() }
                try {
                    instance.props[prop](event)
                } finally {
                    current_update_priority = previous_priority
                    current_event = previous_event
                }
            }
            instance.listeners.set(type.name, dispatchEvent)
            node.on(type.name, dispatchEvent)
        }
    }
}
