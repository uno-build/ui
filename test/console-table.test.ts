import { expect, test } from '@playwright/test'

type ConsoleTableRow = {
    width: number
    height: number
    x: number
    y: number
    bottom: number
    right: number
}

type CapturedConsoleTable = {
    rows: ConsoleTableRow[]
}

const renderers = ['absolute_divs', 'html_dom']
const comparedKeys = ['width', 'height', 'x', 'y', 'bottom', 'right'] as const

for (const layout of ['basic', 'relative', 'zindex']) {
    test(`console.table output matches renderers for ${layout}`, async ({
        page,
    }) => {
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

        await page.goto(
            `/?layout=${layout}&renderers=${renderers.join(',')}`,
        )

        await page.waitForFunction(
            () =>
                window.__consoleTables.filter((table) =>
                    table.rows?.every(
                        (row) => 'bottom' in row && 'right' in row,
                    ),
                ).length === 2,
        )

        const tables = await page.evaluate(() =>
            window.__consoleTables.filter((table) =>
                table.rows?.every(
                    (row) => 'bottom' in row && 'right' in row,
                ),
            ),
        )

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
        }
    })
}

declare global {
    interface Window {
        __consoleTables: CapturedConsoleTable[]
    }
}
