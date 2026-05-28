import { test, expect } from '@playwright/test'
import Style from '../src/style'

test('backgroundColor', () => {
    const styles = ['backgroundColor']
    const validCases = [
        ['#123', '#123', [17 / 255, 34 / 255, 51 / 255, 1]],
        [' #ABC ', '#abc', [170 / 255, 187 / 255, 204 / 255, 1]],
        ['#1234', '#1234', [17 / 255, 34 / 255, 51 / 255, 68 / 255]],
        ['#123456', '#123456', [18 / 255, 52 / 255, 86 / 255, 1]],
        ['#12345678', '#12345678', [18 / 255, 52 / 255, 86 / 255, 120 / 255]],
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
        true,
    ]

    for (const name of styles) {
        for (const [value, expectedValue, rgba] of validCases) {
            expectResolved(name, value, expectedValue, { rgba })
        }

        for (const value of invalidValues) {
            expectInvalid(name, value, /expected hex color/)
        }
    }
})

test('borderRadius', () => {
    const styles = ['borderRadius']
    const validCases = [
        [0, '0px', 0, 'px'],
        ['4', '4px', 4, 'px'],
        [' 4PX ', '4px', 4, 'px'],
        ['12.5px', '12.5px', 12.5, 'px'],
        ['50%', '50%', 50, '%'],
    ] as const
    const invalidCases = [
        [-1, /expected non-negative unit/],
        ['-1px', /expected non-negative unit/],
        ['-1%', /expected non-negative unit/],
        ['auto', /expected px or % unit/],
        ['none', /expected px or % unit/],
        ['4em', /expected px or % unit/],
        [true, /expected px or % unit/],
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

        expectInvalid(
            name,
            'fixed',
            /expected one of static, relative, absolute/,
        )
        expectInvalid(
            name,
            'sticky',
            /expected one of static, relative, absolute/,
        )
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

        expectInvalid(
            name,
            'no-wrap',
            /expected one of nowrap, wrap, wrap-reverse/,
        )
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
        expectInvalid(
            name,
            'inline-flex',
            /expected one of flex, none, contents/,
        )
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
        [0, '0px', 0, 'px'],
        ['20', '20px', 20, 'px'],
        [' 20PX ', '20px', 20, 'px'],
        ['75%', '75%', 75, '%'],
    ] as const
    const invalidCases = [
        [-1, /expected non-negative unit/],
        ['-1px', /expected non-negative unit/],
        ['-1%', /expected non-negative unit/],
        ['auto', /expected px or % unit/],
        ['none', /expected px or % unit/],
        ['20em', /expected px or % unit/],
    ] as const

    for (const name of styles) {
        expectKeywordUnit(name, ' Unset ', 'unset')

        for (const [
            value,
            expectedValue,
            parsedValue,
            unit,
        ] of validUnitCases) {
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
        [8, '8px', 8, 'px'],
        ['8', '8px', 8, 'px'],
        [' 8PX ', '8px', 8, 'px'],
        ['12.5%', '12.5%', 12.5, '%'],
        [-3, '-3px', -3, 'px'],
        ['-4px', '-4px', -4, 'px'],
        ['-5%', '-5%', -5, '%'],
    ] as const
    const invalidValues = [true, '12em', 'none', 'inherit']

    for (const name of styles) {
        expectKeywordUnit(name, ' Auto ', 'auto')
        expectKeywordUnit(name, ' Unset ', 'unset')

        for (const [
            value,
            expectedValue,
            parsedValue,
            unit,
        ] of validUnitCases) {
            expectUnit(name, value, expectedValue, parsedValue, unit)
        }

        for (const value of invalidValues) {
            expectInvalid(name, value, /expected px or % unit/)
        }
    }
})

test('marginTop, marginLeft, marginRight, marginBottom, margin', () => {
    const styles = [
        'marginTop',
        'marginLeft',
        'marginRight',
        'marginBottom',
        'margin',
    ]
    const validUnitCases = [
        [8, '8px', 8, 'px'],
        ['8', '8px', 8, 'px'],
        [' 8PX ', '8px', 8, 'px'],
        ['12.5%', '12.5%', 12.5, '%'],
        [-3, '-3px', -3, 'px'],
        ['-4px', '-4px', -4, 'px'],
        ['-5%', '-5%', -5, '%'],
    ] as const
    const invalidValues = [true, '12em', 'none', 'unset', 'inherit']

    for (const name of styles) {
        expectKeywordUnit(name, ' Auto ', 'auto')

        for (const [
            value,
            expectedValue,
            parsedValue,
            unit,
        ] of validUnitCases) {
            expectUnit(name, value, expectedValue, parsedValue, unit)
        }

        for (const value of invalidValues) {
            expectInvalid(name, value, /expected px or % unit/)
        }
    }
})

test('flex, flexGrow, flexShrink, aspectRatio', () => {
    const styles = ['flex', 'flexGrow', 'flexShrink', 'aspectRatio']
    const validCases = [
        [0, '0', 0],
        [1.5, '1.5', 1.5],
        [' 2.25 ', '2.25', 2.25],
    ] as const
    const expectedNumberFailures = [
        true,
        '1 2',
        'auto',
        Number.POSITIVE_INFINITY,
        NaN,
    ]
    const expectedNonNegativeFailures = [-1, '-1']

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue] of validCases) {
            expectNumber(name, value, expectedValue, parsedValue)
        }

        for (const value of expectedNumberFailures) {
            expectInvalid(name, value, /expected number/)
        }

        for (const value of expectedNonNegativeFailures) {
            expectInvalid(name, value, /expected non-negative number/)
        }
    }
})

