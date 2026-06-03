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
const uiUrl = `/@fs${path.resolve('src/UI.ts')}`
const LAYOUT_VIEWPORTS = [
    { width: 360, height: 640 },
    { width: 800, height: 600 },
    { width: 1280, height: 720 },
]

for (const layout of layoutNames) {
    for (const viewport of LAYOUT_VIEWPORTS) {
        test(`Layout: ${layout} ${viewport.width}x${viewport.height}`, async ({
            page,
        }) => {
            await page.setViewportSize(viewport)
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

                for (const [
                    rowIndex,
                    baselineRow,
                ] of baseline.result.entries()) {
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
}

test('Layout: zIndex updates repaint order', async ({ page }) => {
    await page.goto(layoutHarnessUrl)

    const results = await page.evaluate(
        async ({ layoutRunnerUrl, renderers, uiUrl }) => {
            const [{ SETUPS }, { default: UI }] = await Promise.all([
                import(layoutRunnerUrl),
                import(uiUrl),
            ])
            const root = document.getElementById('root')

            if (root == null) {
                throw new Error("Missing '#root' element")
            }

            function createCanvasElement(root, rendererName, setup) {
                const canvas = document.createElement(setup.elementType)

                root.appendChild(canvas)
                canvas.id = rendererName
                Object.assign(canvas.style, {
                    display: 'flex',
                    position: 'absolute',
                    left: '0',
                    top: '0',
                    width: '220px',
                    height: '220px',
                    zIndex: '0',
                    opacity: '1',
                })

                canvas.width = canvas.clientWidth
                canvas.height = canvas.clientHeight

                Object.entries(setup.attributes).forEach(([key, value]) => {
                    canvas.setAttribute(key, value)
                })

                return canvas
            }

            function readTopPath(canvas, nodes, x, y) {
                const canvasRect = canvas.getBoundingClientRect()
                const nodesByElementId = new Map(
                    [...nodes].map((node) => [`node-${node.id}`, node]),
                )
                const elements = document.elementsFromPoint(
                    canvasRect.left + x,
                    canvasRect.top + y,
                )

                for (const element of elements) {
                    if (!canvas.contains(element)) {
                        continue
                    }

                    const node = nodesByElementId.get(element.id)

                    if (node != null) {
                        return node.path.join('.')
                    }
                }

                return null
            }

            const results = []

            for (const rendererName of renderers) {
                const setup = SETUPS[rendererName]
                const canvas = createCanvasElement(root, rendererName, setup)
                const Renderer = setup.renderer
                const renderer = new Renderer({ canvas })
                const ui = new UI({ renderer })

                await ui.init()
                ui.root.setStyle('width', '220px')
                ui.root.setStyle('height', '220px')

                const lower = ui.create({
                    width: '120px',
                    height: '120px',
                    position: 'absolute',
                    left: '40px',
                    top: '40px',
                    backgroundColor: '#f00',
                    zIndex: '1',
                })
                ui.root.add(lower)

                const higher = ui.create({
                    width: '120px',
                    height: '120px',
                    position: 'absolute',
                    left: '70px',
                    top: '70px',
                    backgroundColor: '#00f',
                    zIndex: '2',
                })
                ui.root.add(higher)

                ui.update()
                const initialTop = readTopPath(canvas, ui.nodes, 100, 100)

                lower.setStyle('zIndex', '3')
                ui.update()
                const updatedTop = readTopPath(canvas, ui.nodes, 100, 100)

                root.removeChild(canvas)

                results.push({
                    rendererName,
                    initialTop,
                    updatedTop,
                    expectedInitialTop: higher.path.join('.'),
                    expectedUpdatedTop: lower.path.join('.'),
                })
            }

            return results
        },
        { layoutRunnerUrl, renderers: defaultRendererNames, uiUrl },
    )

    for (const result of results) {
        expect(
            result.initialTop,
            `${result.rendererName} initial zIndex paint order`,
        ).toBe(result.expectedInitialTop)
        expect(
            result.updatedTop,
            `${result.rendererName} updated zIndex paint order`,
        ).toBe(result.expectedUpdatedTop)
    }
})

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
