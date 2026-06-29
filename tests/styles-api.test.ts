import { test, expect } from '@playwright/test'
import Style from '../src/style'

test('resolveStyle', () => {
    expect(() => {
        Style.resolveStyle()
    }).toThrow(/style name must be a string/)
    expect(() => {
        Style.resolveStyle('noexist')
    }).toThrow(/unsupported property 'noexist'/)

    expect(() => {
        Style.resolveStyle('backgroundColor')
    }).toThrow(/style value must be a string or an object, got 'undefined'/)
})

test('resolveStyle should always normalize name', () => {
    const red = '#f00'
    const toBe = [
        {
            name: 'backgroundColor',
            value: red,
            parsed: { rgba: [255, 0, 0, 255] },
        },
    ]
    expect(Style.resolveStyle('backgroundColor', red)).toEqual(toBe)
    expect(Style.resolveStyle(' backgroundColor ', red)).toEqual(toBe)
    expect(Style.resolveStyle('  background-color  ', red)).toEqual(toBe)
    expect(Style.resolveStyle('BACKGROUND-COLOR', red)).toEqual(toBe)
    expect(Style.resolveStyle('Background-Color', red)).toEqual(toBe)
    expect(Style.resolveStyle('Background-Color', red)).toEqual(toBe)
    expect(Style.resolveStyle('BACKGROUNDCOLOR', red)).toEqual(toBe)
})

