import { defineConfig } from 'vite'

export default defineConfig({
    optimizeDeps: {
        entries: ['**/*.html', '!examples/engines/pixi3d*.html'],
    },
})
