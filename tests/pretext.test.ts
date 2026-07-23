import { expect, test } from '@playwright/test'
import {
    layoutWithLines,
    measureLineStats,
    measureNaturalWidth,
    prepareWithSegments,
} from '../src/renderer/pretext/layout.ts'
import Segmenter from '../src/renderer/pretext/segmenter.ts'

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

test('Pretext preserves blank lines in pre-wrap text', () => {
    const prepared = prepareWithSegments('first\n\nsecond', {
        measure: measureText,
        whiteSpace: 'pre-wrap',
    })
    const result = layoutWithLines(prepared, Number.POSITIVE_INFINITY, 12)

    expect(result.lineCount).toBe(3)
    expect(result.height).toBe(36)
    expect(result.lines.map((line) => line.text)).toEqual(['first', '', 'second'])
})

test('Pretext breaks words at grapheme boundaries when necessary', () => {
    const prepared = prepareWithSegments('aaaa', { measure: measureText })
    const result = measureLineStats(prepared, 1)

    expect(result.lineCount).toBe(4)
})

test('Segmenter keeps combined Unicode graphemes intact', () => {
    const segmenter = new Segmenter(undefined, { granularity: 'grapheme' })
    const segments = segmenter.segment('A\u0301👩🏽‍💻🇪🇸\r\nB')

    expect(segments.map(({ segment }) => segment)).toEqual(['A\u0301', '👩🏽‍💻', '🇪🇸', '\r\n', 'B'])
    expect(segments.map(({ index }) => index)).toEqual([0, 2, 9, 13, 15])
})

test('Segmenter groups words and separates CJK characters', () => {
    const segmenter = new Segmenter(undefined, { granularity: 'word' })
    const segments = segmenter.segment("hello 世界 can't")

    expect(segments.map(({ segment, isWordLike }) => [segment, isWordLike])).toEqual([
        ['hello', true],
        [' ', false],
        ['世', true],
        ['界', true],
        [' ', false],
        ["can't", true],
    ])
})

test('Segmenter keeps consecutive hard breaks separate', () => {
    const segmenter = new Segmenter(undefined, { granularity: 'word' })
    const segments = segmenter.segment('first\r\n\r\nsecond')

    expect(segments.map(({ segment }) => segment)).toEqual(['first', '\r\n', '\r\n', 'second'])
})
