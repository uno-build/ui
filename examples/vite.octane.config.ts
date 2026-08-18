import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { viteConfigOctane } from '../src/components/octane/index.js'

export default defineConfig({
    plugins: [octane(viteConfigOctane)],
    build: {
        rollupOptions: {
            input: fileURLToPath(new URL('./octane.html', import.meta.url)),
        },
    },
})
