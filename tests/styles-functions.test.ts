import { expect, test } from '@playwright/test'
import Style, { computeStyleValue } from '../src/style'
import { readCssFunction } from '../src/style/functions'

const CLAMP_VALUE = 'clamp(1px, 2vw, 3rem)'
const CLAMP_PARSED = {
    kind: 'function',
    name: 'clamp',
    arguments: [
        { value: 1, kind: 'px' },
        { value: 2, kind: 'vw' },
        { value: 3, kind: 'rem' },
    ],
}

test('readCssFunction separates only top-level arguments', () => {
    expect(readCssFunction('clamp(1px, min(2px, 3px), 4px)')).toEqual({
        name: 'clamp',
        arguments: ['1px', 'min(2px, 3px)', '4px'],
    })

    for (const value of [
        'clamp()',
        'clamp(1px,,3px)',
        'clamp(1px, 2px, 3px',
        'clamp(1px, 2px), 3px)',
        'clamp(1px, 2px, 3px) extra',
    ]) {
        expect(readCssFunction(value), value).toBeUndefined()
    }
})

test('clamp parses as a generic numeric function', () => {
    expect(Style.resolveStyle('width', ' CLAMP(1px, 2VW, 3REM) ').expanded).toEqual([
        {
            name: 'width',
            value: CLAMP_VALUE,
            parsed: CLAMP_PARSED,
        },
    ])
})

test('clamp is accepted wherever dynamic length units are accepted', () => {
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
        expect(Style.resolveStyle(name, CLAMP_VALUE).expanded).toEqual([
            {
                name,
                value: CLAMP_VALUE,
                parsed: CLAMP_PARSED,
            },
        ])
    }
})

test('clamp works in length shorthands', () => {
    const cases = [
        ['padding', `${CLAMP_VALUE} 4px`],
        ['margin', `${CLAMP_VALUE} 4px`],
        ['borderRadius', `${CLAMP_VALUE} 4px`],
        ['backgroundSize', `${CLAMP_VALUE} 4px`],
        ['backgroundPosition', `${CLAMP_VALUE} 4px`],
        ['flex', `0 1 ${CLAMP_VALUE}`],
    ]

    for (const [name, value] of cases) {
        const function_styles = Style.resolveStyle(name, value).expanded.filter(
            (style) => style.parsed.kind === 'function',
        )

        expect(function_styles.length, name).toBeGreaterThan(0)
    }

    const border_widths = Style.resolveStyle('border', 'CLAMP(1PX, 2VW, 3REM) SOLID #123').expanded.filter((style) =>
        style.name.endsWith('Width'),
    )

    expect(border_widths).toEqual(
        ['Top', 'Right', 'Bottom', 'Left'].map((side) => ({
            name: `border${side}Width`,
            value: CLAMP_VALUE,
            parsed: CLAMP_PARSED,
        })),
    )
})

test('clamp rejects unsupported syntax and units', () => {
    for (const value of [
        'clamp(1px, 2px)',
        'clamp(1px, 2px, 3px, 4px)',
        'clamp(1px, 20%, 3rem)',
        'clamp(1px, 2em, 3rem)',
        'clamp(0, 2vw, 3rem)',
        'clamp(1px, none, 3rem)',
        'clamp(1px, calc(2vw + 1px), 3rem)',
        'clamp(1px, min(2vw, 3rem), 4rem)',
        'min(1px, 2px)',
    ]) {
        expect(() => Style.resolveStyle('width', value), value).toThrow()
    }
})

test('clamp follows the existing negative value restrictions', () => {
    expect(() => Style.resolveStyle('width', 'clamp(-1px, 2vw, 3rem)')).toThrow(/expected non-negative value/)
    expect(Style.resolveStyle('top', 'clamp(-10px, -2vw, 3rem)').expanded[0].parsed).toEqual({
        kind: 'function',
        name: 'clamp',
        arguments: [
            { value: -10, kind: 'px' },
            { value: -2, kind: 'vw' },
            { value: 3, kind: 'rem' },
        ],
    })
})

test('computeStyleValue resolves and clamps numeric function arguments', () => {
    const style = Style.resolveStyle('width', 'clamp(16px, 10vw, 2rem)').expanded[0]

    expect(computeStyleValue(style, { root_size: 16, viewport_width: 100, viewport_height: 200 }).parsed).toEqual({
        value: 16,
        kind: 'px',
    })
    expect(computeStyleValue(style, { root_size: 16, viewport_width: 200, viewport_height: 200 }).parsed).toEqual({
        value: 20,
        kind: 'px',
    })
    expect(computeStyleValue(style, { root_size: 16, viewport_width: 400, viewport_height: 200 }).parsed).toEqual({
        value: 32,
        kind: 'px',
    })

    const conflicting_limits = Style.resolveStyle('width', 'clamp(40px, 30px, 20px)').expanded[0]
    expect(computeStyleValue(conflicting_limits, {}).parsed).toEqual({ value: 40, kind: 'px' })

    const viewport_height = Style.resolveStyle('height', 'clamp(10px, 10vh, 30px)').expanded[0]
    expect(computeStyleValue(viewport_height, { viewport_height: 200 }).parsed).toEqual({ value: 20, kind: 'px' })
})
