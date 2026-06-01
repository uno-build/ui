import { expect, test } from '@playwright/test'
import path from 'node:path'
import {
    comparedLayoutKeys,
    comparedPaintedRectKeys,
    compareLayoutResults,
    defaultRendererNames,
    layoutComparisonTolerance,
    layoutNames,
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

        for (const { rendererName, result } of results) {
            for (const [rowIndex, row] of result.entries()) {
                for (const key of comparedLayoutKeys) {
                    expect
                        .soft(
                            Number.isFinite(row[key]),
                            `${layout} ${rendererName} row ${rowIndex} ${key}`,
                        )
                        .toBe(true)
                }
            }
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

        assertPaintedRectsMatchLayout({
            layout,
            baseline,
            comparisons,
        })

        assertPaintSamples(layout, results)
    })
}

function assertPaintedRectsMatchLayout({ layout, baseline, comparisons }) {
    const baselinePaths = baseline.paintedRects.map(({ path }) => path)

    for (const comparison of comparisons) {
        expect(comparison.paintedRects).toHaveLength(
            baseline.paintedRects.length,
        )
        expect(comparison.paintedRects.map(({ path }) => path)).toEqual(
            baselinePaths,
        )

        for (const [
            rowIndex,
            baselineRect,
        ] of baseline.paintedRects.entries()) {
            const comparisonRect = comparison.paintedRects[rowIndex]
            expect(comparisonRect).toBeDefined()

            if (comparisonRect == null) {
                continue
            }

            expect(comparisonRect.id).toBe(baselineRect.id)
            expect(comparisonRect.path).toBe(baselineRect.path)

            for (const key of comparedPaintedRectKeys) {
                expect
                    .soft(
                        comparisonRect[key],
                        `${layout} ${comparison.rendererName} painted ${baselineRect.path} ${key}`,
                    )
                    .toBeGreaterThanOrEqual(
                        baselineRect[key] - layoutComparisonTolerance,
                    )
                expect
                    .soft(
                        comparisonRect[key],
                        `${layout} ${comparison.rendererName} painted ${baselineRect.path} ${key}`,
                    )
                    .toBeLessThanOrEqual(
                        baselineRect[key] + layoutComparisonTolerance,
                    )
            }
        }
    }
}

function assertPaintSamples(layout, results) {
    for (const { rendererName, paintSamples } of results) {
        for (const sample of paintSamples) {
            expect
                .soft(
                    sample.actualPath,
                    `${layout} ${rendererName} paint sample '${sample.name}'`,
                )
                .toBe(sample.expectedPath)
            expect
                .soft(
                    sample.actualStack,
                    `${layout} ${rendererName} paint stack '${sample.name}'`,
                )
                .toEqual(sample.expectedStack)
        }
    }
}

async function renderLayout(page, layout) {
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
