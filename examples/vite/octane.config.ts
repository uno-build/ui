import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { compilerConfig } from '../../src/components/octane/config.ts'

const OCTANE_EXAMPLE_INPUT = fileURLToPath(new URL('../octane/index.html', import.meta.url))

export default defineConfig({
    plugins: [octane(compilerConfig)],
    build: {
        rollupOptions: {
            input: OCTANE_EXAMPLE_INPUT,
        },
    },
})
