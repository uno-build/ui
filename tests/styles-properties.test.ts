import { test, expect } from '@playwright/test'
import Style from '../src/style'

test('backgroundColor', () => {
    const styles = ['backgroundColor']
    const validCases = [
        ['#123', '#123', [17, 34, 51, 255]],
        [' #ABC ', '#abc', [170, 187, 204, 255]],
        ['#1234', '#1234', [17, 34, 51, 68]],
        ['#123456', '#123456', [18, 52, 86, 255]],
        ['#12345678', '#12345678', [18, 52, 86, 120]],
    ] as const
    const invalidValues = [
        'invalidcolor',
        'rgb(255, 0, 0)',
        '#',
        '#1',
        '#12',
        '#12345',
        '#1234567',
        ' LightGray ',
        'red',
    ]

    for (const name of styles) {
        for (const [value, expectedValue, rgba] of validCases) {
            expectResolved(name, value, expectedValue, { rgba })
        }

        for (const value of invalidValues) {
            expectInvalid(name, value, /expected hex color/)
        }

        expectInvalid(name, true, /expected hex color/)
    }
})

test('opacity', () => {
    const valid_cases = [
        ['0', '0', 0],
        ['0.5', '0.5', 0.5],
        ['.5', '0.5', 0.5],
        ['1', '1', 1],
    ] as const
    const invalid_cases = [
        ['-0.1', /expected non-negative value/],
        ['1.1', /expected value between 0 and 1/],
        ['50%', /expected number/],
        ['auto', /expected number/],
        [true, /expected number/],
    ] as const

    for (const [value, expected_value, parsed_value] of valid_cases) {
        expectResolved('opacity', value, expected_value, { value: parsed_value })
    }

    for (const [value, message] of invalid_cases) {
        expectInvalid('opacity', value, message)
    }
})

test('border corner radius', () => {
    const styles = [
        'borderTopLeftRadius',
        'borderTopRightRadius',
        'borderBottomLeftRadius',
        'borderBottomRightRadius',
    ]
    const validCases = [
        ['0px', '0px', 0, 'px'],
        ['4px', '4px', 4, 'px'],
        [' 4PX ', '4px', 4, 'px'],
        ['12.5px', '12.5px', 12.5, 'px'],
        ['50%', '50%', 50, '%'],
    ] as const
    const invalidCases = [
        [-1, /expected px unit/],
        ['-1px', /expected non-negative value/],
        ['-1%', /expected non-negative value/],
        ['auto', /expected px unit/],
        ['none', /expected px unit/],
        ['4em', /expected px unit/],
        [true, /expected px unit/],
    ] as const

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue, unit] of validCases) {
            expectUnit(name, value, expectedValue, parsedValue, unit)
        }

        for (const [value, message] of invalidCases) {
            expectInvalid(name, value, message)
        }
    }
})

test('position', () => {
    const styles = ['position']
    const validCases = [
        ['static', 'static', 0],
        [' Relative ', 'relative', 1],
        ['ABSOLUTE', 'absolute', 2],
    ] as const

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue] of validCases) {
            expectEnum(name, value, expectedValue, parsedValue)
        }

        expectInvalid(name, 'fixed', /expected one of static, relative, absolute/)
        expectInvalid(name, 'sticky', /expected one of static, relative, absolute/)
    }
})

test('alignContent', () => {
    const styles = ['alignContent']
    const validCases = [
        ['flex-start', 'flex-start', 1],
        [' Center ', 'center', 2],
        ['flex-end', 'flex-end', 3],
        ['stretch', 'stretch', 4],
        ['baseline', 'baseline', 5],
        ['space-between', 'space-between', 6],
        ['space-around', 'space-around', 7],
        ['SPACE-EVENLY', 'space-evenly', 8],
    ] as const

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue] of validCases) {
            expectEnum(name, value, expectedValue, parsedValue)
        }

        expectInvalid(name, 'normal', /expected one of/)
        expectInvalid(name, 'auto', /expected one of/)
    }
})

test('alignItems', () => {
    const styles = ['alignItems']
    const validCases = [
        ['normal', 'normal', 0],
        ['flex-start', 'flex-start', 1],
        [' Center ', 'center', 2],
        ['flex-end', 'flex-end', 3],
        ['stretch', 'stretch', 4],
        ['BASELINE', 'baseline', 5],
    ] as const

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue] of validCases) {
            expectEnum(name, value, expectedValue, parsedValue)
        }

        expectInvalid(name, 'auto', /expected one of/)
        expectInvalid(name, 'space-between', /expected one of/)
    }
})

