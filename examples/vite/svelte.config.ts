import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { compilerConfig } from '../../src/components/svelte/config.ts'

export default defineConfig({
    plugins: [svelte(compilerConfig)],
    build: {
        rollupOptions: {
            input: fileURLToPath(new URL('../svelte/index.html', import.meta.url)),
        },
    },
})
