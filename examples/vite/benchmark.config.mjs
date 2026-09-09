import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export function isForbiddenModule(module_id) {
    const normalized = module_id.replaceAll('\\', '/')
    return /\/src\/components\//.test(normalized)
        || /\/src\/(?:ui\/UI|renderer\/Renderer)(?!WebGPU\b)[^/]+\.[cm]?[jt]s/.test(normalized)
        || /\/src\/renderer\/(?:dom|three|babylon|playcanvas)\//i.test(normalized)
        || /\/node_modules\/(?:\.pnpm\/)?(?:@[^/]+\/)?(?:octane|solid-js|universal|three|playcanvas|@babylonjs)(?:\/|@)/.test(normalized)
        || /\/node_modules\/(?:@octanejs|@solidjs|@babylonjs)\//.test(normalized)
}

export default defineConfig({
    root: fileURLToPath(new URL('../benchmark', import.meta.url)),
    base: './',
    publicDir: false,
    plugins: [{
        name: 'benchmark-raw-dependencies',
        generateBundle() {
            const forbidden = [...this.getModuleIds()].filter(isForbiddenModule)
            if (forbidden.length > 0) this.error(`The raw WebGPU benchmark imported forbidden dependencies:\n${forbidden.join('\n')}`)
        },
    }],
    build: {
        target: 'esnext',
        outDir: fileURLToPath(new URL('../dist/benchmark', import.meta.url)),
        emptyOutDir: true,
        assetsInlineLimit: 0,
        rolldownOptions: {
            input: fileURLToPath(new URL('../benchmark/index.html', import.meta.url)),
        },
    },
    preview: { host: '127.0.0.1', port: 4173, strictPort: false },
})