test('alignSelf', () => {
    const styles = ['alignSelf']
    const validCases = [
        ['auto', 'auto', 0],
        ['normal', 'normal', 0],
        ['flex-start', 'flex-start', 1],
        [' Center ', 'center', 2],
        ['flex-end', 'flex-end', 3],
        ['stretch', 'stretch', 4],
        ['BASELINE', 'baseline', 5],
    ] as const

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue] of validCases) {
            expectEnum(name, value, expectedValue, parsedValue)
        }

        expectInvalid(name, 'space-between', /expected one of/)
        expectInvalid(name, 'space-evenly', /expected one of/)
    }
})

test('flexDirection', () => {
    const styles = ['flexDirection']
    const validCases = [
        ['column', 'column', 0],
        ['column-reverse', 'column-reverse', 1],
        [' Row ', 'row', 2],
        ['ROW-REVERSE', 'row-reverse', 3],
    ] as const

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue] of validCases) {
            expectEnum(name, value, expectedValue, parsedValue)
        }

        expectInvalid(name, 'nowrap', /expected one of/)
        expectInvalid(name, 'horizontal', /expected one of/)
    }
})

test('flexWrap', () => {
    const styles = ['flexWrap']
    const validCases = [
        ['nowrap', 'nowrap', 0],
        [' Wrap ', 'wrap', 1],
        ['WRAP-REVERSE', 'wrap-reverse', 2],
    ] as const

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue] of validCases) {
            expectEnum(name, value, expectedValue, parsedValue)
        }

        expectInvalid(name, 'no-wrap', /expected one of nowrap, wrap, wrap-reverse/)
        expectInvalid(name, 'row', /expected one of nowrap, wrap, wrap-reverse/)
    }
})

test('justifyContent', () => {
    const styles = ['justifyContent']
    const validCases = [
        ['flex-start', 'flex-start', 0],
        [' Center ', 'center', 1],
        ['flex-end', 'flex-end', 2],
        ['space-between', 'space-between', 3],
        ['space-around', 'space-around', 4],
        ['SPACE-EVENLY', 'space-evenly', 5],
    ] as const

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue] of validCases) {
            expectEnum(name, value, expectedValue, parsedValue)
        }

        expectInvalid(name, 'baseline', /expected one of/)
        expectInvalid(name, 'stretch', /expected one of/)
    }
})

test('boxSizing', () => {
    const styles = ['boxSizing']
    const validCases = [
        ['border-box', 'border-box', 0],
        [' CONTENT-BOX ', 'content-box', 1],
    ] as const

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue] of validCases) {
            expectEnum(name, value, expectedValue, parsedValue)
        }

        expectInvalid(name, 'borderBox', /expected one of/)
        expectInvalid(name, 'padding-box', /expected one of/)
    }
})

test('overflow', () => {
    const styles = ['overflow']
    const validCases = [
        ['visible', 'visible', 0],
        [' Hidden ', 'hidden', 1],
        ['SCROLL', 'scroll', 2],
    ] as const

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue] of validCases) {
            expectEnum(name, value, expectedValue, parsedValue)
        }

        expectInvalid(name, 'auto', /expected one of visible, hidden, scroll/)
        expectInvalid(name, 'clip', /expected one of visible, hidden, scroll/)
    }
})

test('display', () => {
    const styles = ['display']
    const validCases = [
        ['flex', 'flex', 0],
        [' None ', 'none', 1],
        ['CONTENTS', 'contents', 2],
    ] as const

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue] of validCases) {
            expectEnum(name, value, expectedValue, parsedValue)
        }

        expectInvalid(name, 'block', /expected one of flex, none, contents/)
        expectInvalid(name, 'inline-flex', /expected one of flex, none, contents/)
    }
})

test('direction', () => {
    const styles = ['direction']
    const validCases = [
        ['inherit', 'inherit', 0],
        [' LTR ', 'ltr', 1],
        ['RTL', 'rtl', 2],
    ] as const

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue] of validCases) {
            expectEnum(name, value, expectedValue, parsedValue)
        }

        expectInvalid(name, 'auto', /expected one of inherit, ltr, rtl/)
        expectInvalid(name, 'initial', /expected one of inherit, ltr, rtl/)
    }
})

test('maxWidth, maxHeight', () => {
    const styles = ['maxWidth', 'maxHeight']
    const validUnitCases = [
        ['0px', '0px', 0, 'px'],
        ['20px', '20px', 20, 'px'],
        [' 20PX ', '20px', 20, 'px'],
        ['75%', '75%', 75, '%'],
    ] as const
    const invalidCases = [
        [-1, /expected px unit/],
        ['-1px', /expected non-negative value/],
        ['-1%', /expected non-negative value/],
        ['auto', /expected px unit/],
        ['none', /expected px unit/],
        ['20em', /expected px unit/],
    ] as const

    for (const name of styles) {
        expectKeywordUnit(name, ' Unset ', 'unset')

        for (const [value, expectedValue, parsedValue, unit] of validUnitCases) {
            expectUnit(name, value, expectedValue, parsedValue, unit)
        }

        for (const [value, message] of invalidCases) {
            expectInvalid(name, value, message)
        }
    }
})

