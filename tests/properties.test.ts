import { test, expect } from '@playwright/test'
import { formatPropertyName } from '../src/engine/properties'

test('formatPropertyName', () => {
    expect(formatPropertyName('backgroundColor')).toBe('backgroundColor')
    expect(formatPropertyName(' backgroundColor ')).toBe('backgroundColor')
    expect(formatPropertyName('  background-color   ')).toBe('backgroundColor')
    expect(formatPropertyName('BACKGROUND-COLOR')).toBe('backgroundColor')
    expect(formatPropertyName('Background-Color')).toBe('backgroundColor')
    expect(formatPropertyName('Background-Color')).toBe('backgroundColor')
})
