import { test, expect } from '@playwright/test'
import Style from '../src/engine/Style'

test('normalizeStyleName', () => {
    expect(Style.normalizeStyleName('backgroundColor')).toBe('backgroundColor')
    expect(Style.normalizeStyleName(' backgroundColor ')).toBe(
        'backgroundColor',
    )
    expect(Style.normalizeStyleName('  background-color  ')).toBe(
        'backgroundColor',
    )
    expect(Style.normalizeStyleName('BACKGROUND-COLOR')).toBe(
        'backgroundColor',
    )
    expect(Style.normalizeStyleName('Background-Color')).toBe(
        'backgroundColor',
    )
    expect(Style.normalizeStyleName('Background-Color')).toBe(
        'backgroundColor',
    )
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

    expect(Style.resolveStyle(' background-color ', ' #ABC ')).toEqual({
        name: 'backgroundColor',
        value: '#abc',
    })
    expect(Style.resolveStyle('Position', ' Absolute ')).toEqual({
        name: 'position',
        value: 'absolute',
    })
    expect(Style.resolveStyle('POSITION', 'relative')).toEqual({
        name: 'position',
        value: 'relative',
    })
    expect(Style.resolveStyle('BACKGROUNDCOLOR', '#ABC')).toEqual({
        name: 'backgroundColor',
        value: '#abc',
    })
})

test('backgroundColor', () => {
    expect(() => {
        Style.resolveStyle('backgroundColor', 'invalidcolor')
    }).toThrow(
        /invalid value 'invalidcolor' for property 'backgroundColor': expected color/,
    )
    expect(() => {
        Style.resolveStyle('backgroundColor', '#')
    }).toThrow(/expected color/)
    expect(() => {
        Style.resolveStyle('backgroundColor', '#1')
    }).toThrow(/expected color/)
    expect(() => {
        Style.resolveStyle('backgroundColor', '#12')
    }).toThrow(/expected color/)
    expect(() => {
        Style.resolveStyle('backgroundColor', '#12345')
    }).toThrow(/expected color/)

    expect(Style.resolveStyle('backgroundColor', '#123')).toEqual({
        name: 'backgroundColor',
        value: '#123',
    })
    expect(Style.resolveStyle('backgroundColor', '#1234')).toEqual({
        name: 'backgroundColor',
        value: '#1234',
    })
    expect(Style.resolveStyle('backgroundColor', '#123456')).toEqual({
        name: 'backgroundColor',
        value: '#123456',
    })
    expect(Style.resolveStyle('backgroundColor', '#12345678')).toEqual({
        name: 'backgroundColor',
        value: '#12345678',
    })
    expect(Style.resolveStyle('backgroundColor', ' LightGray ')).toEqual({
        name: 'backgroundColor',
        value: 'lightgray',
    })
})

test('position', () => {
    expect(Style.resolveStyle('position', 'relative')).toEqual({
        name: 'position',
        value: 'relative',
    })
    expect(() => {
        Style.resolveStyle('position', 'fixed')
    }).toThrow(/expected one of static, relative, absolute/)
})