test('flexBasis', () => {
    const styles = ['flexBasis']
    const validUnitCases = [
        [0, '0px', 0, 'px'],
        ['10', '10px', 10, 'px'],
        [' 10PX ', '10px', 10, 'px'],
        ['33.3%', '33.3%', 33.3, '%'],
    ] as const
    const invalidCases = [
        [-1, /expected non-negative unit/],
        ['-1px', /expected non-negative unit/],
        ['-1%', /expected non-negative unit/],
        [true, /expected px or % unit/],
        ['12em', /expected px or % unit/],
        ['none', /expected px or % unit/],
    ] as const

    for (const name of styles) {
        expectKeywordUnit(name, ' Auto ', 'auto')
        expectKeywordUnit(name, ' Unset ', 'unset')

        for (const [
            value,
            expectedValue,
            parsedValue,
            unit,
        ] of validUnitCases) {
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
        [0, '0px', 0, 'px'],
        ['10', '10px', 10, 'px'],
        [' 10PX ', '10px', 10, 'px'],
        ['33.3%', '33.3%', 33.3, '%'],
    ] as const
    const invalidCases = [
        [-1, /expected non-negative unit/],
        ['-1px', /expected non-negative unit/],
        ['-1%', /expected non-negative unit/],
        [true, /expected px or % unit/],
        ['12em', /expected px or % unit/],
        ['none', /expected px or % unit/],
        ['unset', /expected px or % unit/],
    ] as const

    for (const name of styles) {
        expectKeywordUnit(name, ' Auto ', 'auto')

        for (const [
            value,
            expectedValue,
            parsedValue,
            unit,
        ] of validUnitCases) {
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
        [0, '0px', 0, 'px'],
        ['6', '6px', 6, 'px'],
        [' 6PX ', '6px', 6, 'px'],
        ['12.5%', '12.5%', 12.5, '%'],
    ] as const
    const invalidCases = [
        [-1, /expected non-negative unit/],
        ['-1px', /expected non-negative unit/],
        ['-1%', /expected non-negative unit/],
        ['auto', /expected px or % unit/],
        ['none', /expected px or % unit/],
        ['6em', /expected px or % unit/],
        [false, /expected px or % unit/],
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

test('paddingTop, paddingLeft, paddingRight, paddingBottom, padding, rowGap, columnGap, gap', () => {
    const styles = [
        'paddingTop',
        'paddingLeft',
        'paddingRight',
        'paddingBottom',
        'padding',
        'rowGap',
        'columnGap',
        'gap',
    ]
    const validCases = [
        [0, '0px', 0, 'px'],
        ['6', '6px', 6, 'px'],
        [' 6PX ', '6px', 6, 'px'],
        ['12.5%', '12.5%', 12.5, '%'],
    ] as const
    const invalidCases = [
        [-1, /expected non-negative unit/],
        ['-1px', /expected non-negative unit/],
        ['-1%', /expected non-negative unit/],
        ['auto', /expected px or % unit/],
        ['none', /expected px or % unit/],
        ['unset', /expected px or % unit/],
        ['6em', /expected px or % unit/],
        [false, /expected px or % unit/],
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

test('borderTopWidth, borderLeftWidth, borderRightWidth, borderBottomWidth, borderWidth', () => {
    const styles = [
        'borderTopWidth',
        'borderLeftWidth',
        'borderRightWidth',
        'borderBottomWidth',
        'borderWidth',
    ]
    const validCases = [
        [0, '0px', 0, 'px'],
        ['1', '1px', 1, 'px'],
        [' 1PX ', '1px', 1, 'px'],
        ['2.5px', '2.5px', 2.5, 'px'],
    ] as const
    const invalidValues = [
        -1,
        '-1px',
        '10%',
        '-10%',
        'thin',
        '1px solid #333',
        '1em',
    ]

    for (const name of styles) {
        for (const [value, expectedValue, parsedValue, unit] of validCases) {
            expectUnit(name, value, expectedValue, parsedValue, unit)
        }

        for (const value of invalidValues) {
            expectInvalid(name, value, /expected px unit/)
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
    expect(Style.resolveStyle(name, value)).toEqual({
        name: expectedName,
        value: expectedValue,
        parsed,
    })
}

function expectInvalid(name: string, value: unknown, message: RegExp) {
    expect(() => {
        Style.resolveStyle(name, value)
    }).toThrow(message)
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

function expectNumber(
    name: string,
    value: unknown,
    expectedValue: string,
    parsedValue: number,
) {
    expectResolved(name, value, expectedValue, { value: parsedValue })
}

function expectEnum(
    name: string,
    value: unknown,
    expectedValue: string,
    parsedValue: number,
) {
    expectResolved(name, value, expectedValue, { enum: parsedValue })
}
