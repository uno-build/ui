import { test, expect } from '@playwright/test'
import Style from '../src/style'

test('flex expands to grow, shrink, basis', () => {
    expect(Style.resolveStyle('flex', '1.5')).toEqual([
        { name: 'flexGrow', value: '1.5', parsed: { value: 1.5 } },
        { name: 'flexShrink', value: '1', parsed: { value: 1 } },
        { name: 'flexBasis', value: '0%', parsed: { value: 0, unit: '%' } },
    ])

    expect(Style.resolveStyle('flex', '1 2')).toEqual([
        { name: 'flexGrow', value: '1', parsed: { value: 1 } },
        { name: 'flexShrink', value: '2', parsed: { value: 2 } },
        { name: 'flexBasis', value: 'auto', parsed: { unit: 'auto' } },
    ])

    expect(Style.resolveStyle('flex', '1 1 0%')).toEqual([
        { name: 'flexGrow', value: '1', parsed: { value: 1 } },
        { name: 'flexShrink', value: '1', parsed: { value: 1 } },
        { name: 'flexBasis', value: '0%', parsed: { value: 0, unit: '%' } },
    ])

    expect(Style.resolveStyle('flex', ' Unset ')).toEqual([
        { name: 'flexGrow', value: 'unset', parsed: { unit: 'unset' } },
        { name: 'flexShrink', value: 'unset', parsed: { unit: 'unset' } },
        { name: 'flexBasis', value: 'unset', parsed: { unit: 'unset' } },
    ])

    expect(() => {
        Style.resolveStyle('flex', true)
    }).toThrow(/style value must be a string/)
    expect(() => {
        Style.resolveStyle('flex', '-1')
    }).toThrow(/expected non-negative value/)
    expect(() => {
        Style.resolveStyle('flex', '1 1 nope')
    }).toThrow(/expected px unit/)
})

test('padding expands to four edges', () => {
    expect(Style.resolveStyle('padding', '1px 2px 3px 4px')).toEqual([
        { name: 'paddingTop', value: '1px', parsed: { value: 1, unit: 'px' } },
        { name: 'paddingRight', value: '2px', parsed: { value: 2, unit: 'px' } },
        { name: 'paddingBottom', value: '3px', parsed: { value: 3, unit: 'px' } },
        { name: 'paddingLeft', value: '4px', parsed: { value: 4, unit: 'px' } },
    ])

    expect(Style.resolveStyle('padding', '10% 20%')).toEqual([
        { name: 'paddingTop', value: '10%', parsed: { value: 10, unit: '%' } },
        { name: 'paddingRight', value: '20%', parsed: { value: 20, unit: '%' } },
        { name: 'paddingBottom', value: '10%', parsed: { value: 10, unit: '%' } },
        { name: 'paddingLeft', value: '20%', parsed: { value: 20, unit: '%' } },
    ])
})

test('margin expands to four edges', () => {
    expect(Style.resolveStyle('margin', '1px auto -2% 3px')).toEqual([
        { name: 'marginTop', value: '1px', parsed: { value: 1, unit: 'px' } },
        { name: 'marginRight', value: 'auto', parsed: { unit: 'auto' } },
        { name: 'marginBottom', value: '-2%', parsed: { value: -2, unit: '%' } },
        { name: 'marginLeft', value: '3px', parsed: { value: 3, unit: 'px' } },
    ])

    expect(Style.resolveStyle('margin', '4px 8px')).toEqual([
        { name: 'marginTop', value: '4px', parsed: { value: 4, unit: 'px' } },
        { name: 'marginRight', value: '8px', parsed: { value: 8, unit: 'px' } },
        { name: 'marginBottom', value: '4px', parsed: { value: 4, unit: 'px' } },
        { name: 'marginLeft', value: '8px', parsed: { value: 8, unit: 'px' } },
    ])
})

test('border expands to width, style, color on each edge', () => {
    expect(Style.resolveStyle('border', '2px solid #123')).toEqual([
        { name: 'borderTopWidth', value: '2px', parsed: { value: 2, unit: 'px' } },
        { name: 'borderTopStyle', value: 'solid', parsed: { enum: 1 } },
        { name: 'borderTopColor', value: '#123', parsed: { rgba: [17, 34, 51, 255] } },
        { name: 'borderRightWidth', value: '2px', parsed: { value: 2, unit: 'px' } },
        { name: 'borderRightStyle', value: 'solid', parsed: { enum: 1 } },
        { name: 'borderRightColor', value: '#123', parsed: { rgba: [17, 34, 51, 255] } },
        { name: 'borderBottomWidth', value: '2px', parsed: { value: 2, unit: 'px' } },
        { name: 'borderBottomStyle', value: 'solid', parsed: { enum: 1 } },
        { name: 'borderBottomColor', value: '#123', parsed: { rgba: [17, 34, 51, 255] } },
        { name: 'borderLeftWidth', value: '2px', parsed: { value: 2, unit: 'px' } },
        { name: 'borderLeftStyle', value: 'solid', parsed: { enum: 1 } },
        { name: 'borderLeftColor', value: '#123', parsed: { rgba: [17, 34, 51, 255] } },
    ])
})

test('borderRadius expands to four corners', () => {
    expect(Style.resolveStyle('borderRadius', '1px 2px 3px 4px')).toEqual([
        { name: 'borderTopLeftRadius', value: '1px', parsed: { value: 1, unit: 'px' } },
        { name: 'borderTopRightRadius', value: '2px', parsed: { value: 2, unit: 'px' } },
        { name: 'borderBottomRightRadius', value: '3px', parsed: { value: 3, unit: 'px' } },
        { name: 'borderBottomLeftRadius', value: '4px', parsed: { value: 4, unit: 'px' } },
    ])

    expect(Style.resolveStyle('borderRadius', '10% 20%')).toEqual([
        { name: 'borderTopLeftRadius', value: '10%', parsed: { value: 10, unit: '%' } },
        { name: 'borderTopRightRadius', value: '20%', parsed: { value: 20, unit: '%' } },
        { name: 'borderBottomRightRadius', value: '10%', parsed: { value: 10, unit: '%' } },
        { name: 'borderBottomLeftRadius', value: '20%', parsed: { value: 20, unit: '%' } },
    ])
})
