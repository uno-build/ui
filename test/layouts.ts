import { expect, test } from '@playwright/test'

type ConsoleTableRow = {
    width: number
    height: number
    x: number
    y: number
    centerX: number
    centerY: number
}

type CapturedConsoleTable = {
    rows: ConsoleTableRow[]
}

const renderers = ['yoga.divs', 'dom.html']
const comparedKeys = [
    'width',
    'height',
    'x',
    'y',
    'centerX',
    'centerY',
] as const

for (const layout of ['basic', 'relative', 'zindex']) {
    test(`console.table output matches renderers for ${layout}`, async ({
        page,
    }) => {
        await captureConsoleTables(page)
        await page.goto(`/?layout=${layout}&renderers=${renderers.join(',')}`)
        const tables = await readPaintLayoutTables(page)

        const [baseline, comparison] = tables as CapturedConsoleTable[]
        expect(comparison.rows).toHaveLength(baseline.rows.length)

        for (const [rowIndex, baselineRow] of baseline.rows.entries()) {
            const comparisonRow = comparison.rows[rowIndex]
            expect(comparisonRow).toBeDefined()

            if (comparisonRow == null) {
                continue
            }

            for (const key of comparedKeys) {
                expect
                    .soft(
                        comparisonRow[key],
                        `${layout} row ${rowIndex} ${key}`,
                    )
                    .toBeGreaterThanOrEqual(baselineRow[key] - 1)
                expect
                    .soft(
                        comparisonRow[key],
                        `${layout} row ${rowIndex} ${key}`,
                    )
                    .toBeLessThanOrEqual(baselineRow[key] + 1)
            }

            for (const key of comparedKeys) {
                expect(Number.isFinite(comparisonRow[key])).toBe(true)
            }
        }
    })
}

async function captureConsoleTables(page) {
    await page.addInitScript(() => {
        window.__consoleTables = []

        const originalTable = console.table.bind(console)
        console.table = (rows: unknown, ...rest: unknown[]) => {
            window.__consoleTables.push({
                rows: structuredClone(rows),
            })
            originalTable(rows, ...rest)
        }
    })
}

async function readPaintLayoutTables(page) {
    await page.waitForFunction(
        (keys) =>
            window.__consoleTables.filter((table) =>
                table.rows?.every((row) =>
                    keys.every((key) => typeof row[key] === 'number'),
                ),
            ).length === 2,
        comparedKeys,
    )

    return page.evaluate(
        (keys) =>
            window.__consoleTables.filter((table) =>
                table.rows?.every((row) =>
                    keys.every((key) => typeof row[key] === 'number'),
                ),
            ),
        comparedKeys,
    )
}

declare global {
    interface Window {
        __consoleTables: CapturedConsoleTable[]
    }
}
