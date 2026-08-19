// https://github.com/octanejs/octane/blob/main/docs/universal-renderer-architecture.md

import { createUniversalRoot } from 'octane/universal/native';

const RENDERER_ID = 'uno';

export const viteConfigOctane = {
    renderers: {
        registry: {
            [RENDERER_ID]: {
                module: 'octane/universal/native',
                target: 'universal',
                server: 'client-only',
                text: 'ignore',
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
    instances.set(null, ui.root)

    return {
        id: RENDERER_ID,
        capabilities: { text: 'ignore' },
        prepareBatch({ }, { commands }) {
            return {
                apply() {
                    for (const command of commands) {
                        // Create
                        if (command.op === 'create') {
                            const node = ui.create()
                            applyStyles(node, command)
                            instances.set(command.id, node)
                        }

                        // Insert / Move
                        else if (command.op === 'insert' || command.op === 'move') {
                            const parent = instances.get(command.parent)
                            const node = instances.get(command.id)
                            const before_node = command.before === null ? null : instances.get(command.before)
                            if (command.op === 'move') {
                                node.detach()
                            }
                            parent.add(node, before_node)
                        }

                        // Update
                        else if (command.op === 'update') {
                            const node = instances.get(command.id)
                            applyStyles(node, command)
                        }

                        // Remove / Detach
                        else if (command.op === 'remove') {
                            const node = instances.get(command.id)
                            node.detach()
                        }

                        // Destroy
                        else if (command.op === 'destroy') {
                            const node = instances.get(command.id)
                            node.destroy()
                            instances.delete(command.id)
                        }

                        // else {
                        //     throw new Error(`Octane components does not support command '${command.op}'`,)
                        // }
                    }
                    ui.update()
                },
                abort() {
                    // no-op
                },
            };
        },
        getPublicInstance(_container, id) {
            return instances.get(id) ?? null
        },
    };
}

function applyStyles(node, command) {
    const styles = Object.entries(command.props.style ?? {})
    for (const [key, value] of styles) {
        node.style(key, value)
    }
}
