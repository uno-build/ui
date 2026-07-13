import { expect, test } from '@playwright/test'
import {
    layoutWithLines,
    measureLineStats,
    measureNaturalWidth,
    prepareWithSegments,
} from '../src/renderer/pretext/layout.ts'

function measureText(text: string) {
    let width = 0

    for (const character of text) {
        width += character === 'W' ? 2 : 1
    }

    return width
}

test('Pretext measures text with the provided function', () => {
    const prepared = prepareWithSegments('Wide', { measure: measureText })

    expect(measureNaturalWidth(prepared)).toBe(5)
})

test('Pretext wraps text at word boundaries', () => {
    const prepared = prepareWithSegments('hello world', { measure: measureText })
    const result = measureLineStats(prepared, 5)

    expect(result).toEqual({ lineCount: 2, maxLineWidth: 5 })
})

test('Pretext preserves explicit line breaks in pre-wrap text', () => {
    const prepared = prepareWithSegments('first\nsecond', {
        measure: measureText,
        whiteSpace: 'pre-wrap',
    })
    const result = layoutWithLines(prepared, Number.POSITIVE_INFINITY, 12)

    expect(result.lineCount).toBe(2)
    expect(result.height).toBe(24)
    expect(result.lines.map((line) => line.text)).toEqual(['first', 'second'])
})

test('Pretext breaks words at grapheme boundaries when necessary', () => {
    const prepared = prepareWithSegments('aaaa', { measure: measureText })
    const result = measureLineStats(prepared, 1)

    expect(result.lineCount).toBe(4)
})
