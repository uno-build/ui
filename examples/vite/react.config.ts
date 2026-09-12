import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
    oxc: {
        jsx: { runtime: 'automatic', importSource: 'react' },
    },
    build: {
        rollupOptions: {
            input: fileURLToPath(new URL('../react/index.html', import.meta.url)),
        },
    },
})
