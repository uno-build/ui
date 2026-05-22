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

test('unitPixelStyle', () => {
    expect(() => {
        Style.resolveStyle('borderWidth', '10%')
    }).toThrow(/expected px unit/)
    expect(() => {
        Style.resolveStyle('borderWidth', -1)
    }).toThrow(/expected px unit/)
    expect(() => {
        Style.resolveStyle('borderWidth', 'thin')
    }).toThrow(/expected px unit/)
    expect(() => {
        Style.resolveStyle('borderTopWidth', 'thin')
    }).toThrow(/expected px unit/)
    expect(() => {
        Style.resolveStyle('borderLeftWidth', 'medium')
    }).toThrow(/expected px unit/)
    expect(() => {
        Style.resolveStyle('borderRightWidth', 'thick')
    }).toThrow(/expected px unit/)
    expect(() => {
        Style.resolveStyle('borderWidth', '1px solid #333')
    }).toThrow(/expected px unit/)
    expect(() => {
        Style.resolveStyle('border', '1px')
    }).toThrow(/unsupported property 'border'/)

    expect(Style.resolveStyle('borderWidth', 2)).toEqual({
        name: 'borderWidth',
        value: '2px',
        parsed: { value: 2, unit: 'px' },
    })
    expect(Style.resolveStyle('borderWidth', '1px')).toEqual({
        name: 'borderWidth',
        value: '1px',
        parsed: { value: 1, unit: 'px' },
    })
    expect(Style.resolveStyle('borderTopWidth', ' 1PX ')).toEqual({
        name: 'borderTopWidth',
        value: '1px',
        parsed: { value: 1, unit: 'px' },
    })
})

test('numberStyle', () => {
    expect(() => {
        Style.resolveStyle('flex', true)
    }).toThrow(/expected number/)
    expect(() => {
        Style.resolveStyle('flexGrow', -1)
    }).toThrow(/expected non-negative number/)

    expect(Style.resolveStyle('flex', ' 1.5 ')).toEqual({
        name: 'flex',
        value: 1.5,
        parsed: { value: 1.5 },
    })
    expect(Style.resolveStyle('flexGrow', 2)).toEqual({
        name: 'flexGrow',
        value: 2,
        parsed: { value: 2 },
    })
})

test('unitOrAutoStyle', () => {
    expect(() => {
        Style.resolveStyle('width', true)
    }).toThrow(/expected px or % unit/)
    expect(() => {
        Style.resolveStyle('width', '12em')
    }).toThrow(/expected px or % unit/)

    expect(Style.resolveStyle('width', 'auto')).toEqual({
        name: 'width',
        value: 'auto',
        parsed: { unit: 'auto' },
    })
    expect(Style.resolveStyle('width', '10px')).toEqual({
        name: 'width',
        value: '10px',
        parsed: { value: 10, unit: 'px' },
    })
    expect(Style.resolveStyle('width', '10%')).toEqual({
        name: 'width',
        value: '10%',
        parsed: { value: 10, unit: '%' },
    })
    expect(Style.resolveStyle('height', ' 10PX ')).toEqual({
        name: 'height',
        value: '10px',
        parsed: { value: 10, unit: 'px' },
    })
    expect(Style.resolveStyle('height', '10%')).toEqual({
        name: 'height',
        value: '10%',
        parsed: { value: 10, unit: '%' },
    })
})

test('enumStyle', () => {
    expect(() => {
        Style.resolveStyle('flexWrap', 'no-wrap')
    }).toThrow(/expected one of nowrap, wrap, wrap-reverse/)
    expect(() => {
        Style.resolveStyle('alignItems', 'space-between')
    }).toThrow(
        /expected one of normal, flex-start, center, flex-end, stretch, baseline/,
    )

    expect(Style.resolveStyle('flexWrap', ' Nowrap ')).toEqual({
        name: 'flexWrap',
        value: 'nowrap',
        parsed: { enum: 0 },
    })
    expect(Style.resolveStyle('justifyContent', 'space-evenly')).toEqual({
        name: 'justifyContent',
        value: 'space-evenly',
        parsed: { enum: 5 },
    })
    expect(Style.resolveStyle('alignContent', 'space-between')).toEqual({
        name: 'alignContent',
        value: 'space-between',
        parsed: { enum: 6 },
    })
    expect(Style.resolveStyle('alignSelf', 'auto')).toEqual({
        name: 'alignSelf',
        value: 'auto',
        parsed: { enum: 0 },
    })
})

test('colorStyle', () => {
    expect(() => {
        Style.resolveStyle('backgroundColor', 'rgb(255, 0, 0)')
    }).toThrow(/expected hex color/)

    expect(Style.resolveStyle('backgroundColor', ' #0A1B2C ')).toEqual({
        name: 'backgroundColor',
        value: '#0a1b2c',
        parsed: { rgba: [10 / 255, 27 / 255, 44 / 255, 1] },
    })
})
