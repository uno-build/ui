import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import solid from '@solidjs/vite-plugin'
import { octaneViteConfig } from '../src/components/octane/index.js'
import { solidViteConfig } from '../src/components/solid/index.js'

export default defineConfig({
    plugins: [octane(octaneViteConfig), solid(solidViteConfig)],
    build: {
        rollupOptions: {
            input: {
                octane: fileURLToPath(new URL('./octane.html', import.meta.url)),
                solid: fileURLToPath(new URL('./solid.html', import.meta.url)),
            },
        },
    },
})
