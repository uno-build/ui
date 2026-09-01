import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { rendererConfig } from '../../src/components/octane/config.js'

const OCTANE_EXAMPLE_INPUT = fileURLToPath(new URL('../octane/index.html', import.meta.url))

export default defineConfig({
    plugins: [octane(rendererConfig)],
    build: {
        rollupOptions: {
            input: OCTANE_EXAMPLE_INPUT,
        },
    },
})
