import { expect, test } from '@playwright/test'

type ConsoleTableRow = {
    width: number
    height: number
    left: number
    top: number
    right: number
    bottom: number
    x: number
    y: number
    centerX: number
    centerY: number
}

type CapturedConsoleTable = {
    rows: ConsoleTableRow[]
}

const renderers = ['yoga.divs', 'dom.html']
const comparedKeys = ['width', 'height', 'left', 'top', 'x', 'y'] as const

for (const layout of ['basic']) {
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

            expect(Number.isFinite(comparisonRow.right)).toBe(true)
            expect(Number.isFinite(comparisonRow.bottom)).toBe(true)
            expect(Number.isFinite(comparisonRow.centerX)).toBe(true)
            expect(Number.isFinite(comparisonRow.centerY)).toBe(true)
        }
    })
}

for (const layout of ['relative', 'zindex']) {
    test(`console.table output exposes paint layout fields for ${layout}`, async ({
        page,
    }) => {
        await captureConsoleTables(page)
        await page.goto(`/?layout=${layout}&renderers=${renderers.join(',')}`)
        const tables = await readPaintLayoutTables(page)

        expect(tables).toHaveLength(2)
        for (const table of tables as CapturedConsoleTable[]) {
            for (const row of table.rows) {
                for (const key of [
                    ...comparedKeys,
                    'right',
                    'bottom',
                    'centerX',
                    'centerY',
                ] as const) {
                    expect(Number.isFinite(row[key])).toBe(true)
                }
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
        () =>
            window.__consoleTables.filter((table) =>
                table.rows?.every((row) => 'bottom' in row && 'right' in row),
            ).length === 2,
    )

    return page.evaluate(() =>
        window.__consoleTables.filter((table) =>
            table.rows?.every((row) => 'bottom' in row && 'right' in row),
        ),
    )
}

declare global {
    interface Window {
        __consoleTables: CapturedConsoleTable[]
    }
}
