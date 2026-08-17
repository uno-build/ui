import { fileURLToPath } from 'node:url'
import { octane } from '@octanejs/vite-plugin'
import { defineConfig } from 'vite'
import {
    UNIVERSAL_RENDERER_ID,
    universalRenderers,
} from '../src/components/octane/config.js'

const EXAMPLE_RENDERERS = {
    ...universalRenderers,
    rules: [
        ...universalRenderers.rules,
        {
            include: '**/*.universal.tsx',
            renderer: UNIVERSAL_RENDERER_ID,
        },
    ],
}

export default defineConfig({
    plugins: [octane({ renderers: EXAMPLE_RENDERERS })],
    resolve: {
        alias: {
            '@octanejs/universal/renderer': fileURLToPath(
                new URL('../src/components/octane/renderer.js', import.meta.url),
            ),
        },
    },
    build: {
        rollupOptions: {
            input: fileURLToPath(new URL('./octane.html', import.meta.url)),
        },
    },
})
