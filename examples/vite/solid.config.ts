import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import solid from '@solidjs/vite-plugin'
import { viteConfigSolid } from '../../src/components/solid/index.js'

export default defineConfig({
    plugins: [solid(viteConfigSolid)],
    build: {
        rollupOptions: {
            input: fileURLToPath(new URL('../components/solid.html', import.meta.url)),
        },
    },
})