test('unitPixelStyle', () => {
    expect(() => {
        Style.resolveStyle('borderTopWidth', '10%')
    }).toThrow(/expected px unit/)
    expect(() => {
        Style.resolveStyle('borderTopWidth', -1)
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
    expect(Style.resolveStyle('borderTopWidth', '2px')).toEqual([
        {
            name: 'borderTopWidth',
            value: '2px',
            parsed: { value: 2, unit: 'px' },
        },
    ])
    expect(Style.resolveStyle('borderTopWidth', '1px')).toEqual([
        {
            name: 'borderTopWidth',
            value: '1px',
            parsed: { value: 1, unit: 'px' },
        },
    ])
    expect(Style.resolveStyle('borderTopWidth', ' 1PX ')).toEqual([
        {
            name: 'borderTopWidth',
            value: '1px',
            parsed: { value: 1, unit: 'px' },
        },
    ])
})

test('unitOrAutoStyle', () => {
    expect(() => {
        Style.resolveStyle('width', true)
    }).toThrow(/style value must be a string/)
    expect(() => {
        Style.resolveStyle('width', '12em')
    }).toThrow(/expected px unit/)

    expect(Style.resolveStyle('width', 'auto')).toEqual([
        {
            name: 'width',
            value: 'auto',
            parsed: { unit: 'auto' },
        },
    ])
    expect(Style.resolveStyle('width', '10px')).toEqual([
        {
            name: 'width',
            value: '10px',
            parsed: { value: 10, unit: 'px' },
        },
    ])
    expect(Style.resolveStyle('width', '10%')).toEqual([
        {
            name: 'width',
            value: '10%',
            parsed: { value: 10, unit: '%' },
        },
    ])
    expect(Style.resolveStyle('height', ' 10PX ')).toEqual([
        {
            name: 'height',
            value: '10px',
            parsed: { value: 10, unit: 'px' },
        },
    ])
    expect(Style.resolveStyle('height', '10%')).toEqual([
        {
            name: 'height',
            value: '10%',
            parsed: { value: 10, unit: '%' },
        },
    ])
    expect(Style.resolveStyle('left', '-10px')).toEqual([
        {
            name: 'left',
            value: '-10px',
            parsed: { value: -10, unit: 'px' },
        },
    ])
    expect(Style.resolveStyle('left', '-10%')).toEqual([
        {
            name: 'left',
            value: '-10%',
            parsed: { value: -10, unit: '%' },
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

    expect(Style.resolveStyle('flexWrap', ' Nowrap ')).toEqual([
        {
            name: 'flexWrap',
            value: 'nowrap',
            parsed: { enum: 0 },
        },
    ])
    expect(Style.resolveStyle('justifyContent', 'space-evenly')).toEqual([
        {
            name: 'justifyContent',
            value: 'space-evenly',
            parsed: { enum: 5 },
        },
    ])
    expect(Style.resolveStyle('alignContent', 'space-between')).toEqual([
        {
            name: 'alignContent',
            value: 'space-between',
            parsed: { enum: 6 },
        },
    ])
    expect(Style.resolveStyle('alignSelf', 'auto')).toEqual([
        {
            name: 'alignSelf',
            value: 'auto',
            parsed: { enum: 0 },
        },
    ])
})

test('colorStyle', () => {
    expect(() => {
        Style.resolveStyle('backgroundColor', 'rgb(255, 0, 0)')
    }).toThrow(/expected hex color/)

    expect(Style.resolveStyle('backgroundColor', ' #0A1B2C ')).toEqual([
        {
            name: 'backgroundColor',
            value: '#0a1b2c',
            parsed: { rgba: [10, 27, 44, 255] },
        },
    ])
})

test('integerStyle', () => {
    expect(Style.resolveStyle('zIndex', '-1')).toEqual([
        {
            name: 'zIndex',
            value: '-1',
            parsed: { value: -1 },
        },
    ])
    expect(Style.resolveStyle('zIndex', '2')).toEqual([
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
        Style.resolveStyle('zIndex', 1)
    }).toThrow(/style value must be a string/)
})

test('non-negative number styles reject negative values', () => {
    const styles = ['flexGrow', 'flexShrink', 'aspectRatio']

    for (const name of styles) {
        expect(() => {
            Style.resolveStyle(name, '-1')
        }).toThrow(/expected non-negative value/)

        expect(Style.resolveStyle(name, '1')).toEqual([
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
            Style.resolveStyle(name, -1)
        }).toThrow(/style value must be a string/)
        expect(() => {
            Style.resolveStyle(name, '-1px')
        }).toThrow(/expected non-negative value/)
        expect(() => {
            Style.resolveStyle(name, '-1%')
        }).toThrow(/expected non-negative value/)
        expect(Style.resolveStyle(name, '1px')).toEqual([
            {
                name,
                value: '1px',
                parsed: { value: 1, unit: 'px' },
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

test('resettable unit styles accept unset', () => {
    const styles = [
        'top',
        'left',
        'right',
        'bottom',
        'flexBasis',
        'minWidth',
        'minHeight',
        'maxWidth',
        'maxHeight',
    ]

    for (const name of styles) {
        expect(Style.resolveStyle(name, ' Unset ')).toEqual([
            {
                name,
                value: 'unset',
                parsed: { unit: 'unset' },
            },
        ])
    }

    for (const name of [
        'width',
        'height',
        'paddingTop',
        'paddingLeft',
        'paddingRight',
        'paddingBottom',
        'rowGap',
        'columnGap',
        'gap',
    ]) {
        expect(() => {
            Style.resolveStyle(name, 'unset')
        }).toThrow(/expected px unit/)
    }
})

test('border width styles are px-only and non-negative', () => {
    const styles = ['borderTopWidth', 'borderLeftWidth', 'borderRightWidth', 'borderBottomWidth']

    for (const name of styles) {
        expect(Style.resolveStyle(name, '2px')).toEqual([
            {
                name,
                value: '2px',
                parsed: { value: 2, unit: 'px' },
            },
        ])
        expect(Style.resolveStyle(name, '1px')).toEqual([
            {
                name,
                value: '1px',
                parsed: { value: 1, unit: 'px' },
            },
        ])
        expect(() => {
            Style.resolveStyle(name, '10%')
        }).toThrow(/expected px unit/)
        expect(() => {
            Style.resolveStyle(name, '1')
        }).toThrow(/expected px unit/)
        expect(() => {
            Style.resolveStyle(name, -1)
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
        expect(Style.resolveStyle(name, ' Auto ')).toEqual([
            {
                name,
                value: 'auto',
                parsed: { unit: 'auto' },
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
        ['overflow', 'scroll', 2],
        ['display', 'contents', 2],
        ['direction', 'rtl', 2],
    ]

    for (const [name, value, parsed] of styles) {
        expect(Style.resolveStyle(name, value)).toEqual([
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
