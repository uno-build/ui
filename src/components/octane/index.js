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

function createUniversalDriver() {
    return {
        id: RENDERER_ID,
        capabilities: { text: 'ignore' },
        prepareBatch({ ui }, { commands }) {
            return {
                apply() {
                    for (let command of commands) {
                        console.log(command)
                        if (command.op === 'create') {
                            ui.create()
                        }
                        if (command.op === 'insert') {
                            ui.create()
                        }
                    }
                    ui.update()
                },
                abort() {
                    ui.abort()
                },
            };
        },
        getPublicInstance() {
            return null;
        },
    };
}

export function createUniversalRendererRoot(params) {
    const host = createUniversalRoot(
        { renderer: RENDERER_ID, ...params },
        createUniversalDriver(),
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
