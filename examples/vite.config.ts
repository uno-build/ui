import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import solid from '@solidjs/vite-plugin'
import { viteConfigOctane } from '../src/components/octane/index.js'
import { viteConfigSolid } from '../src/components/solid/index.js'

export default defineConfig({
    plugins: [octane(viteConfigOctane), solid(viteConfigSolid)],
    build: {
        rollupOptions: {
            input: {
                octane: fileURLToPath(new URL('./octane.html', import.meta.url)),
                solid: fileURLToPath(new URL('./solid.html', import.meta.url)),
            },
        },
    },
})
