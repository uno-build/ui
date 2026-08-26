import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { rendererConfig } from '../../src/components/octane/config.js'

export default defineConfig({
    plugins: [octane(rendererConfig)],
    build: {
        rollupOptions: {
            input: fileURLToPath(new URL('./octane.html', import.meta.url)),
        },
    },
})
