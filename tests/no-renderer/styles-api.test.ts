import { test, expect } from '@playwright/test'
import Style from '../../src/style'

test('validateStyle', () => {
    expect(Style.validateStyle('  background-color  ', '#f00')).toBe('backgroundColor')
    expect(() => Style.validateStyle()).toThrow(/style name must be a string/)
    expect(() => Style.validateStyle('noexist', '')).toThrow(/unsupported property 'noexist'/)
    expect(() => Style.validateStyle('backgroundColor')).toThrow(/style value must be a string, got 'undefined'/)
})

test('resolveStyle', () => {
    expect(Style.resolveStyle('backgroundColor', '#f00').expanded).toEqual([
        {
            name: 'backgroundColor',
            value: '#f00',
            parsed: { rgba: [255, 0, 0, 255] },
        },
    ])
})

test('validateStyle should always normalize name', () => {
    const red = '#f00'
    const normalized_name = Style.validateStyle('  background-color  ', red)
    const resolved = Style.resolveStyle(normalized_name, red)
    const toBe = [
        {
            name: 'backgroundColor',
            value: red,
            parsed: { rgba: [255, 0, 0, 255] },
        },
    ]
    expect(resolved.name).toBe('backgroundColor')
    expect(resolved.value).toBe(red)
    expect(resolved.expanded).toEqual(toBe)
    expect(Style.resolveStyle('backgroundColor', red).expanded).toEqual(toBe)
    expect(Style.validateStyle(' backgroundColor ', red)).toBe('backgroundColor')
    expect(Style.validateStyle('  background-color  ', red)).toBe('backgroundColor')
    expect(Style.validateStyle('BACKGROUND-COLOR', red)).toBe('backgroundColor')
    expect(Style.validateStyle('Background-Color', red)).toBe('backgroundColor')
    expect(Style.validateStyle('BACKGROUNDCOLOR', red)).toBe('backgroundColor')
})

test('unitPixelStyle', () => {
    expect(() => {
        Style.resolveStyle('borderTopWidth', '10%')
    }).toThrow(/expected px unit/)
    expect(() => {
        Style.validateStyle('borderTopWidth', -1)
    }).toThrow(/style value must be a string/)
    expect(() => {
        Style.resolveStyle('borderTopWidth', 'thin')
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
        Style.resolveStyle('borderTopWidth', '1px solid #333')
    }).toThrow(/expected px unit/)
    expect(() => {
        Style.resolveStyle('borderTopWidth', '2')
    }).toThrow(/expected px unit/)
    expect(Style.resolveStyle('borderTopWidth', '2px').expanded).toEqual([
        {
            name: 'borderTopWidth',
            value: '2px',
            parsed: { value: 2, kind: 'px' },
        },
    ])
    expect(Style.resolveStyle('borderTopWidth', '1px').expanded).toEqual([
        {
            name: 'borderTopWidth',
            value: '1px',
            parsed: { value: 1, kind: 'px' },
        },
    ])
    expect(Style.resolveStyle('borderTopWidth', ' 1PX ').expanded).toEqual([
        {
            name: 'borderTopWidth',
            value: '1px',
            parsed: { value: 1, kind: 'px' },
        },
    ])
})

test('unitOrAutoStyle', () => {
    expect(() => {
        Style.validateStyle('width', true)
    }).toThrow(/style value must be a string/)
    expect(() => {
        Style.resolveStyle('width', '12em')
    }).toThrow(/expected px unit/)

    expect(Style.resolveStyle('width', 'auto').expanded).toEqual([
        {
            name: 'width',
            value: 'auto',
            parsed: { kind: 'auto' },
        },
    ])
    expect(Style.resolveStyle('width', '10px').expanded).toEqual([
        {
            name: 'width',
            value: '10px',
            parsed: { value: 10, kind: 'px' },
        },
    ])
    expect(Style.resolveStyle('width', '10%').expanded).toEqual([
        {
            name: 'width',
            value: '10%',
            parsed: { value: 10, kind: '%' },
        },
    ])
    expect(Style.resolveStyle('height', ' 10PX ').expanded).toEqual([
        {
            name: 'height',
            value: '10px',
            parsed: { value: 10, kind: 'px' },
        },
    ])
    expect(Style.resolveStyle('height', '10%').expanded).toEqual([
        {
            name: 'height',
            value: '10%',
            parsed: { value: 10, kind: '%' },
        },
    ])
    expect(Style.resolveStyle('left', '-10px').expanded).toEqual([
        {
            name: 'left',
            value: '-10px',
            parsed: { value: -10, kind: 'px' },
        },
    ])
    expect(Style.resolveStyle('left', '-10%').expanded).toEqual([
        {
            name: 'left',
            value: '-10%',
            parsed: { value: -10, kind: '%' },
        },
    ])
})

