// https://github.com/octanejs/octane/blob/main/docs/universal-renderer-architecture.md

import { createUniversalRoot } from 'octane/universal/native';

const RENDERER_ID = 'uno'
const TYPE = {
    VIEW: 'view',
    TEXT: 'text',
    $TEXT: '#text',
}
const TYPES = Object.values(TYPE)

export const viteConfigOctane = {
    renderers: {
        registry: {
            [RENDERER_ID]: {
                module: 'octane/universal/native',
                target: 'universal',
                server: 'client-only',
            },
        },
        rules: [
            {
                include: ['**/*.tsrx', '**/*.tsx', '**/*.jsx'],
                renderer: RENDERER_ID,
            },
        ],
    }
}

export function registerRootComponent(component, { ui }) {
    const host = createUniversalRoot(
        { renderer: RENDERER_ID },
        createUniversalDriver({ ui }),
    );

    return {
        render(props) {
            host.render(component, props);
        },
        unmount() {
            host.unmount();
        },
    };
}

export function createUniversalDriver({ ui }) {
    const instances = new Map()
    instances.set(null, { node: ui.root, type: null, props: {} })

    return {
        id: RENDERER_ID,
        capabilities: { text: 'host' },
        prepareBatch({ }, { commands }) {
            return {
                apply() {
                    for (const command of commands) {

                        // Create
                        if (command.op === 'create') {
                            if (!TYPES.includes(command.type)) {
                                throw new Error(`Unsupported tag element '<${command.type}>'`)
                            }
                            const node = command.type === TYPE.$TEXT ? null : ui.create()
                            applyStyles(node, command)
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
                            instance.props = command.props
                            if (instance.type === TYPE.$TEXT) {
                                instance.parent.node.text(command.props.value)
                            }
                            else {
                                applyStyles(instance.node, command)
                            }
                        }

                        // Remove / Detach
                        else if (command.op === 'remove') {
                            const instance = instances.get(command.id)
                            if (instance.type === TYPE.$TEXT) {
                                instance.parent.node.text('')
                                instance.parent = null
                            }
                            else {
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
                        }

                        else {
                            throw new Error(`Octane components does not support command '${command.op}'`,)
                        }
                    }
                    ui.update()
                },
                abort() {
                    // no-op
                },
            };
        },
        getPublicInstance(_container, id) {
            return instances.get(id)?.node ?? null
        },
    };
}

function applyStyles(node, command) {
    const styles = Object.entries(command.props.style ?? {})
    for (const [key, value] of styles) {
        node.style(key, value)
    }
}
