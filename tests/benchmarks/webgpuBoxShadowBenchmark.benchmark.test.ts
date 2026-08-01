import { expect, test } from '@playwright/test'

const benchmarkUrl = '/webgpuBoxShadowBenchmark.html'

test.use({
    launchOptions: {
        args: ['--enable-unsafe-webgpu'],
    },
})

test('RendererOverlay boxShadow benchmark', async ({ page }) => {
    test.skip(process.env.RUN_BENCHMARKS !== '1', 'Set RUN_BENCHMARKS=1 to run benchmarks')
    test.setTimeout(45_000)
    await page.goto(`${benchmarkUrl}?nodes=400&frames=60&warmup=10`)

    const result = await page.waitForFunction(() => {
        if ((window as any).__boxShadowBenchmarkError != null) {
            return {
                error: (window as any).__boxShadowBenchmarkError,
            }
        }

        if ((window as any).__boxShadowBenchmarkResult != null) {
            return {
                result: (window as any).__boxShadowBenchmarkResult,
            }
        }

        return null
    }, null, { timeout: 40_000 })
    const value = await result.jsonValue()

    if (value.error != null) {
        throw new Error(value.error.message)
    }

    console.table(value.result.scenes)
    expect(value.result.scenes).toHaveLength(4)
})
