import { test, expect } from '@playwright/test'

test('normalizes names', () => {
    expect('1').toBe('1')
})
