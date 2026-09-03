import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import typegpu from 'unplugin-typegpu/vite'

export default defineConfig({
    plugins: [typegpu()],
    optimizeDeps: {
        entries: ['*.html'],
        include: ['@babylonjs/core/Cameras/freeCamera.js', '@solidjs/universal', 'solid-js'],
    },
    build: {
        rollupOptions: {
            input: fileURLToPath(new URL('./typegpu.html', import.meta.url)),
        },
    },
})
