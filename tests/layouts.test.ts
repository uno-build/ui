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
const loadImageUrl = `/@fs${path.resolve('src/utils/loadAssets.ts')}`
const rendererDivsUrl = `/@fs${path.resolve('src/renderer/RendererDivs.ts')}`
const LAYOUT_VIEWPORTS = [
    // { width: 360, height: 640 },
    { width: 800, height: 600 },
    { width: 1280, height: 720 },
]

for (const layout of layoutNames) {
    for (const viewport of LAYOUT_VIEWPORTS) {
        test(`Layout: ${layout} ${viewport.width}x${viewport.height}`, async ({ page }) => {
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
                            .soft(Number.isFinite(row[key]), `${layout} ${rendererName} row ${rowIndex} ${key}`)
                            .toBe(true)
                    }
                }
            }

            for (const comparison of compareLayoutResults(results)) {
                expect
                    .soft(comparison.matches, `${layout} ${comparison.rendererA} vs ${comparison.rendererB}`)
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
                            .soft(comparisonRow[key], `${layout} ${comparison.rendererName} row ${rowIndex} ${key}`)
                            .toBeGreaterThanOrEqual(baselineRow[key] - layoutComparisonTolerance)
                        expect
                            .soft(comparisonRow[key], `${layout} ${comparison.rendererName} row ${rowIndex} ${key}`)
                            .toBeLessThanOrEqual(baselineRow[key] + layoutComparisonTolerance)
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
            const [{ SETUPS }, { default: UI }] = await Promise.all([import(layoutRunnerUrl), import(uiUrl)])
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
                const nodesByElementId = new Map([...nodes].map((node) => [`node-${node.id}`, node]))
                const elements = document.elementsFromPoint(canvasRect.left + x, canvasRect.top + y)

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
                ui.root.style('width', '220px')
                ui.root.style('height', '220px')

                const lower = ui.create()
                lower.style('width', '120px')
                lower.style('height', '120px')
                lower.style('position', 'absolute')
                lower.style('left', '40px')
                lower.style('top', '40px')
                lower.style('backgroundColor', '#f00')
                lower.style('zIndex', '1')
                ui.root.add(lower)

                const higher = ui.create()
                higher.style('width', '120px')
                higher.style('height', '120px')
                higher.style('position', 'absolute')
                higher.style('left', '70px')
                higher.style('top', '70px')
                higher.style('backgroundColor', '#00f')
                higher.style('zIndex', '2')
                ui.root.add(higher)

                ui.render()
                const initialTop = readTopPath(canvas, ui.nodes, 100, 100)

                lower.style('zIndex', '3')
                ui.render()
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
        expect(result.initialTop, `${result.rendererName} initial zIndex paint order`).toBe(result.expectedInitialTop)
        expect(result.updatedTop, `${result.rendererName} updated zIndex paint order`).toBe(result.expectedUpdatedTop)
    }
})

