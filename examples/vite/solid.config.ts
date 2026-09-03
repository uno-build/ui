import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import solid from '@solidjs/vite-plugin'
import { rendererConfig } from '../../src/components/solid/config.js'

export default defineConfig({
    plugins: [solid(rendererConfig)],
    build: {
        rollupOptions: {
            input: fileURLToPath(new URL('../components/solid.html', import.meta.url)),
        },
    },
})
