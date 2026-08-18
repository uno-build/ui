import { createUniversalRoot } from 'octane/universal';

const RENDERER_ID = 'uno';

export const universalRenderers = {
    registry: {
        [RENDERER_ID]: {
            module: 'octane/universal',
            target: 'universal',
            server: 'client-only',
            text: 'ignore',
        },
    },
    rules: [
        {
            include: ['**/*.tsrx', '**/*.tsx'],
            renderer: RENDERER_ID,
        },
    ],
};

function createUniversalContainer() {
    return { renderer: RENDERER_ID };
}

function createUniversalDriver() {
    return {
        id: RENDERER_ID,
        capabilities: { text: 'ignore' },
        prepareBatch(_container, batch) {
            console.log('prepare', batch);
            return {
                apply() {
                    console.log('apply', batch);
                    console.log('ui.update()');
                },
                abort() {
                    console.log('abort', batch);
                },
            };
        },
        getPublicInstance() {
            return null;
        },
    };
}

export function createUniversalRendererRoot({ props }) {
    console.log('createUniversalRendererRoot', props);

    const host = createUniversalRoot(
        createUniversalContainer(),
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
