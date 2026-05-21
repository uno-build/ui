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
    expect(Style.resolveStyle(' background-color ', ' #ABC ')).toEqual({
        name: 'backgroundColor',
        value: '#abc',
        parsed: { rgba: [170 / 255, 187 / 255, 204 / 255, 1] },
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
    expect(() => {
        Style.resolveStyle('position', 'fixed')
    }).toThrow(/expected one of static, relative, absolute/)

    expect(Style.resolveStyle('position', 'static')).toEqual({
        name: 'position',
        value: 'static',
        parsed: { enum: 0 },
    })
    expect(Style.resolveStyle('POSITION', 'relative')).toEqual({
        name: 'position',
        value: 'relative',
        parsed: { enum: 1 },
    })
    expect(Style.resolveStyle('pOsItIoN', 'rElAtIvE')).toEqual({
        name: 'position',
        value: 'relative',
        parsed: { enum: 1 },
    })
    expect(Style.resolveStyle('Position', ' Absolute ')).toEqual({
        name: 'position',
        value: 'absolute',
        parsed: { enum: 2 },
    })
})

test('gap', () => {
    expect(() => {
        Style.resolveStyle('gap', true)
    }).toThrow(/expected px or % unit/)
    expect(() => {
        Style.resolveStyle('gap', '12em')
    }).toThrow(/expected px or % unit/)
    expect(() => {
        Style.resolveStyle('gap', 'auto')
    }).toThrow(/expected px or % unit/)

    expect(Style.resolveStyle('gap', 11)).toEqual({
        name: 'gap',
        value: '11px',
        parsed: { value: 11, unit: 'px' },
    })
    expect(Style.resolveStyle('gap', '11')).toEqual({
        name: 'gap',
        value: '11px',
        parsed: { value: 11, unit: 'px' },
    })
    expect(Style.resolveStyle('gap', ' 11px ')).toEqual({
        name: 'gap',
        value: '11px',
        parsed: { value: 11, unit: 'px' },
    })
    expect(Style.resolveStyle('gap', ' 11PX ')).toEqual({
        name: 'gap',
        value: '11px',
        parsed: { value: 11, unit: 'px' },
    })
    expect(Style.resolveStyle('gap', -11)).toEqual({
        name: 'gap',
        value: '-11px',
        parsed: { value: 11, unit: 'px' },
    })
    expect(Style.resolveStyle('gap', '-11pX')).toEqual({
        name: 'gap',
        value: '-11px',
        parsed: { value: 11, unit: 'px' },
    })
    expect(Style.resolveStyle('gap', '10%')).toEqual({
        name: 'gap',
        value: '10%',
        parsed: { value: 10, unit: '%' },
    })
    expect(Style.resolveStyle('gap', '-10%')).toEqual({
        name: 'gap',
        value: '-10%',
        parsed: { value: 10, unit: '%' },
    })
})
