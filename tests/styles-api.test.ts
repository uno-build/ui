import { test, expect } from '@playwright/test'
import Style from '../src/engine/Style'

// prettier-ignore
test('normalizeStyleName', () => {
    expect(Style.normalizeStyleName('backgroundColor')).toBe('backgroundColor')
    expect(Style.normalizeStyleName(' backgroundColor ')).toBe('backgroundColor')
    expect(Style.normalizeStyleName('  background-color  ')).toBe('backgroundColor')
    expect(Style.normalizeStyleName('BACKGROUND-COLOR')).toBe('backgroundColor')
    expect(Style.normalizeStyleName('Background-Color')).toBe('backgroundColor')
    expect(Style.normalizeStyleName('Background-Color')).toBe('backgroundColor')
    expect(Style.normalizeStyleName('POSITION')).toBe('position')
    expect(Style.normalizeStyleName('BACKGROUNDCOLOR')).toBe('backgroundColor')
})

test('resolveStyle', () => {
    expect(() => {
        Style.resolveStyle()
    }).toThrow(/style name must be a string/)
    expect(() => {
        Style.resolveStyle('noexist')
    }).toThrow(/unsupported property 'noexist'/)

    expect(() => {
        Style.resolveStyle('backgroundColor')
    }).toThrow(/style value for property 'backgroundColor' cannot be undefined/)
})
