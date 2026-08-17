import { fileURLToPath } from 'node:url'
import { octane } from '@octanejs/vite-plugin'
import solid from '@solidjs/vite-plugin'
import { defineConfig } from 'vite'
import { universalRenderers } from '../src/components/octane/config.js'

export default defineConfig({
    plugins: [
        octane({ renderers: universalRenderers }),
        solid({
            include: '**/*.universal.jsx',
            solid: {
                moduleName: '../src/components/solid/index.js',
                generate: 'universal',
            },
        }),
    ],
    build: {
        rollupOptions: {
            input: {
                octane: fileURLToPath(new URL('./octane.html', import.meta.url)),
                solid: fileURLToPath(new URL('./solid.html', import.meta.url)),
            },
        },
    },
})
