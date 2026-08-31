import { test, expect } from '@playwright/test'
import Style, { computeStyleValue } from '../src/style'

test('colors', () => {
    const styles = ['backgroundColor', 'color']
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

test('boxShadow', () => {
    expectKeywordUnit('boxShadow', ' unset ', 'unset')
    expectResolved('boxShadow', ' 0PX 4px 12PX 0px ', '0px 4px 12px 0px', {
        box_shadow: {
            offset_x: { value: 0, kind: 'px' },
            offset_y: { value: 4, kind: 'px' },
            blur: { value: 12, kind: 'px' },
            spread: { value: 0, kind: 'px' },
            color: [0, 0, 0, 255],
        },
    })
    expectResolved('boxShadow', '-8px 10px 14px 2px #1234', '-8px 10px 14px 2px #1234', {
        box_shadow: {
            offset_x: { value: -8, kind: 'px' },
            offset_y: { value: 10, kind: 'px' },
            blur: { value: 14, kind: 'px' },
            spread: { value: 2, kind: 'px' },
            color: [17, 34, 51, 68],
        },
    })
    expectResolved('boxShadow', '-0.5rem 1vw 2vh 0.25rem #1234', '-0.5rem 1vw 2vh 0.25rem #1234', {
        box_shadow: {
            offset_x: { value: -0.5, kind: 'rem' },
            offset_y: { value: 1, kind: 'vw' },
            blur: { value: 2, kind: 'vh' },
            spread: { value: 0.25, kind: 'rem' },
            color: [17, 34, 51, 68],
        },
    })
    expectResolved(' box-shadow ', '2px 4px 6px -1px #12345678', '2px 4px 6px -1px #12345678', {
        box_shadow: {
            offset_x: { value: 2, kind: 'px' },
            offset_y: { value: 4, kind: 'px' },
            blur: { value: 6, kind: 'px' },
            spread: { value: -1, kind: 'px' },
            color: [18, 52, 86, 120],
        },
    }, 'boxShadow')

    expectInvalid('boxShadow', 'none', /expected offset-x offset-y blur-radius spread-radius color/)
    expectInvalid('boxShadow', '0px 4px -1px 0px #000000ff', /expected non-negative blur radius/)
    expectInvalid('boxShadow', '0px 4px -1rem 0px #000000ff', /expected non-negative blur radius/)
    expectInvalid('boxShadow', '0px 4px 12px', /expected offset-x offset-y blur-radius spread-radius color/)
    expectInvalid('boxShadow', '0px 4px 12px 0px red', /expected hex color/)
    expectInvalid('boxShadow', '0px 4px 12px 0%', /expected px, rem, vw or vh unit/)
    expectInvalid('boxShadow', '0px 4px 12em 0px', /expected px, rem, vw or vh unit/)
    expectInvalid('boxShadow', true, /expected offset-x offset-y blur-radius spread-radius color/)
})

test('textShadow', () => {
    expectKeywordUnit('textShadow', ' unset ', 'unset')
    expectResolved('textShadow', ' 0PX 4px 12PX ', '0px 4px 12px', {
        text_shadow: {
            offset_x: { value: 0, kind: 'px' },
            offset_y: { value: 4, kind: 'px' },
            blur: { value: 12, kind: 'px' },
            color: [0, 0, 0, 255],
        },
    })
    expectResolved('textShadow', ' -0.5REM 1vw 0.75vh ', '-0.5rem 1vw 0.75vh', {
        text_shadow: {
            offset_x: { value: -0.5, kind: 'rem' },
            offset_y: { value: 1, kind: 'vw' },
            blur: { value: 0.75, kind: 'vh' },
            color: [0, 0, 0, 255],
        },
    })
    expectResolved(' text-shadow ', '-8px 10px 0px #1234', '-8px 10px 0px #1234', {
        text_shadow: {
            offset_x: { value: -8, kind: 'px' },
            offset_y: { value: 10, kind: 'px' },
            blur: { value: 0, kind: 'px' },
            color: [17, 34, 51, 68],
        },
    }, 'textShadow')

    expectInvalid('textShadow', 'none', /expected offset-x offset-y blur-radius color/)
    expectInvalid('textShadow', '0px 4px -1px #000000ff', /expected non-negative blur radius/)
    expectInvalid('textShadow', '0px 4px -1rem #000000ff', /expected non-negative blur radius/)
    expectInvalid('textShadow', '0px 4px', /expected offset-x offset-y blur-radius color/)
    expectInvalid('textShadow', '0px 4px 12px 0px #000000ff', /expected offset-x offset-y blur-radius color/)
    expectInvalid('textShadow', '0px 4px 12px, 1px 1px 2px', /expected offset-x offset-y blur-radius color/)
    expectInvalid('textShadow', '0px 4px 12px red', /expected hex color/)
    expectInvalid('textShadow', '0px 4px 12%', /expected px, rem, vw or vh unit/)
    expectInvalid('textShadow', '0px 4px 12em', /expected px, rem, vw or vh unit/)
    expectInvalid('textShadow', true, /style value must be a string/)
})

test('textStroke', () => {
    expectKeywordUnit('textStroke', ' unset ', 'unset')
    expectResolved('textStroke', ' 4PX #1234 ', '4px #1234', {
        text_stroke: {
            width: { value: 4, kind: 'px' },
            color: [17, 34, 51, 68],
        },
    })
    expectResolved('textStroke', ' 0.25REM #1234 ', '0.25rem #1234', {
        text_stroke: {
            width: { value: 0.25, kind: 'rem' },
            color: [17, 34, 51, 68],
        },
    })
    expectResolved(' text-stroke ', '0.5px #12345678', '0.5px #12345678', {
        text_stroke: {
            width: { value: 0.5, kind: 'px' },
            color: [18, 52, 86, 120],
        },
    }, 'textStroke')

    expectInvalid('textStroke', '4px', /expected width color/)
    expectInvalid('textStroke', '4px #000 extra', /expected width color/)
    expectInvalid('textStroke', '-1px #000', /expected non-negative width/)
    expectInvalid('textStroke', '-1rem #000', /expected non-negative width/)
    expectInvalid('textStroke', '4% #000', /expected px, rem, vw or vh unit/)
    expectInvalid('textStroke', '4em #000', /expected px, rem, vw or vh unit/)
    expectInvalid('textStroke', '4px red', /expected hex color/)
    expectInvalid('textStroke', true, /style value must be a string/)
})

test('backgroundImage', () => {
    expectKeywordUnit('backgroundImage', ' Unset ', 'unset')
    expectResolved('backgroundImage', '/assets/Avatar/Icon.png', '/assets/Avatar/Icon.png', {})
    expectInvalid('backgroundImage', true, /style value must be a string/)
})

test('backgroundSize', () => {
    expectUnit('backgroundSizeWidth', ' 100PX ', '100px', 100, 'px')
    expectUnit('backgroundSizeHeight', '50px', '50px', 50, 'px')
    expectUnit('backgroundSizeWidth', ' 50% ', '50%', 50, '%')
    expectUnit('backgroundSizeHeight', '25%', '25%', 25, '%')
    expectEnum('backgroundSizeWidth', ' Cover ', 'cover', 0)
    expectEnum('backgroundSizeHeight', 'contain', 'contain', 1)
    expectKeywordUnit('backgroundSizeWidth', ' unset ', 'unset')
    expectKeywordUnit('backgroundSizeHeight', 'unset', 'unset')
    expect(Style.resolveStyle('backgroundSize', ' 100PX ').expanded).toEqual([
        {
            name: 'backgroundSizeWidth',
            value: '100px',
            parsed: { value: 100, kind: 'px' },
        },
    ])
    expect(Style.resolveStyle('backgroundSize', '100px 50px').expanded).toEqual([
        {
            name: 'backgroundSizeWidth',
            value: '100px',
            parsed: { value: 100, kind: 'px' },
        },
        {
            name: 'backgroundSizeHeight',
            value: '50px',
            parsed: { value: 50, kind: 'px' },
        },
    ])
    expect(Style.resolveStyle('backgroundSize', '50% 25%').expanded).toEqual([
        {
            name: 'backgroundSizeWidth',
            value: '50%',
            parsed: { value: 50, kind: '%' },
        },
        {
            name: 'backgroundSizeHeight',
            value: '25%',
            parsed: { value: 25, kind: '%' },
        },
    ])
    expect(Style.resolveStyle('backgroundSize', ' cover ').expanded).toEqual([
        {
            name: 'backgroundSizeWidth',
            value: 'cover',
            parsed: { enum: 0 },
        },
        {
            name: 'backgroundSizeHeight',
            value: 'cover',
            parsed: { enum: 0 },
        },
    ])
    expect(Style.resolveStyle('backgroundSize', 'contain').expanded).toEqual([
        {
            name: 'backgroundSizeWidth',
            value: 'contain',
            parsed: { enum: 1 },
        },
        {
            name: 'backgroundSizeHeight',
            value: 'contain',
            parsed: { enum: 1 },
        },
    ])
    expect(Style.resolveStyle('backgroundSize', ' unset ').expanded).toEqual([
        {
            name: 'backgroundSizeWidth',
            value: 'unset',
            parsed: { kind: 'unset' },
        },
        {
            name: 'backgroundSizeHeight',
            value: 'unset',
            parsed: { kind: 'unset' },
        },
    ])
    expectInvalid('backgroundSize', '-1px', /expected non-negative value/)
    expectInvalid('backgroundSize', '-1%', /expected non-negative value/)
    expectInvalid('backgroundSize', 'cover 50px', /expected cover or contain alone/)
    expectInvalid('backgroundSize', '50px contain', /expected cover or contain alone/)
    expectInvalid('backgroundSize', '1px 2px 3px', /expected one or two background size values/)
})

test('backgroundPosition', () => {
    expectUnit('backgroundPositionX', ' 10PX ', '10px', 10, 'px')
    expectUnit('backgroundPositionY', '-20px', '-20px', -20, 'px')
    expectUnit('backgroundPositionX', ' 10% ', '10%', 10, '%')
    expectUnit('backgroundPositionY', '-20%', '-20%', -20, '%')
    expect(Style.resolveStyle('backgroundPosition', ' 10PX 20px ').expanded).toEqual([
        {
            name: 'backgroundPositionX',
            value: '10px',
            parsed: { value: 10, kind: 'px' },
        },
        {
            name: 'backgroundPositionY',
            value: '20px',
            parsed: { value: 20, kind: 'px' },
        },
    ])
    expect(Style.resolveStyle('backgroundPosition', '10px').expanded).toEqual([
        {
            name: 'backgroundPositionX',
            value: '10px',
            parsed: { value: 10, kind: 'px' },
        },
        {
            name: 'backgroundPositionY',
            value: '50%',
            parsed: { value: 50, kind: '%' },
        },
    ])
    expect(Style.resolveStyle('backgroundPosition', '10% 20%').expanded).toEqual([
        {
            name: 'backgroundPositionX',
            value: '10%',
            parsed: { value: 10, kind: '%' },
        },
        {
            name: 'backgroundPositionY',
            value: '20%',
            parsed: { value: 20, kind: '%' },
        },
    ])
    expect(Style.resolveStyle('backgroundPosition', '-10px 20px').expanded).toEqual([
        {
            name: 'backgroundPositionX',
            value: '-10px',
            parsed: { value: -10, kind: 'px' },
        },
        {
            name: 'backgroundPositionY',
            value: '20px',
            parsed: { value: 20, kind: 'px' },
        },
    ])
    expectInvalid('backgroundPositionX', 'center', /expected px unit/)
    expectInvalid('backgroundPositionY', 'center', /expected px unit/)
    expectInvalid('backgroundPosition', 'center', /expected px unit/)
    expectInvalid('backgroundPosition', 'left right', /expected px unit/)
    expectInvalid('backgroundPosition', '1px 2px 3px', /expected one or two background position values/)
})

test('backgroundRepeat', () => {
    expectEnum('backgroundRepeat', ' No-Repeat ', 'no-repeat', 0)
    expectEnum('backgroundRepeat', 'repeat', 'repeat', 1)
    expectEnum('backgroundRepeat', 'repeat-x', 'repeat-x', 2)
    expectEnum('backgroundRepeat', 'repeat-y', 'repeat-y', 3)
    expectInvalid('backgroundRepeat', 'space', /expected one of no-repeat, repeat, repeat-x, repeat-y/)
    expectInvalid('backgroundRepeat', true, /style value must be a string/)
})

test('fontFamily', () => {
    expectResolved('fontFamily', ' Poppins-Regular ', 'Poppins-Regular', {})
    expectResolved(' font-family ', ' ChangaOne-Regular ', 'ChangaOne-Regular', {}, 'fontFamily')
    expectInvalid('fontFamily', true, /style value must be a string/)
})

test('fontSize', () => {
    expectUnit('fontSize', ' 32PX ', '32px', 32, 'px')
    expectResolved(' font-size ', '42.5px', '42.5px', { value: 42.5, kind: 'px' }, 'fontSize')
    expectInvalid('fontSize', '-1px', /expected non-negative value/)
    expectInvalid('fontSize', '10%', /expected px unit/)
    expectInvalid('fontSize', '1em', /expected px unit/)
    expectInvalid('fontSize', true, /style value must be a string/)
})

test('letterSpacing', () => {
    expectUnit('letterSpacing', ' 2PX ', '2px', 2, 'px')
    expectResolved(' letter-spacing ', '-1.5px', '-1.5px', { value: -1.5, kind: 'px' }, 'letterSpacing')
    expect(Style.resolveStyle('letterSpacing', '0.125rem', { root_size: 20 }).expanded).toEqual([
        {
            name: 'letterSpacing',
            value: '0.125rem',
            parsed: { value: 0.125, kind: 'rem' },
        },
    ])

    for (const value of ['10%', '1em', '1', 'normal']) {
        expectInvalid('letterSpacing', value, /expected px unit/)
    }
    expectInvalid('letterSpacing', true, /style value must be a string/)
})

test('computeStyleValue resolves rem with the current root size', () => {
    const style = Style.resolveStyle('letterSpacing', '0.125rem', { root_size: 16 }).expanded[0]
    const px_style = Style.resolveStyle('letterSpacing', '2px', { root_size: 16 }).expanded[0]

    expect(computeStyleValue(style, { root_size: 20 })).toEqual({
        name: 'letterSpacing',
        value: '0.125rem',
        parsed: { value: 2.5, kind: 'px' },
    })
    expect(computeStyleValue(px_style, { root_size: 20 })).toBe(px_style)
})

test('computeStyleValue resolves the units of every shadow and stroke length', () => {
    const context = { root_size: 16, viewport_width: 320, viewport_height: 180 }
    const text_shadow = Style.resolveStyle('textShadow', '0.5rem 10vw 10vh #1234').expanded[0]
    const box_shadow = Style.resolveStyle('boxShadow', '2px 0.5rem 10vw 10vh #1234').expanded[0]
    const text_stroke = Style.resolveStyle('textStroke', '0.25rem #1234').expanded[0]
    const px_shadow = Style.resolveStyle('textShadow', '2px 4px 6px #1234').expanded[0]

    expect(computeStyleValue(text_shadow, context).parsed).toEqual({
        text_shadow: {
            offset_x: { value: 8, kind: 'px' },
            offset_y: { value: 32, kind: 'px' },
            blur: { value: 18, kind: 'px' },
            color: [17, 34, 51, 68],
        },
    })
    expect(computeStyleValue(box_shadow, context).parsed).toEqual({
        box_shadow: {
            offset_x: { value: 2, kind: 'px' },
            offset_y: { value: 8, kind: 'px' },
            blur: { value: 32, kind: 'px' },
            spread: { value: 18, kind: 'px' },
            color: [17, 34, 51, 68],
        },
    })
    expect(computeStyleValue(text_stroke, context).parsed).toEqual({
        text_stroke: {
            width: { value: 4, kind: 'px' },
            color: [17, 34, 51, 68],
        },
    })
    expect(computeStyleValue(px_shadow, context)).toBe(px_shadow)
})

test('computeStyleValue resolves viewport units with the current viewport size', () => {
    const vw_style = Style.resolveStyle('width', '10vw').expanded[0]
    const vh_style = Style.resolveStyle('height', '10vh').expanded[0]
    const px_style = Style.resolveStyle('width', '10px').expanded[0]
    const context = { viewport_width: 320, viewport_height: 180 }

    expect(computeStyleValue(vw_style, context)).toEqual({
        name: 'width',
        value: '10vw',
        parsed: { value: 32, kind: 'px' },
    })
    expect(computeStyleValue(vh_style, context)).toEqual({
        name: 'height',
        value: '10vh',
        parsed: { value: 18, kind: 'px' },
    })
    expect(computeStyleValue(px_style, context)).toBe(px_style)
})

test('rem units', () => {
    const context = { root_size: 16 }
    const styles = [
        'fontSize',
        'lineHeight',
        'borderTopLeftRadius',
        'top',
        'marginTop',
        'width',
        'minWidth',
        'borderTopWidth',
        'backgroundSizeWidth',
        'backgroundPositionX',
    ]

    for (const name of styles) {
        expect(Style.resolveStyle(name, '1rem', context).expanded).toEqual([
            {
                name,
                value: '1rem',
                parsed: { value: 1, kind: 'rem' },
            },
        ])
    }

    expect(Style.resolveStyle('width', ' 1.5REM ', context).expanded).toEqual([
        {
            name: 'width',
            value: '1.5rem',
            parsed: { value: 1.5, kind: 'rem' },
        },
    ])
    expect(Style.resolveStyle('fontSize', '0rem', context).expanded).toEqual([
        {
            name: 'fontSize',
            value: '0rem',
            parsed: { value: 0, kind: 'rem' },
        },
    ])
    expect(Style.resolveStyle('top', '-0.5rem', context).expanded).toEqual([
        {
            name: 'top',
            value: '-0.5rem',
            parsed: { value: -0.5, kind: 'rem' },
        },
    ])
    expect(() => Style.resolveStyle('width', '-1rem', context)).toThrow(/expected non-negative value/)
})

test('rem units in shorthand properties', () => {
    const cases = [
        ['padding', '1rem 2rem'],
        ['margin', '1rem 2rem'],
        ['borderRadius', '1rem 2rem'],
        ['backgroundSize', '1rem 2rem'],
        ['backgroundPosition', '1rem 2rem'],
        ['flex', '0 1 2rem'],
    ]

    for (const [name, value] of cases) {
        const rem_styles = Style.resolveStyle(name, value).expanded.filter((style) => style.parsed.kind === 'rem')

        expect(rem_styles.length, name).toBeGreaterThan(0)
    }

    const border_widths = Style.resolveStyle('border', '0.25rem solid #93c5fd').expanded.filter((style) =>
        style.name.endsWith('Width'),
    )

    expect(border_widths).toEqual(
        ['Top', 'Right', 'Bottom', 'Left'].map((side) => ({
            name: `border${side}Width`,
            value: '0.25rem',
            parsed: { value: 0.25, kind: 'rem' },
        })),
    )
})

test('viewport units', () => {
    const styles = [
        'fontSize',
        'lineHeight',
        'letterSpacing',
        'borderTopLeftRadius',
        'top',
        'marginTop',
        'width',
        'minWidth',
        'borderTopWidth',
        'backgroundSizeWidth',
        'backgroundPositionX',
    ]

    for (const name of styles) {
        for (const unit of ['vw', 'vh']) {
            expect(Style.resolveStyle(name, `1${unit}`).expanded).toEqual([
                {
                    name,
                    value: `1${unit}`,
                    parsed: { value: 1, kind: unit },
                },
            ])
        }
    }

    expect(Style.resolveStyle('width', ' 1.5VW ').expanded).toEqual([
        {
            name: 'width',
            value: '1.5vw',
            parsed: { value: 1.5, kind: 'vw' },
        },
    ])
    expect(Style.resolveStyle('height', ' 2.5VH ').expanded).toEqual([
        {
            name: 'height',
            value: '2.5vh',
            parsed: { value: 2.5, kind: 'vh' },
        },
    ])
    expect(Style.resolveStyle('top', '-0.5vw').expanded[0].parsed).toEqual({ value: -0.5, kind: 'vw' })
    expect(Style.resolveStyle('marginTop', '-0.5vh').expanded[0].parsed).toEqual({ value: -0.5, kind: 'vh' })
    expect(() => Style.resolveStyle('width', '-1vw')).toThrow(/expected non-negative value/)
    expect(() => Style.resolveStyle('height', '-1vh')).toThrow(/expected non-negative value/)
})

test('viewport units in shorthand properties', () => {
    const cases = [
        ['padding', '1vw 2vh'],
        ['margin', '1vw 2vh'],
        ['borderRadius', '1vw 2vh'],
        ['backgroundSize', '10vw 20vh'],
        ['backgroundPosition', '1vw 2vh'],
        ['flex', '0 1 20vw'],
    ]

    for (const [name, value] of cases) {
        const viewport_styles = Style.resolveStyle(name, value).expanded.filter((style) =>
            ['vw', 'vh'].includes(style.parsed.kind),
        )

        expect(viewport_styles.length, name).toBeGreaterThan(0)
    }

    for (const unit of ['vw', 'vh']) {
        const border_widths = Style.resolveStyle('border', `0.25${unit} solid #93c5fd`).expanded.filter((style) =>
            style.name.endsWith('Width'),
        )

        expect(border_widths).toEqual(
            ['Top', 'Right', 'Bottom', 'Left'].map((side) => ({
                name: `border${side}Width`,
                value: `0.25${unit}`,
                parsed: { value: 0.25, kind: unit },
            })),
        )
    }
})

test('lineHeight', () => {
    expectResolved('lineHeight', ' 1.5 ', '1.5', { value: 1.5 })
    expectResolved(' line-height ', '24PX', '24px', { value: 24, kind: 'px' }, 'lineHeight')
    expectKeywordUnit('lineHeight', ' Unset ', 'unset')
    expectInvalid('lineHeight', '-1', /expected non-negative value/)
    expectInvalid('lineHeight', '-1px', /expected non-negative value/)
    expectInvalid('lineHeight', 'normal', /expected number/)
    expectInvalid('lineHeight', '150%', /expected number/)
    expectInvalid('lineHeight', '1em', /expected number/)
    expectInvalid('lineHeight', true, /style value must be a string/)
})

test('textAlign', () => {
    expectEnum('textAlign', ' Left ', 'left', 0)
    expectEnum('textAlign', 'RIGHT', 'right', 1)
    expectEnum('textAlign', 'center', 'center', 2)
    expectResolved(' text-align ', ' Justify ', 'justify', { enum: 3 }, 'textAlign')
    for (const value of ['start', 'end', 'match-parent', 'justify-all', 'unknown']) {
        expectInvalid('textAlign', value, /expected one of left, right, center, justify/)
    }
    expectKeywordUnit('textAlign', ' Unset ', 'unset')
    expectInvalid('textAlign', true, /style value must be a string/)
})

test('whiteSpace', () => {
    expectEnum('whiteSpace', ' Normal ', 'normal', 0)
    expectEnum('whiteSpace', 'NOWRAP', 'nowrap', 1)
    expectResolved(' white-space ', ' Pre-Wrap ', 'pre-wrap', { enum: 2 }, 'whiteSpace')
    expectKeywordUnit('whiteSpace', ' Unset ', 'unset')
    expectInvalid('whiteSpace', 'pre', /expected one of normal, nowrap, pre-wrap/)
    expectInvalid('whiteSpace', true, /style value must be a string/)
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
    const styles = ['overflowX', 'overflowY']
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

    expectResolved('overflow-x', ' Hidden ', 'hidden', { enum: 1 }, 'overflowX')
    expectResolved('overflow-y', 'SCROLL', 'scroll', { enum: 2 }, 'overflowY')
    expect(Style.resolveStyle('overflow', 'SCROLL').expanded).toEqual([
        { name: 'overflowX', value: 'scroll', parsed: { enum: 2 } },
        { name: 'overflowY', value: 'scroll', parsed: { enum: 2 } },
    ])
    expectInvalid('overflow', 'auto', /expected one of visible, hidden, scroll/)
    expectInvalid('overflow', 'clip', /expected one of visible, hidden, scroll/)
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
        expectKeywordUnit(name, ' Unset ', 'unset')

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
    const normalized_name = Style.validateStyle(name, value)

    expect(Style.resolveStyle(normalized_name, value).expanded).toEqual([
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
        const normalized_name = Style.validateStyle(name, value)
        Style.resolveStyle(normalized_name, value)
    }).toThrow(expected_message)
}

function expectUnit(
    name: string,
    value: unknown,
    expectedValue: string,
    parsedValue: number,
    unit: string,
) {
    expectResolved(name, value, expectedValue, { value: parsedValue, kind: unit })
}

function expectKeywordUnit(name: string, value: unknown, keyword: string) {
    expectResolved(name, value, keyword, { kind: keyword })
}

function expectNumber(name: string, value: unknown, expectedValue: string, parsedValue: number) {
    expectResolved(name, value, expectedValue, { value: parsedValue })
}

function expectEnum(name: string, value: unknown, expectedValue: string, parsedValue: number) {
    expectResolved(name, value, expectedValue, { enum: parsedValue })
}
