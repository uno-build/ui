import { test, expect } from '@playwright/test'
import Style from '../src/style'

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
    expect(() => {
        Style.resolveStyle('gap', -11)
    }).toThrow(/expected non-negative unit/)
    expect(() => {
        Style.resolveStyle('gap', '-11pX')
    }).toThrow(/expected non-negative unit/)

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
    expect(Style.resolveStyle('gap', '10%')).toEqual({
        name: 'gap',
        value: '10%',
        parsed: { value: 10, unit: '%' },
    })
    expect(() => {
        Style.resolveStyle('gap', '-10%')
    }).toThrow(/expected non-negative unit/)
})

test('flex', () => {
    expect(() => {
        Style.resolveStyle('flex', true)
    }).toThrow(/expected number/)
    expect(() => {
        Style.resolveStyle('flexGrow', -1)
    }).toThrow(/expected non-negative number/)
    expect(() => {
        Style.resolveStyle('flex', '1 2 50%')
    }).toThrow(/expected number/)

    expect(Style.resolveStyle('flex', 1.5)).toEqual({
        name: 'flex',
        value: '1.5',
        parsed: { value: 1.5 },
    })
    expect(Style.resolveStyle('flex', ' 1.5 ')).toEqual({
        name: 'flex',
        value: '1.5',
        parsed: { value: 1.5 },
    })
    expect(Style.resolveStyle('flexGrow', 2)).toEqual({
        name: 'flexGrow',
        value: '2',
        parsed: { value: 2 },
    })
})

test('non-negative number styles reject negative values', () => {
    const styles = ['flexGrow', 'flexShrink', 'aspectRatio']

    for (const name of styles) {
        expect(() => {
            Style.resolveStyle(name, -1)
        }).toThrow(/expected non-negative number/)

        expect(Style.resolveStyle(name, 1)).toEqual({
            name,
            value: '1',
            parsed: { value: 1 },
        })
    }
})

test('non-negative unit styles reject negative values', () => {
    const styles = [
        'borderRadius',
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
        'padding',
        'rowGap',
        'columnGap',
        'gap',
    ]

    for (const name of styles) {
        expect(() => {
            Style.resolveStyle(name, -1)
        }).toThrow(/expected non-negative unit/)
        expect(() => {
            Style.resolveStyle(name, '-1px')
        }).toThrow(/expected non-negative unit/)
        expect(() => {
            Style.resolveStyle(name, '-1%')
        }).toThrow(/expected non-negative unit/)
        expect(Style.resolveStyle(name, 1)).toEqual({
            name,
            value: '1px',
            parsed: { value: 1, unit: 'px' },
        })
    }
})

test('border width styles are px-only and non-negative', () => {
    const styles = [
        'borderTopWidth',
        'borderLeftWidth',
        'borderRightWidth',
        'borderBottomWidth',
        'borderWidth',
    ]

    for (const name of styles) {
        expect(Style.resolveStyle(name, 1)).toEqual({
            name,
            value: '1px',
            parsed: { value: 1, unit: 'px' },
        })
        expect(Style.resolveStyle(name, '1px')).toEqual({
            name,
            value: '1px',
            parsed: { value: 1, unit: 'px' },
        })
        expect(() => {
            Style.resolveStyle(name, '10%')
        }).toThrow(/expected px unit/)
        expect(() => {
            Style.resolveStyle(name, -1)
        }).toThrow(/expected px unit/)
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
        'margin',
        'flexBasis',
        'width',
        'height',
    ]

    for (const name of styles) {
        expect(Style.resolveStyle(name, ' Auto ')).toEqual({
            name,
            value: 'auto',
            parsed: { unit: 'auto' },
        })
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
        expect(Style.resolveStyle(name, value)).toEqual({
            name,
            value,
            parsed: { enum: parsed },
        })
        expect(() => {
            Style.resolveStyle(name, 'invalid-value')
        }).toThrow(/expected one of/)
    }
})
