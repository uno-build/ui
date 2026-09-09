import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: '.',
    testIgnore: '**/tests/logic/**',
    outputDir: './tests/.results',
    webServer: {
        command: 'vite ./dev/layouts --host 127.0.0.1',
        url: 'http://127.0.0.1:5173/dev/layouts/',
        reuseExistingServer: false,
    },
    use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:5173/dev/layouts/',
        viewport: { width: 800, height: 600 },
        launchOptions: {
            args: ['--enable-unsafe-webgpu'],
        },
    },
})