test('top, left, right, bottom', () => {
    const styles = ['top', 'left', 'right', 'bottom']
    const validUnitCases = [
        ['8px', '8px', 8, 'px'],
        [' 8PX ', '8px', 8, 'px'],
        ['12.5%', '12.5%', 12.5, '%'],
        ['-3px', '-3px', -3, 'px'],
        ['-4px', '-4px', -4, 'px'],
        ['-5%', '-5%', -5, '%'],
    ] as const
    const invalidValues = [true, '12em', 'none', 'inherit']

    for (const name of styles) {
        expectKeywordUnit(name, ' Auto ', 'auto')
        expectKeywordUnit(name, ' Unset ', 'unset')

        for (const [value, expectedValue, parsedValue, unit] of validUnitCases) {
            expectUnit(name, value, expectedValue, parsedValue, unit)
        }

        for (const value of invalidValues) {
            expectInvalid(name, value, /expected px unit/)
        }
    }
})

test('marginTop, marginLeft, marginRight, marginBottom', () => {
    const styles = ['marginTop', 'marginLeft', 'marginRight', 'marginBottom']
    const validUnitCases = [
        ['8px', '8px', 8, 'px'],
        [' 8PX ', '8px', 8, 'px'],
        ['12.5%', '12.5%', 12.5, '%'],
        ['-3px', '-3px', -3, 'px'],
        ['-4px', '-4px', -4, 'px'],
        ['-5%', '-5%', -5, '%'],
    ] as const
    const invalidValues = [true, '12em', 'none', 'unset', 'inherit']

    for (const name of styles) {
        expectKeywordUnit(name, ' Auto ', 'auto')

        for (const [value, expectedValue, parsedValue, unit] of validUnitCases) {
            expectUnit(name, value, expectedValue, parsedValue, unit)
        }

        for (const value of invalidValues) {
            expectInvalid(name, value, /expected px unit/)
        }
    }
})

test('flexGrow, flexShrink, aspectRatio', () => {
    const styles = ['flexGrow', 'flexShrink', 'aspectRatio']
    const validCases = [
        ['0', '0', 0],
        ['1.5', '1.5', 1.5],
        [' 2.25 ', '2.25', 2.25],
    ] as const
    const expectedNumberFailures = [true, '1 2', 'auto', Number.POSITIVE_INFINITY, NaN]
    const expectedNonNegativeFailures = ['-1']

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue] of validCases) {
            expectNumber(name, value, expectedValue, parsedValue)
        }

        expectKeywordUnit(name, ' Unset ', 'unset')

        for (const value of expectedNumberFailures) {
            expectInvalid(name, value, /expected number/)
        }

        for (const value of expectedNonNegativeFailures) {
            expectInvalid(name, value, /expected non-negative value/)
        }
    }
})

test('flexBasis', () => {
    const styles = ['flexBasis']
    const validUnitCases = [
        ['0px', '0px', 0, 'px'],
        ['10px', '10px', 10, 'px'],
        [' 10PX ', '10px', 10, 'px'],
        ['33.3%', '33.3%', 33.3, '%'],
    ] as const
    const invalidCases = [
        [-1, /expected px unit/],
        ['-1px', /expected non-negative value/],
        ['-1%', /expected non-negative value/],
        [true, /expected px unit/],
        ['12em', /expected px unit/],
        ['none', /expected px unit/],
    ] as const

    for (const name of styles) {
        expectKeywordUnit(name, ' Auto ', 'auto')
        expectKeywordUnit(name, ' Unset ', 'unset')

        for (const [value, expectedValue, parsedValue, unit] of validUnitCases) {
            expectUnit(name, value, expectedValue, parsedValue, unit)
        }

        for (const [value, message] of invalidCases) {
            expectInvalid(name, value, message)
        }
    }
})

test('width, height', () => {
    const styles = ['width', 'height']
    const validUnitCases = [
        ['0px', '0px', 0, 'px'],
        ['10px', '10px', 10, 'px'],
        [' 10PX ', '10px', 10, 'px'],
        ['33.3%', '33.3%', 33.3, '%'],
    ] as const
    const invalidCases = [
        [-1, /expected px unit/],
        ['-1px', /expected non-negative value/],
        ['-1%', /expected non-negative value/],
        [true, /expected px unit/],
        ['12em', /expected px unit/],
        ['none', /expected px unit/],
        ['unset', /expected px unit/],
    ] as const

    for (const name of styles) {
        expectKeywordUnit(name, ' Auto ', 'auto')

        for (const [value, expectedValue, parsedValue, unit] of validUnitCases) {
            expectUnit(name, value, expectedValue, parsedValue, unit)
        }

        for (const [value, message] of invalidCases) {
            expectInvalid(name, value, message)
        }
    }
})

