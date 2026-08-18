// https://github.com/octanejs/octane/blob/main/docs/universal-renderer-architecture.md

import { createUniversalRoot } from 'octane/universal/native';

const RENDERER_ID = 'uno';
const OP_PRIORITY = {
    create: 0,
    insert: 1,
}
const instances = new Map()

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
    // Registering root node
    instances.set(null, ui.root)

    return {
        id: RENDERER_ID,
        capabilities: { text: 'ignore' },
        prepareBatch({ }, { commands }) {
            return {
                apply() {
                    const sorted_commands = [...commands].sort((a, b) => {
                        const op_diff = (OP_PRIORITY[a.op] ?? Number.MAX_SAFE_INTEGER) - (OP_PRIORITY[b.op] ?? Number.MAX_SAFE_INTEGER)
                        if (op_diff !== 0) return op_diff

                        if (a.id === b.id) return 0
                        return a.id < b.id ? -1 : 1
                    })
                    for (let command of sorted_commands) {
                        console.log(command)
                        if (command.op === 'create') {
                            const node = ui.create()
                            const styles = Object.entries(command.props.style || {})
                            for (const [key, value] of styles) {
                                node.style(key, value)
                            }
                            instances.set(command.id, node)

                        }
                        if (command.op === 'insert') {
                            const parent = instances.get(command.parent)
                            const node = instances.get(command.id)
                            parent.add(node)
                        }
                    }
                    ui.update()
                },
                abort() {
                    // ui.abort()
                },
            };
        },
        getPublicInstance() {
            // return null;
        },
    };
}