test('enumStyle', () => {
    expect(() => {
        Style.resolveStyle('flexWrap', 'no-wrap')
    }).toThrow(/expected one of nowrap, wrap, wrap-reverse/)
    expect(() => {
        Style.resolveStyle('alignItems', 'space-between')
    }).toThrow(/expected one of normal, flex-start, center, flex-end, stretch, baseline/)

    expect(Style.resolveStyle('flexWrap', ' Nowrap ').expanded).toEqual([
        {
            name: 'flexWrap',
            value: 'nowrap',
            parsed: { enum: 0 },
        },
    ])
    expect(Style.resolveStyle('justifyContent', 'space-evenly').expanded).toEqual([
        {
            name: 'justifyContent',
            value: 'space-evenly',
            parsed: { enum: 5 },
        },
    ])
    expect(Style.resolveStyle('alignContent', 'space-between').expanded).toEqual([
        {
            name: 'alignContent',
            value: 'space-between',
            parsed: { enum: 6 },
        },
    ])
    expect(Style.resolveStyle('alignSelf', 'auto').expanded).toEqual([
        {
            name: 'alignSelf',
            value: 'auto',
            parsed: { enum: 0 },
        },
    ])
})

test('pointerEvents', () => {
    expect(Style.validateStyle(' pointer-events ', 'all')).toBe('pointerEvents')
    expect(Style.resolveStyle('pointerEvents', ' All ').expanded).toEqual([
        {
            name: 'pointerEvents',
            value: 'all',
            parsed: { enum: 0 },
        },
    ])
    expect(Style.resolveStyle('pointerEvents', 'none').expanded).toEqual([
        {
            name: 'pointerEvents',
            value: 'none',
            parsed: { enum: 1 },
        },
    ])
    expect(() => Style.resolveStyle('pointerEvents', 'auto')).toThrow(/expected one of all, none/)
})

test('colorStyle', () => {
    expect(() => {
        Style.resolveStyle('backgroundColor', 'rgb(255, 0, 0)')
    }).toThrow(/expected hex color/)

    expect(Style.resolveStyle('backgroundColor', ' #0A1B2C ').expanded).toEqual([
        {
            name: 'backgroundColor',
            value: '#0a1b2c',
            parsed: { rgba: [10, 27, 44, 255] },
        },
    ])
})

test('integerStyle', () => {
    expect(Style.resolveStyle('zIndex', '-1').expanded).toEqual([
        {
            name: 'zIndex',
            value: '-1',
            parsed: { value: -1 },
        },
    ])
    expect(Style.resolveStyle('zIndex', '2').expanded).toEqual([
        {
            name: 'zIndex',
            value: '2',
            parsed: { value: 2 },
        },
    ])
    expect(() => {
        Style.resolveStyle('zIndex', '1.5')
    }).toThrow(/expected integer/)
    expect(() => {
        Style.validateStyle('zIndex', 1)
    }).toThrow(/style value must be a string/)
})

test('non-negative number styles reject negative values', () => {
    const styles = ['flexGrow', 'flexShrink', 'aspectRatio']

    for (const name of styles) {
        expect(() => {
            Style.resolveStyle(name, '-1')
        }).toThrow(/expected non-negative value/)

        expect(Style.resolveStyle(name, '1').expanded).toEqual([
            {
                name,
                value: '1',
                parsed: { value: 1 },
            },
        ])
    }
})

