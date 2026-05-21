import { test, expect } from '@playwright/test'
import Style from '../src/engine/Style'

test('parseStyleName', () => {
    expect(Style.parseStyleName('backgroundColor')).toBe('backgroundColor')
    expect(Style.parseStyleName(' backgroundColor ')).toBe('backgroundColor')
    expect(Style.parseStyleName('  background-color  ')).toBe('backgroundColor')
    expect(Style.parseStyleName('BACKGROUND-COLOR')).toBe('backgroundColor')
    expect(Style.parseStyleName('Background-Color')).toBe('backgroundColor')
    expect(Style.parseStyleName('Background-Color')).toBe('backgroundColor')
})

test('validateStyle', () => {
    expect(() => {
        Style.validateStyle()
    }).toThrow(/style name must be a string/)
    expect(() => {
        Style.validateStyle('noexist')
    }).toThrow(/unsupported property noexist/)

    expect(() => {
        Style.validateStyle('backgroundColor')
    }).toThrow(/style value for property backgroundColor cannot be undefined/)
})

test('backgroundColor', () => {
    expect(() => {
        Style.validateStyle('backgroundColor', 'invalidcolor')
    }).toThrow(/invalid color value: invalidcolor/)
    expect(() => {
        Style.validateStyle('backgroundColor', '#')
    }).toThrow(/invalid color value/)
    expect(() => {
        Style.validateStyle('backgroundColor', '#1')
    }).toThrow(/invalid color value/)
    expect(() => {
        Style.validateStyle('backgroundColor', '#12')
    }).toThrow(/invalid color value/)
    expect(() => {
        Style.validateStyle('backgroundColor', '#12345')
    }).toThrow(/invalid color value/)

    expect(() => {
        Style.validateStyle('backgroundColor', '#123')
    }).not.toThrow()
    expect(() => {
        Style.validateStyle('backgroundColor', '#1234')
    }).not.toThrow()
    expect(() => {
        Style.validateStyle('backgroundColor', '#123456')
    }).not.toThrow()
    expect(() => {
        Style.validateStyle('backgroundColor', '#12345678')
    }).not.toThrow()
})