test('minWidth, minHeight', () => {
    const styles = ['minWidth', 'minHeight']
    const validCases = [
        ['0px', '0px', 0, 'px'],
        ['6px', '6px', 6, 'px'],
        [' 6PX ', '6px', 6, 'px'],
        ['12.5%', '12.5%', 12.5, '%'],
    ] as const
    const invalidCases = [
        [-1, /expected px unit/],
        ['-1px', /expected non-negative value/],
        ['-1%', /expected non-negative value/],
        ['auto', /expected px unit/],
        ['none', /expected px unit/],
        ['6em', /expected px unit/],
        [false, /expected px unit/],
    ] as const

    for (const name of styles) {
        expectKeywordUnit(name, ' Unset ', 'unset')

        for (const [value, expectedValue, parsedValue, unit] of validCases) {
            expectUnit(name, value, expectedValue, parsedValue, unit)
        }

        for (const [value, message] of invalidCases) {
            expectInvalid(name, value, message)
        }
    }
})

test('paddingTop, paddingLeft, paddingRight, paddingBottom, rowGap, columnGap, gap', () => {
    const styles = [
        'paddingTop',
        'paddingLeft',
        'paddingRight',
        'paddingBottom',
        'rowGap',
        'columnGap',
        'gap',
    ]
    const validCases = [
        ['0px', '0px', 0, 'px'],
        ['6px', '6px', 6, 'px'],
        [' 6PX ', '6px', 6, 'px'],
        ['12.5%', '12.5%', 12.5, '%'],
    ] as const
    const invalidCases = [
        [-1, /expected px unit/],
        ['-1px', /expected non-negative value/],
        ['-1%', /expected non-negative value/],
        ['auto', /expected px unit/],
        ['none', /expected px unit/],
        ['unset', /expected px unit/],
        ['6em', /expected px unit/],
        [false, /expected px unit/],
    ] as const

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue, unit] of validCases) {
            expectUnit(name, value, expectedValue, parsedValue, unit)
        }

        for (const [value, message] of invalidCases) {
            expectInvalid(name, value, message)
        }
    }
})

test('borderTopWidth, borderLeftWidth, borderRightWidth, borderBottomWidth', () => {
    const styles = ['borderTopWidth', 'borderLeftWidth', 'borderRightWidth', 'borderBottomWidth']
    const validCases = [
        ['0px', '0px', 0, 'px'],
        ['1px', '1px', 1, 'px'],
        [' 1PX ', '1px', 1, 'px'],
        ['2.5px', '2.5px', 2.5, 'px'],
    ] as const
    const invalidCases = [
        [-1, /expected px unit/],
        ['-1px', /expected non-negative value/],
        ['10%', /expected px unit/],
        ['-10%', /expected non-negative value/],
        ['thin', /expected px unit/],
        ['1px solid #333', /expected px unit/],
        ['1em', /expected px unit/],
        ['1', /expected px unit/],
    ] as const

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue, unit] of validCases) {
            expectUnit(name, value, expectedValue, parsedValue, unit)
        }

        for (const [value, message] of invalidCases) {
            expectInvalid(name, value, message)
        }
    }
})

function expectResolved(
    name: string,
    value: unknown,
    expectedValue: string,
    parsed: Record<string, unknown>,
    expectedName = name,
) {
    expect(Style.resolveStyle(name, value)).toEqual([
        {
            name: expectedName,
            value: expectedValue,
            parsed,
        },
    ])
}

function expectInvalid(name: string, value: unknown, message: RegExp) {
    const expected_message = typeof value === 'string' ? message : /style value must be a string/

    expect(() => {
        Style.resolveStyle(name, value)
    }).toThrow(expected_message)
}

function expectUnit(
    name: string,
    value: unknown,
    expectedValue: string,
    parsedValue: number,
    unit: string,
) {
    expectResolved(name, value, expectedValue, { value: parsedValue, unit })
}

function expectKeywordUnit(name: string, value: unknown, keyword: string) {
    expectResolved(name, value, keyword, { unit: keyword })
}

function expectNumber(name: string, value: unknown, expectedValue: string, parsedValue: number) {
    expectResolved(name, value, expectedValue, { value: parsedValue })
}

function expectEnum(name: string, value: unknown, expectedValue: string, parsedValue: number) {
    expectResolved(name, value, expectedValue, { enum: parsedValue })
}
