import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './tests',
    outputDir: './tests/.results',
    webServer: {
        command: 'npm run dev -- --host 127.0.0.1',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
    },
    use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:5173',
        viewport: { width: 800, height: 600 },
        launchOptions: {
            args: ['--enable-unsafe-webgpu'],
        },
    },
})
