import { test, expect } from '@playwright/test'
import Style from '../src/engine/Style'

test('normalizeStyleName', () => {
    expect(Style.normalizeStyleName('backgroundColor')).toBe('backgroundColor')
    expect(Style.normalizeStyleName(' backgroundColor ')).toBe(
        'backgroundColor',
    )
    expect(Style.normalizeStyleName('  background-color  ')).toBe(
        'backgroundColor',
    )
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

    expect(Style.resolveStyle(' background-color ', ' #ABC ')).toEqual({
        name: 'backgroundColor',
        value: '#abc',
        parsed: { rgba: [170 / 255, 187 / 255, 204 / 255, 1] },
    })
    expect(Style.resolveStyle('Position', ' Absolute ')).toEqual({
        name: 'position',
        value: 'absolute',
    })
    expect(Style.resolveStyle('POSITION', 'relative')).toEqual({
        name: 'position',
        value: 'relative',
    })
    expect(Style.resolveStyle('BACKGROUNDCOLOR', '#ABC')).toEqual({
        name: 'backgroundColor',
        value: '#abc',
        parsed: { rgba: [170 / 255, 187 / 255, 204 / 255, 1] },
    })
})
