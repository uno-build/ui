import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import typegpu from 'unplugin-typegpu/vite'

export default defineConfig({
    plugins: [typegpu()],
    build: {
        rollupOptions: {
            input: fileURLToPath(new URL('./typegpu.html', import.meta.url)),
        },
    },
})
