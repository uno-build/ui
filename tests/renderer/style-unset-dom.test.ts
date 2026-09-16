import { expect, test } from '@playwright/test'
import { STYLE_CASES, STYLE_NAMES, STYLE_VALUES } from '../utils/style-unset-cases'

const TEST_PAGE_URL = '/tests/renderer/'

test('Dom unset restores the undefined state for all 81 styles', async ({ page }) => {
    expect(STYLE_NAMES).toHaveLength(81)
    expect(Object.keys(STYLE_VALUES)).toEqual(STYLE_NAMES)

    await page.goto(TEST_PAGE_URL)

    const states = await page.evaluate(
        async ({ style_cases }) => {
            const { UIDom, ResourcesDom } = await import('/tests/renderer/browser-entry.ts')
            const css_property = {
                textStroke: 'webkitTextStroke',
                backgroundSizeWidth: 'backgroundSize',
                backgroundSizeHeight: 'backgroundSize',
            }
            const border_setup_names = new Set([
                'borderTopColor',
                'borderLeftColor',
                'borderRightColor',
                'borderBottomColor',
                'borderTopWidth',
                'borderLeftWidth',
                'borderRightWidth',
                'borderBottomWidth',
            ])
            const states = []

            for (const { name, value } of style_cases) {
                const canvas = document.createElement('div')
                canvas.style.width = '400px'
                canvas.style.height = '300px'
                canvas.style.display = 'flex'
                canvas.style.color = '#000000'
                document.body.appendChild(canvas)

                const resources = ResourcesDom.create({ canvas })
                resources.registerImage('/examples/assets/images/coin.png', { src: '/examples/assets/images/coin.png' })

                const { ui } = await UIDom.create({ resources })
                const node = ui.create()
                ui.root.add(node)
                ui.update()

                const element = canvas.querySelector('#node-1') as HTMLElement
                if (border_setup_names.has(name)) {
                    element.style.borderStyle = 'solid'
                }

                const property = css_property[name] ?? name
                const read = () => getComputedStyle(element)[property]
                const undefined_value = read()

                node.style(name, value)
                ui.update()
                const defined_value = read()

                node.style(name, 'unset')
                ui.update()
                const unset_value = read()

                states.push({ name, undefined_value, defined_value, unset_value })
                ui.destroy()
                canvas.remove()
            }

            return states
        },
        {
            style_cases: STYLE_CASES,
        },
    )

    expect(states).toHaveLength(81)
    for (const { name, undefined_value, defined_value, unset_value } of states) {
        expect(defined_value, `${name}: defined`).not.toBe(undefined_value)
        expect(unset_value, `${name}: unset`).toBe(undefined_value)
    }
})
