// https://github.com/octanejs/octane/blob/main/docs/universal-renderer-architecture.md

import {
    createUniversalRoot,
    defineUniversalComponent,
    universalComponent,
    universalContext,
} from 'octane/universal/native'
import { OCTANE_RENDERER_ID } from './config'
import { UI_CONTEXT } from './context'

const TYPE = {
    VIEW: 'view',
    TEXT: 'text',
    $TEXT: '#text',
}
const TYPES = Object.values(TYPE)

export function registerRootComponent(component, { ui }) {
    const driver = createUniversalDriver({ ui })
    const host = createUniversalRoot({ renderer: OCTANE_RENDERER_ID }, driver)
    const RootComponent = defineUniversalComponent(OCTANE_RENDERER_ID, (props) =>
        universalContext(UI_CONTEXT, ui, universalComponent(OCTANE_RENDERER_ID, component, props)),
    )
    driver.root = host

    return {
        render(props) {
            host.render(RootComponent, props)
        },
        unmount() {
            host.unmount()
        },
    }
}

export function createUniversalDriver({ ui }) {
    const instances = new Map()
    instances.set(null, { node: ui.root, type: null, props: {} })

    const event_types = new Map()
    console.log(ui)
    for (const type of ui.events.types.values()) {
        event_types.set(type.component, type)
    }

    const driver = {
        root: null,
        id: OCTANE_RENDERER_ID,
        capabilities: { text: 'host' },
        events: {
            classify(name) {
                const type = event_types.get(name)
                return type === undefined ? null : { type: type.name, priority: type.priority }
            },
        },
        prepareBatch({}, { commands }) {
            return {
                apply() {
                    for (const command of commands) {
                        // Create
                        if (command.op === 'create') {
                            if (!TYPES.includes(command.type)) {
                                throw new Error(`Unsupported tag element '<${command.type}>'`)
                            }
                            const node = command.type === TYPE.$TEXT ? null : ui.create()
                            applyStyles(node, {}, command.props.style ?? {})
                            instances.set(command.id, { node, type: command.type, props: command.props })
                        }

                        // Insert / Move
                        else if (command.op === 'insert' || command.op === 'move') {
                            const parent = instances.get(command.parent)
                            const child = instances.get(command.id)

                            // If the parent is a <Text> component, it cannot have children that are not #text nodes.
                            if (parent.type === TYPE.TEXT && child.type !== TYPE.$TEXT) {
                                throw new Error(`<Text> cannot have children.`)
                            }

                            // If the child is a #text node, it must be inserted into a <Text> component.
                            if (child.type === TYPE.$TEXT) {
                                if (parent.type !== TYPE.TEXT) {
                                    throw new Error(`Texts must be inserted into a <Text> component.`)
                                }
                                if (command.op === 'move' && child.parent !== parent) {
                                    child.parent.node.text('')
                                }
                                child.parent = parent
                                parent.node.text(child.props.value)
                            }

                            // If the child is a non-text node, it must be inserted into a <View> component.
                            else {
                                const before_node = command.before === null ? null : instances.get(command.before).node
                                if (command.op === 'move') {
                                    child.node.detach()
                                }
                                parent.node.add(child.node, before_node)
                            }
                        }

                        // Update
                        else if (command.op === 'update') {
                            const instance = instances.get(command.id)
                            if (instance.type === TYPE.$TEXT) {
                                instance.parent.node.text(command.props.value)
                            } else {
                                applyStyles(instance.node, instance.props.style ?? {}, command.props.style ?? {})
                            }
                            instance.props = command.props
                        }

                        // Event
                        else if (command.op === 'event') {
                            const instance = instances.get(command.id)
                            const listeners = (instance.listeners ??= new Map())
                            const listener = listeners.get(command.type)

                            if (command.listener === null) {
                                instance.node.off(command.type, listener.dispatch)
                                listeners.delete(command.type)
                            } else if (listener === undefined) {
                                const entry = {
                                    id: command.listener.id,
                                    dispatch: (event) => driver.root.dispatchEvent(entry.id, event),
                                }
                                listeners.set(command.type, entry)
                                instance.node.on(command.type, entry.dispatch)
                            } else {
                                listener.id = command.listener.id
                            }
                        }

                        // Remove / Detach
                        else if (command.op === 'remove') {
                            const instance = instances.get(command.id)
                            if (instance.type === TYPE.$TEXT) {
                                instance.parent.node.text('')
                                instance.parent = null
                            } else {
                                instance.node.detach()
                            }
                        }

                        // Destroy
                        else if (command.op === 'destroy') {
                            const instance = instances.get(command.id)
                            if (instance.type !== TYPE.$TEXT) {
                                instance.node.destroy()
                            }
                            instances.delete(command.id)
                        } else {
                            throw new Error(`Octane components does not support command '${command.op}'`)
                        }
                    }
                    ui.update()
                },
                abort() {
                    // no-op
                },
            }
        },
        getPublicInstance(_container, id) {
            return instances.get(id)?.node ?? null
        },
    }

    return driver
}

function applyStyles(node, styles_prev, styles_next) {
    for (let key in styles_prev) {
        if (styles_next.hasOwnProperty(key) === false) {
            node.style(key, 'unset')
        }
    }

    for (let key in styles_next) {
        node.style(key, styles_next[key])
    }
}
