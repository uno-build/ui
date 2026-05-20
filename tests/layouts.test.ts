import { expect, test } from '@playwright/test'
import path from 'node:path'
import {
    comparedLayoutKeys,
    compareLayoutResults,
    defaultRendererNames,
    layoutComparisonTolerance,
    layoutNames,
    type LayoutRunResult,
} from './layouts/layout-runner'

const layoutRunnerUrl = `/@fs${path.resolve('tests/layouts/layout-runner.ts')}`
const layoutHarnessUrl = `/@fs${path.resolve('tests/layouts/layout-harness.html')}`

for (const layout of layoutNames) {
    test(`Layout: ${layout}`, async ({ page }) => {
        const results = await renderLayout(page, layout)
        const [baseline, ...comparisons] = results

        if (baseline == null) {
            throw new Error('No baseline renderer result was produced')
        }

        for (const comparison of compareLayoutResults(results)) {
            expect
                .soft(
                    comparison.matches,
                    `${layout} ${comparison.rendererA} vs ${comparison.rendererB}`,
                )
                .toBe(true)
        }

        for (const comparison of comparisons) {
            expect(comparison.result).toHaveLength(baseline.result.length)

            for (const [rowIndex, baselineRow] of baseline.result.entries()) {
                const comparisonRow = comparison.result[rowIndex]
                expect(comparisonRow).toBeDefined()

                if (comparisonRow == null) {
                    continue
                }

                for (const key of comparedLayoutKeys) {
                    expect
                        .soft(
                            comparisonRow[key],
                            `${layout} ${comparison.rendererName} row ${rowIndex} ${key}`,
                        )
                        .toBeGreaterThanOrEqual(
                            baselineRow[key] - layoutComparisonTolerance,
                        )
                    expect
                        .soft(
                            comparisonRow[key],
                            `${layout} ${comparison.rendererName} row ${rowIndex} ${key}`,
                        )
                        .toBeLessThanOrEqual(
                            baselineRow[key] + layoutComparisonTolerance,
                        )
                }

                for (const key of comparedLayoutKeys) {
                    expect(Number.isFinite(comparisonRow[key])).toBe(true)
                }
            }
        }
    })
}

async function renderLayout(page, layout: string): Promise<LayoutRunResult[]> {
    await page.goto(layoutHarnessUrl)

    return page.evaluate(
        async ({ layoutRunnerUrl, layout, renderers }) => {
            const { runLayout } = await import(layoutRunnerUrl)
            const root = document.getElementById('root')

            if (root == null) {
                throw new Error("Missing '#root' element")
            }

            return runLayout({
                root,
                layout,
                renderers,
                logger: {
                    error() {},
                    log() {},
                    table() {},
                    warn() {},
                },
            })
        },
        {
            layoutRunnerUrl,
            layout,
            renderers: defaultRendererNames,
        },
    )
}
