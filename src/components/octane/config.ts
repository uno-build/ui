export const OCTANE_RENDERER_ID = 'uno'

export const rendererConfig = {
    renderers: {
        registry: {
            [OCTANE_RENDERER_ID]: {
                module: 'octane/universal/native',
                target: 'universal',
                server: 'client-only',
                text: 'host',
            },
        },
        rules: [
            {
                include: ['**/*.tsrx', '**/*.tsx', '**/*.jsx'],
                renderer: OCTANE_RENDERER_ID,
            },
        ],
    },
}
