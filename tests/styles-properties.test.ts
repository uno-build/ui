import { test, expect } from '@playwright/test'
import Style from '../src/engine/Style'

test('backgroundColor', () => {
    expect(() => {
        Style.resolveStyle('backgroundColor', 'invalidcolor')
    }).toThrow(
        /invalid value 'invalidcolor' for property 'backgroundColor': expected hex color/,
    )
    expect(() => {
        Style.resolveStyle('backgroundColor', '#')
    }).toThrow(/expected hex color/)
    expect(() => {
        Style.resolveStyle('backgroundColor', '#1')
    }).toThrow(/expected hex color/)
    expect(() => {
        Style.resolveStyle('backgroundColor', '#12')
    }).toThrow(/expected hex color/)
    expect(() => {
        Style.resolveStyle('backgroundColor', '#12345')
    }).toThrow(/expected hex color/)
    expect(() => {
        Style.resolveStyle('backgroundColor', ' LightGray ')
    }).toThrow(/expected hex color/)
    expect(() => {
        Style.resolveStyle('backgroundColor', 'red')
    }).toThrow(/expected hex color/)

    expect(Style.resolveStyle('backgroundColor', '#123')).toEqual({
        name: 'backgroundColor',
        value: '#123',
        parsed: { rgba: [17 / 255, 34 / 255, 51 / 255, 1] },
    })
    expect(Style.resolveStyle('backgroundColor', '#1234')).toEqual({
        name: 'backgroundColor',
        value: '#1234',
        parsed: { rgba: [17 / 255, 34 / 255, 51 / 255, 68 / 255] },
    })
    expect(Style.resolveStyle('backgroundColor', '#123456')).toEqual({
        name: 'backgroundColor',
        value: '#123456',
        parsed: { rgba: [18 / 255, 52 / 255, 86 / 255, 1] },
    })
    expect(Style.resolveStyle('backgroundColor', '#12345678')).toEqual({
        name: 'backgroundColor',
        value: '#12345678',
        parsed: { rgba: [18 / 255, 52 / 255, 86 / 255, 120 / 255] },
    })
})

test('position', () => {
    expect(Style.resolveStyle('position', 'relative')).toEqual({
        name: 'position',
        value: 'relative',
    })
    expect(() => {
        Style.resolveStyle('position', 'fixed')
    }).toThrow(/expected one of static, relative, absolute/)
})
