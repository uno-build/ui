import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { octane } from '@octanejs/vite-plugin'
import { rendererConfig } from '../../src/components/octane/config.js'

const COMPONENT_EXAMPLES_URL = new URL('../components/', import.meta.url)
const OCTANE_EXAMPLE_INPUTS = readdirSync(COMPONENT_EXAMPLES_URL)
    .filter((file_name) => file_name.startsWith('octane-') && file_name.endsWith('.html'))
    .map((file_name) => fileURLToPath(new URL(file_name, COMPONENT_EXAMPLES_URL)))

export default defineConfig({
    plugins: [octane(rendererConfig)],
    build: {
        rollupOptions: {
            input: OCTANE_EXAMPLE_INPUTS,
        },
    },
})
