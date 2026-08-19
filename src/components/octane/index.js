// https://github.com/octanejs/octane/blob/main/docs/universal-renderer-architecture.md

import { createUniversalRoot } from 'octane/universal/native';

const RENDERER_ID = 'uno'
const TYPE = {
    TEXT: '#text',
    TAG_VIEW: 'view',
    TAG_TEXT: 'text',
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

export function createUniversalRendererRoot({ ui }) {
    const host = createUniversalRoot(
        { renderer: RENDERER_ID },
        createUniversalDriver({ ui }),
    );

    return {
        render(component, props) {
            host.render(component, props);
        },
        unmount() {
            host.unmount();
        },
    };
}

function createUniversalDriver({ ui }) {
    const instances = new Map()
    instances.set(null, { node: ui.root, type: null, props: {} })

    return {
        id: RENDERER_ID,
        capabilities: { text: 'host' },
        prepareBatch({ }, { commands }) {
            return {
                apply() {
                    for (const command of commands) {
                        const { op, id, type, props } = command

                        // Create
                        if (op === 'create') {
                            if (!TYPES.includes(type)) {
                                throw new Error(`Unsupported tag element '<${type}>'`)
                            }
                            const node = type === TYPE.TEXT ? null : ui.create()
                            applyStyles(node, command)
                            instances.set(id, { node, type, props })
                        }

                        // Insert / Move
                        else if (op === 'insert' || op === 'move') {
                            const parent = instances.get(command.parent)
                            const child = instances.get(id)

                            // If the parent is a <Text> component, it cannot have children that are not text nodes.
                            if (parent.type === TYPE.TAG_TEXT && child.type !== TYPE.TEXT) {
                                throw new Error(`<Text> cannot have children.`)
                            }

                            // If the child is a text node, it must be inserted into a <Text> component.
                            if (child.type === TYPE.TEXT) {
                                if (parent.type !== TYPE.TAG_TEXT) {
                                    throw new Error(`Texts must be inserted into a <Text> component.`)
                                }
                                parent.node.text(child.props.value)
                            }

                            // If the child is a non-text node, it must be inserted into a <View> component.
                            else {
                                const before_node = command.before === null ? null : instances.get(command.before).node
                                if (op === 'move') {
                                    child.node.detach()
                                }
                                parent.node.add(child.node, before_node)
                            }
                        }

                        // Update
                        else if (op === 'update') {
                            const instance = instances.get(id)
                            applyStyles(instance.node, command)
                            instance.props = command.props
                        }

                        // Remove / Detach
                        else if (op === 'remove') {
                            const node = instances.get(id).node
                            node.detach()
                        }

                        // Destroy
                        else if (op === 'destroy') {
                            const node = instances.get(id).node
                            node.destroy()
                            instances.delete(id)
                        }

                        else {
                            throw new Error(`Octane components does not support command '${op}'`,)
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
