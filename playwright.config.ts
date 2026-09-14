import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const config = {
    '@playwright/test': {
        babelPlugins: [[fileURLToPath(import.meta.resolve('@babel/plugin-transform-typescript')), { allowDeclareFields: true }]],
    },
    testDir: '.',
    outputDir: './tests/.results',
    webServer: {
        command: 'vite ./dev/layouts --config ./playwright.vite.config.ts --host 127.0.0.1',
        url: 'http://127.0.0.1:5173/dev/layouts/',
        reuseExistingServer: false,
    },
    use: {
        ...devices['Desktop Chrome'],
        headless: true,
        baseURL: 'http://127.0.0.1:5173/dev/layouts/',
        viewport: { width: 800, height: 600 },
        launchOptions: {
            args: ['--enable-unsafe-webgpu'],
        },
    },
}

export default defineConfig(config)
