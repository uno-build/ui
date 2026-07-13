import { expect, test } from '@playwright/test'

const PRETEXT_MODULE_URL = `/@fs${process.cwd()}/src/renderer/pretext/layout.ts`

test.beforeEach(async ({ page }) => {
    await page.goto('/')
})

test('Pretext wraps text at word boundaries', async ({ page }) => {
    const result = await page.evaluate(async (module_url) => {
        const { measureLineStats, measureNaturalWidth, prepareWithSegments } = await import(
            module_url
        )
        const font = '10px monospace'
        const word_width = measureNaturalWidth(prepareWithSegments('hello', font))
        const prepared = prepareWithSegments('hello world', font)

        return measureLineStats(prepared, word_width)
    }, PRETEXT_MODULE_URL)

    expect(result.lineCount).toBe(2)
    expect(result.maxLineWidth).toBeGreaterThan(0)
})

test('Pretext preserves explicit line breaks in pre-wrap text', async ({ page }) => {
    const result = await page.evaluate(async (module_url) => {
        const { layoutWithLines, prepareWithSegments } = await import(module_url)
        const prepared = prepareWithSegments('first\nsecond', '10px monospace', {
            whiteSpace: 'pre-wrap',
        })

        return layoutWithLines(prepared, Number.POSITIVE_INFINITY, 12)
    }, PRETEXT_MODULE_URL)

    expect(result.lineCount).toBe(2)
    expect(result.height).toBe(24)
    expect(result.lines.map((line) => line.text)).toEqual(['first', 'second'])
})

test('Pretext breaks words at grapheme boundaries when necessary', async ({ page }) => {
    const result = await page.evaluate(async (module_url) => {
        const { measureLineStats, measureNaturalWidth, prepareWithSegments } = await import(
            module_url
        )
        const font = '10px monospace'
        const character_width = measureNaturalWidth(prepareWithSegments('a', font))
        const prepared = prepareWithSegments('aaaa', font)

        return measureLineStats(prepared, character_width)
    }, PRETEXT_MODULE_URL)

    expect(result.lineCount).toBe(4)
})
