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
    })
}

function assertPaintedRectsMatchLayout({ layout, baseline, comparisons }) {
    const baselineNames = baseline.paintedRects.map(({ name }) => name)
    const expectedNames = expectedPaintedRectNames[layout]

    if (expectedNames != null) {
        expect(baselineNames).toEqual(expectedNames)
    }

    if (
        baseline.paintedRects.length === 0 &&
        comparisons.every(({ paintedRects }) => paintedRects.length === 0)
    ) {
        return
    }

    for (const comparison of comparisons) {
        expect(comparison.paintedRects).toHaveLength(
            baseline.paintedRects.length,
        )
        expect(comparison.paintedRects.map(({ name }) => name)).toEqual(
            baselineNames,
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

            expect(comparisonRect.name).toBe(baselineRect.name)
            expect(comparisonRect.path).toBe(baselineRect.path)

            for (const key of comparedPaintedRectKeys) {
                expect
                    .soft(
                        comparisonRect[key],
                        `${layout} ${comparison.rendererName} painted ${baselineRect.name} ${key}`,
                    )
                    .toBeGreaterThanOrEqual(
                        baselineRect[key] - layoutComparisonTolerance,
                    )
                expect
                    .soft(
                        comparisonRect[key],
                        `${layout} ${comparison.rendererName} painted ${baselineRect.name} ${key}`,
                    )
                    .toBeLessThanOrEqual(
                        baselineRect[key] + layoutComparisonTolerance,
                    )
            }
        }
    }
}

const expectedPaintedRectNames = {
    deepNestedPaint: ['flowMarker', 'alignedMarker', 'absoluteMarker'],
    nestedFlexDirections: ['directionMarker', 'reverseEndMarker'],
    nestedMargins: [
        'nestedMarginMarker',
        'afterMarginMarker',
        'endAlignedMarginMarker',
    ],
    nestedPercentDimensions: [
        'percentSizeMarker',
        'endAlignedPercentMarker',
        'percentOffsetMarker',
    ],
    nestedRelativeOffsets: ['positiveMarker', 'mixedMarker'],
    nestedWrapGap: ['firstLineMarker', 'secondLineMarker'],
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
