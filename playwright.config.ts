import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const CI_WEBGPU_ARGS = process.env.CI
    ? [
          '--enable-features=Vulkan',
          '--use-vulkan=swiftshader',
          '--use-angle=swiftshader',
          '--disable-vulkan-fallback-to-gl-for-testing',
          '--ignore-gpu-blocklist',
          '--font-render-hinting=none',
      ]
    : []

const WEBGPU_USE = {
    launchOptions: {
        args: ['--enable-unsafe-webgpu', ...CI_WEBGPU_ARGS],
    },
}

const config = {
    '@playwright/test': {
        babelPlugins: [
            [fileURLToPath(import.meta.resolve('@babel/plugin-transform-typescript')), { allowDeclareFields: true }],
        ],
    },
    outputDir: './tests/.results',
    webServer: {
        command: 'vite . --host 127.0.0.1',
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
            testDir: './examples/layouts',
            use: WEBGPU_USE,
        },
    ],
}

export default defineConfig(config)