test('non-negative unit styles reject negative values', () => {
    const styles = [
        'borderTopLeftRadius',
        'borderTopRightRadius',
        'borderBottomLeftRadius',
        'borderBottomRightRadius',
        'flexBasis',
        'width',
        'height',
        'minWidth',
        'minHeight',
        'maxWidth',
        'maxHeight',
        'paddingTop',
        'paddingLeft',
        'paddingRight',
        'paddingBottom',
        'rowGap',
        'columnGap',
        'gap',
    ]

    for (const name of styles) {
        expect(() => {
            Style.validateStyle(name, -1)
        }).toThrow(/style value must be a string/)
        expect(() => {
            Style.resolveStyle(name, '-1px')
        }).toThrow(/expected non-negative value/)
        expect(() => {
            Style.resolveStyle(name, '-1%')
        }).toThrow(/expected non-negative value/)
        expect(Style.resolveStyle(name, '1px').expanded).toEqual([
            {
                name,
                value: '1px',
                parsed: { value: 1, kind: 'px' },
            },
        ])
    }
})

test('size constraint styles reject none', () => {
    const styles = ['minWidth', 'minHeight', 'maxWidth', 'maxHeight']

    for (const name of styles) {
        expect(() => {
            Style.resolveStyle(name, 'none')
        }).toThrow(/expected px unit/)
    }
})

test('all styles accept unset', () => {
    for (const style of Object.values(Style.STYLE)) {
        const resolved_style = Style.resolveStyle(style.name, ' Unset ')
        expect(resolved_style.expanded.length, style.name).toBeGreaterThan(0)

        for (const expanded_style of resolved_style.expanded) {
            expect(expanded_style.value, expanded_style.name).toBe('unset')
            expect(expanded_style.parsed, expanded_style.name).toEqual({ kind: 'unset' })
        }
    }
})

test('border width styles are px-only and non-negative', () => {
    const styles = ['borderTopWidth', 'borderLeftWidth', 'borderRightWidth', 'borderBottomWidth']

    for (const name of styles) {
        expect(Style.resolveStyle(name, '2px').expanded).toEqual([
            {
                name,
                value: '2px',
                parsed: { value: 2, kind: 'px' },
            },
        ])
        expect(Style.resolveStyle(name, '1px').expanded).toEqual([
            {
                name,
                value: '1px',
                parsed: { value: 1, kind: 'px' },
            },
        ])
        expect(() => {
            Style.resolveStyle(name, '10%')
        }).toThrow(/expected px unit/)
        expect(() => {
            Style.resolveStyle(name, '1')
        }).toThrow(/expected px unit/)
        expect(() => {
            Style.validateStyle(name, -1)
        }).toThrow(/style value must be a string/)
        expect(() => {
            Style.resolveStyle(name, 'thin')
        }).toThrow(/expected px unit/)
        expect(() => {
            Style.resolveStyle(name, '1px solid #333')
        }).toThrow(/expected px unit/)
    }
})

test('unitOrAutoStyle accepts auto across all auto-capable styles', () => {
    const styles = [
        'top',
        'left',
        'right',
        'bottom',
        'marginTop',
        'marginLeft',
        'marginRight',
        'marginBottom',
        'flexBasis',
        'width',
        'height',
    ]

    for (const name of styles) {
        expect(Style.resolveStyle(name, ' Auto ').expanded).toEqual([
            {
                name,
                value: 'auto',
                parsed: { kind: 'auto' },
            },
        ])
    }
})

test('enumStyle maps all enum properties', () => {
    const styles: Array<[string, string, number]> = [
        ['position', 'absolute', 2],
        ['alignContent', 'space-evenly', 8],
        ['alignItems', 'baseline', 5],
        ['alignSelf', 'auto', 0],
        ['flexDirection', 'row-reverse', 3],
        ['flexWrap', 'wrap-reverse', 2],
        ['justifyContent', 'space-around', 4],
        ['boxSizing', 'content-box', 1],
        ['overflowX', 'scroll', 2],
        ['overflowY', 'hidden', 1],
        ['display', 'contents', 2],
        ['direction', 'rtl', 2],
    ]

    for (const [name, value, parsed] of styles) {
        expect(Style.resolveStyle(name, value).expanded).toEqual([
            {
                name,
                value,
                parsed: { enum: parsed },
            },
        ])
        expect(() => {
            Style.resolveStyle(name, 'invalid-value')
        }).toThrow(/expected one of/)
    }
})
