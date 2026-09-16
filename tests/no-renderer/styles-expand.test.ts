import { test, expect } from '@playwright/test'
import Style from '../../src/style'

test('flex expands to grow, shrink, basis', () => {
    expect(Style.resolveStyle('flex', '1.5').expanded).toEqual([
        { name: 'flexGrow', value: '1.5', parsed: { value: 1.5 } },
        { name: 'flexShrink', value: '1', parsed: { value: 1 } },
        { name: 'flexBasis', value: '0%', parsed: { value: 0, kind: '%' } },
    ])

    expect(Style.resolveStyle('flex', '1 2').expanded).toEqual([
        { name: 'flexGrow', value: '1', parsed: { value: 1 } },
        { name: 'flexShrink', value: '2', parsed: { value: 2 } },
        { name: 'flexBasis', value: 'auto', parsed: { kind: 'auto' } },
    ])

    expect(Style.resolveStyle('flex', '1 1 0%').expanded).toEqual([
        { name: 'flexGrow', value: '1', parsed: { value: 1 } },
        { name: 'flexShrink', value: '1', parsed: { value: 1 } },
        { name: 'flexBasis', value: '0%', parsed: { value: 0, kind: '%' } },
    ])

    const flex_basis = [
        { name: 'flexGrow', value: '1', parsed: { value: 1 } },
        { name: 'flexShrink', value: '1', parsed: { value: 1 } },
        { name: 'flexBasis', value: '10px', parsed: { value: 10, kind: 'px' } },
    ]
    expect(Style.resolveStyle('flex', '1 10px').expanded).toEqual(flex_basis)
    expect(Style.resolveStyle('flex', '1 1 10px').expanded).toEqual(flex_basis)

    expect(Style.resolveStyle('flex', ' Unset ').expanded).toEqual([
        { name: 'flexGrow', value: 'unset', parsed: { kind: 'unset' } },
        { name: 'flexShrink', value: 'unset', parsed: { kind: 'unset' } },
        { name: 'flexBasis', value: 'unset', parsed: { kind: 'unset' } },
    ])

    expect(() => {
        Style.validateStyle('flex', true)
    }).toThrow(/style value must be a string/)
    expect(() => {
        Style.resolveStyle('flex', '-1')
    }).toThrow(/expected non-negative value/)
    expect(() => {
        Style.resolveStyle('flex', '1 1 nope')
    }).toThrow(/expected px unit/)
})

test('overflow expands to both axes', () => {
    expect(Style.resolveStyle('overflow', ' scroll ').expanded).toEqual([
        { name: 'overflowX', value: 'scroll', parsed: { enum: 2 } },
        { name: 'overflowY', value: 'scroll', parsed: { enum: 2 } },
    ])
})

test('unset expands to every border and background position longhand', () => {
    const border_names = Style.resolveStyle('border', 'unset').expanded.map((style) => style.name)
    const expected_border_names = []
    for (const property of ['Width', 'Style', 'Color']) {
        for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
            expected_border_names.push(`border${side}${property}`)
        }
    }

    expect(border_names).toEqual(expected_border_names)
    expect(Style.resolveStyle('backgroundPosition', 'unset').expanded.map((style) => style.name)).toEqual([
        'backgroundPositionX',
        'backgroundPositionY',
    ])
})

test('padding expands to four edges', () => {
    expect(Style.resolveStyle('padding', '1px 2px 3px 4px').expanded).toEqual([
        { name: 'paddingTop', value: '1px', parsed: { value: 1, kind: 'px' } },
        { name: 'paddingRight', value: '2px', parsed: { value: 2, kind: 'px' } },
        { name: 'paddingBottom', value: '3px', parsed: { value: 3, kind: 'px' } },
        { name: 'paddingLeft', value: '4px', parsed: { value: 4, kind: 'px' } },
    ])

    expect(Style.resolveStyle('padding', '10% 20%').expanded).toEqual([
        { name: 'paddingTop', value: '10%', parsed: { value: 10, kind: '%' } },
        { name: 'paddingRight', value: '20%', parsed: { value: 20, kind: '%' } },
        { name: 'paddingBottom', value: '10%', parsed: { value: 10, kind: '%' } },
        { name: 'paddingLeft', value: '20%', parsed: { value: 20, kind: '%' } },
    ])
})

