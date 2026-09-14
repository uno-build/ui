import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const WEBGPU_USE = {
    launchOptions: {
        args: ['--enable-unsafe-webgpu'],
    },
}

const config = {
    '@playwright/test': {
        babelPlugins: [[fileURLToPath(import.meta.resolve('@babel/plugin-transform-typescript')), { allowDeclareFields: true }]],
    },
    outputDir: './tests/.results',
    webServer: {
        command: 'vite . --config ./playwright.vite.config.ts --host 127.0.0.1',
        url: 'http://127.0.0.1:5173/tests/',
        reuseExistingServer: false,
    },
    use: {
        ...devices['Desktop Chrome'],
        headless: true,
        baseURL: 'http://127.0.0.1:5173',
        viewport: { width: 800, height: 600 },
    },
    projects: [
        {
            name: 'no-renderer',
            testDir: './tests/no-renderer',
        },
        {
            name: 'renderer',
            testDir: './tests/renderer',
            use: WEBGPU_USE,
        },
        {
            name: 'layouts',
            testDir: './dev/layouts',
            use: WEBGPU_USE,
        },
    ],
}

export default defineConfig(config)