test('Layout: backgroundImage updates and clears with unset', async ({ page }) => {
    await page.goto(layoutHarnessUrl)

    const results = await page.evaluate(
        async ({ layoutRunnerUrl, loadImageUrl, renderers, uiUrl }) => {
            const [{ SETUPS }, { default: UI }, { loadImage }] = await Promise.all([
                import(layoutRunnerUrl),
                import(uiUrl),
                import(loadImageUrl),
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

            function readBackgroundImage(canvas, node_id) {
                const element = canvas.querySelector(`#node-${node_id}`)

                if (element == null) {
                    throw new Error(`Missing node '${node_id}'`)
                }

                return getComputedStyle(element).backgroundImage
            }

            const asset_logo = await loadImage('/assets/logo.jpg')
            const asset_coin = await loadImage('/assets/coin.png')
            const results = []

            for (const rendererName of renderers) {
                const setup = SETUPS[rendererName]
                const canvas = createCanvasElement(root, rendererName, setup)
                const Renderer = setup.renderer
                const renderer = new Renderer({ canvas })
                const ui = new UI({ renderer })

                await ui.init()
                ui.root.style('width', '220px')
                ui.root.style('height', '220px')

                const node = ui.create()
                node.style('width', '120px')
                node.style('height', '120px')
                node.style('backgroundColor', '#f00')
                ui.root.add(node)

                ui.imageUpload(asset_logo.src, asset_logo)
                ui.imageUpload(asset_coin.src, asset_coin)

                node.style('backgroundImage', asset_logo.src)
                ui.render()
                const first = readBackgroundImage(canvas, node.id)

                node.style('backgroundImage', asset_coin.src)
                ui.render()
                const second = readBackgroundImage(canvas, node.id)

                node.style('backgroundImage', 'unset')
                ui.render()
                const unset = readBackgroundImage(canvas, node.id)

                root.removeChild(canvas)

                results.push({ rendererName, first, second, unset })
            }

            return results
        },
        { layoutRunnerUrl, loadImageUrl, renderers: defaultRendererNames, uiUrl },
    )

    for (const result of results) {
        expect(result.first, `${result.rendererName} first backgroundImage`).toContain('logo.jpg')
        expect(result.second, `${result.rendererName} second backgroundImage`).toContain('coin.png')
        expect(result.unset, `${result.rendererName} unset backgroundImage`).toBe('none')
    }
})

test('Layout: RendererDivs clears overflow clipping updates', async ({ page }) => {
    await page.goto(layoutHarnessUrl)

    const result = await page.evaluate(
        async ({ rendererDivsUrl, uiUrl }) => {
            const [{ default: RendererDivs }, { default: UI }] = await Promise.all([
                import(rendererDivsUrl),
                import(uiUrl),
            ])
            const root = document.getElementById('root')

            if (root == null) {
                throw new Error("Missing '#root' element")
            }

            const canvas = document.createElement('div')
            root.appendChild(canvas)
            Object.assign(canvas.style, {
                display: 'flex',
                position: 'absolute',
                left: '0',
                top: '0',
                width: '220px',
                height: '220px',
            })

            const renderer = new RendererDivs({ canvas })
            const ui = new UI({ renderer })

            await ui.init()
            ui.root.style('width', '220px')
            ui.root.style('height', '220px')

            const host = ui.create()
            host.style('width', '80px')
            host.style('height', '80px')
            host.style('position', 'absolute')
            host.style('left', '20px')
            host.style('top', '20px')
            host.style('overflow', 'hidden')
            host.style('backgroundColor', '#fff')
            ui.root.add(host)

            const child = ui.create()
            child.style('width', '80px')
            child.style('height', '80px')
            child.style('position', 'absolute')
            child.style('left', '60px')
            child.style('top', '0px')
            child.style('backgroundColor', '#000')
            host.add(child)

            ui.render()

            const div = canvas.querySelector(`#node-${child.id}`)

            if (div == null) {
                throw new Error('Missing child div')
            }

            const hiddenClipPath = (div as HTMLElement).style.clipPath

            host.style('overflow', 'visible')
            ui.render()

            return {
                hiddenClipPath,
                visibleClipPath: (div as HTMLElement).style.clipPath,
            }
        },
        { rendererDivsUrl, uiUrl },
    )

    expect(result.hiddenClipPath).toContain('inset(')
    expect(result.visibleClipPath).toBe('')
})

function assertPaintedRectsMatchLayout({ layout, baseline, comparisons }) {
    const baselinePaths = baseline.paintedRects.map(({ path }) => path)

    for (const comparison of comparisons) {
        expect(comparison.paintedRects).toHaveLength(baseline.paintedRects.length)
        expect(comparison.paintedRects.map(({ path }) => path)).toEqual(baselinePaths)

        for (const [rowIndex, baselineRect] of baseline.paintedRects.entries()) {
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
                    .toBeGreaterThanOrEqual(baselineRect[key] - layoutComparisonTolerance)
                expect
                    .soft(
                        comparisonRect[key],
                        `${layout} ${comparison.rendererName} painted ${baselineRect.path} ${key}`,
                    )
                    .toBeLessThanOrEqual(baselineRect[key] + layoutComparisonTolerance)
            }
        }
    }
}

function assertPaintSamples(layout, results) {
    for (const { rendererName, paintSamples } of results) {
        for (const sample of paintSamples) {
            expect
                .soft(sample.actualPath, `${layout} ${rendererName} paint sample '${sample.name}'`)
                .toBe(sample.expectedPath)
            expect
                .soft(sample.actualStack, `${layout} ${rendererName} paint stack '${sample.name}'`)
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
