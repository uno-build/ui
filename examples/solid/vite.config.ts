import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import solid from '@solidjs/vite-plugin'
import { compilerConfig } from '../../src/components/solid/config.ts'

const ASSETS_DIRECTORY = fileURLToPath(new URL('../assets', import.meta.url))
const ASSETS_URL = '/assets'

async function getAssetFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true })
    const files = await Promise.all(
        entries
            .filter((entry) => entry.name !== '.DS_Store')
            .map((entry) => {
                const entry_path = join(directory, entry.name)
                return entry.isDirectory() ? getAssetFiles(entry_path) : entry_path
            }),
    )
    return files.flat()
}

export default defineConfig({
    base: './',
    plugins: [
        solid(compilerConfig),
        {
            name: 'solid-assets',
            configureServer(server) {
                server.middlewares.use((request, _response, next) => {
                    if (request.url?.startsWith(`${ASSETS_URL}/`)) {
                        request.url = request.url.replace(ASSETS_URL, `/@fs${ASSETS_DIRECTORY}`)
                    }
                    next()
                })
            },
            async generateBundle() {
                for (const asset_path of await getAssetFiles(ASSETS_DIRECTORY)) {
                    this.emitFile({
                        type: 'asset',
                        fileName: `${ASSETS_URL.slice(1)}/${relative(ASSETS_DIRECTORY, asset_path)}`,
                        source: await readFile(asset_path),
                    })
                }
            },
        },
    ],
    resolve: {
        alias: {
            'uno-ui/solid': fileURLToPath(new URL('../../src/components/solid/index.ts', import.meta.url)),
        },
    },
    build: {
        outDir: fileURLToPath(new URL('../dist/solid', import.meta.url)),
        emptyOutDir: true,
        rollupOptions: {
            external: (source) => source.startsWith(`${ASSETS_URL.slice(1)}/`),
            input: fileURLToPath(new URL('./index.html', import.meta.url)),
        },
    },
})
