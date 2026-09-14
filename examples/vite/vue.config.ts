import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { compilerConfig, stylesPlugin } from '../../src/components/vue/config.ts'

export default defineConfig({
    plugins: [vue(compilerConfig), stylesPlugin()],
    build: {
        rollupOptions: {
            input: fileURLToPath(new URL('../vue/index.html', import.meta.url)),
        },
    },
})