test('margin expands to four edges', () => {
    expect(Style.resolveStyle('margin', '1px auto -2% 3px').expanded).toEqual([
        { name: 'marginTop', value: '1px', parsed: { value: 1, kind: 'px' } },
        { name: 'marginRight', value: 'auto', parsed: { kind: 'auto' } },
        { name: 'marginBottom', value: '-2%', parsed: { value: -2, kind: '%' } },
        { name: 'marginLeft', value: '3px', parsed: { value: 3, kind: 'px' } },
    ])

    expect(Style.resolveStyle('margin', '4px 8px').expanded).toEqual([
        { name: 'marginTop', value: '4px', parsed: { value: 4, kind: 'px' } },
        { name: 'marginRight', value: '8px', parsed: { value: 8, kind: 'px' } },
        { name: 'marginBottom', value: '4px', parsed: { value: 4, kind: 'px' } },
        { name: 'marginLeft', value: '8px', parsed: { value: 8, kind: 'px' } },
    ])
})

test('border expands in canonical width, style, color order', () => {
    const expanded = [
        { name: 'borderTopWidth', value: '2px', parsed: { value: 2, kind: 'px' } },
        { name: 'borderRightWidth', value: '2px', parsed: { value: 2, kind: 'px' } },
        { name: 'borderBottomWidth', value: '2px', parsed: { value: 2, kind: 'px' } },
        { name: 'borderLeftWidth', value: '2px', parsed: { value: 2, kind: 'px' } },
        { name: 'borderTopStyle', value: 'solid', parsed: { enum: 1 } },
        { name: 'borderRightStyle', value: 'solid', parsed: { enum: 1 } },
        { name: 'borderBottomStyle', value: 'solid', parsed: { enum: 1 } },
        { name: 'borderLeftStyle', value: 'solid', parsed: { enum: 1 } },
        { name: 'borderTopColor', value: '#123', parsed: { rgba: [17, 34, 51, 255] } },
        { name: 'borderRightColor', value: '#123', parsed: { rgba: [17, 34, 51, 255] } },
        { name: 'borderBottomColor', value: '#123', parsed: { rgba: [17, 34, 51, 255] } },
        { name: 'borderLeftColor', value: '#123', parsed: { rgba: [17, 34, 51, 255] } },
    ]

    expect(Style.resolveStyle('border', '2px solid #123').expanded).toEqual(expanded)
    expect(Style.resolveStyle('border', 'solid #123 2px').expanded).toEqual(expanded)
})

test('borderRadius expands to four corners', () => {
    expect(Style.resolveStyle('borderRadius', '1px 2px 3px 4px').expanded).toEqual([
        { name: 'borderTopLeftRadius', value: '1px', parsed: { value: 1, kind: 'px' } },
        { name: 'borderTopRightRadius', value: '2px', parsed: { value: 2, kind: 'px' } },
        { name: 'borderBottomRightRadius', value: '3px', parsed: { value: 3, kind: 'px' } },
        { name: 'borderBottomLeftRadius', value: '4px', parsed: { value: 4, kind: 'px' } },
    ])

    expect(Style.resolveStyle('borderRadius', '10% 20%').expanded).toEqual([
        { name: 'borderTopLeftRadius', value: '10%', parsed: { value: 10, kind: '%' } },
        { name: 'borderTopRightRadius', value: '20%', parsed: { value: 20, kind: '%' } },
        { name: 'borderBottomRightRadius', value: '10%', parsed: { value: 10, kind: '%' } },
        { name: 'borderBottomLeftRadius', value: '20%', parsed: { value: 20, kind: '%' } },
    ])
})
