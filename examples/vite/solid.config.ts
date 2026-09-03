import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import solid from '@solidjs/vite-plugin'
import { compilerConfig } from '../../src/components/solid/config.js'

export default defineConfig({
    plugins: [solid(compilerConfig)],
    build: {
        rollupOptions: {
            input: fileURLToPath(new URL('../solid/index.html', import.meta.url)),
        },
    },
})
