import { fileURLToPath } from 'node:url'
import { octane } from '@octanejs/vite-plugin'
import { defineConfig } from 'vite'
import { universalRenderers } from '../src/components/octane/config.js'

export default defineConfig({
    plugins: [octane({ renderers: universalRenderers })],
    build: {
        rollupOptions: {
            input: fileURLToPath(new URL('./octane.html', import.meta.url)),
        },
    },
})
