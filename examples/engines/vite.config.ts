import { readdirSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import typegpu from 'unplugin-typegpu/vite'

const ENGINES_DIRECTORY = fileURLToPath(new URL('.', import.meta.url))
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
    build: {
        outDir: fileURLToPath(new URL('../dist/engines', import.meta.url)),
        emptyOutDir: true,
        rolldownOptions: {
            input: readdirSync(ENGINES_DIRECTORY)
                .filter((file_name) => file_name.endsWith('.html'))
                .map((file_name) => resolve(ENGINES_DIRECTORY, file_name)),
        },
    },
    plugins: [
        typegpu(),
        {
            name: 'engines-assets',
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
    optimizeDeps: {
        entries: ['*.html'],
        include: ['@babylonjs/core/Cameras/freeCamera.js', '@solidjs/universal', 'solid-js'],
    },
})
