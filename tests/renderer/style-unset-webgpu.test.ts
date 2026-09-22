import { expect, test } from '@playwright/test'
import { STYLE_CASES, STYLE_NAMES, STYLE_VALUES } from '../utils/style-unset-cases'

const TEST_PAGE_URL = '/tests/renderer/'

test('WebGPU unset restores the undefined state for all 81 styles', { tag: '@webgpu' }, async ({ page }) => {
    expect(STYLE_NAMES).toHaveLength(81)
    expect(Object.keys(STYLE_VALUES)).toEqual(STYLE_NAMES)

    await page.goto(TEST_PAGE_URL)

    const states = await page.evaluate(
        async ({ style_cases }) => {
            const {
                UIWebGPU,
                ResourcesWebGPU,
                loadYoga,
                loadImage,
                loadJson,
                createNodeMetricsResolver,
                RECORD_ALL,
            } = await import('/tests/renderer/browser-entry.ts')
            const { FONT_NAME_POPPINS, FONT_NAME_CHANGA, loadFont } = await import('/examples/shared/assets.ts')
            const [coin, poppins_font, changa_font] = await Promise.all([
                loadImage('/examples/assets/images/coin.png'),
                loadFont(FONT_NAME_POPPINS, { loadImage, loadJson }),
                loadFont(FONT_NAME_CHANGA, { loadImage, loadJson }),
            ])
            const text_style_names = new Set([
                'color',
                'fontFamily',
                'fontSize',
                'lineHeight',
                'letterSpacing',
                'textAlign',
                'whiteSpace',
                'textShadow',
                'textStroke',
            ])
            const background_image_style_names = new Set([
                'backgroundSize',
                'backgroundSizeWidth',
                'backgroundSizeHeight',
                'backgroundPosition',
                'backgroundPositionX',
                'backgroundPositionY',
                'backgroundRepeat',
            ])
            const overflow_style_names = new Set(['overflow', 'overflowX', 'overflowY'])
            const canvas = document.createElement('canvas')
            canvas.width = 400
            canvas.height = 300
            document.body.appendChild(canvas)

            const resources = await ResourcesWebGPU.create({ canvas })
            resources.registerImage(coin.src, coin)
            resources.registerFont(FONT_NAME_POPPINS, poppins_font)
            resources.registerFont(FONT_NAME_CHANGA, changa_font)

            const { ui } = await UIWebGPU.create({ resources, loadYoga })
            ui.setViewport(400, 300)
            ui.root.style('width', '400px')
            ui.root.style('height', '300px')
            const states = []

            function readState() {
                ui.update()
                const nodes = [...(ui as any).nodes]
                const renderer = ui.renderer as any
                const panels = []
                const glyphs = []
                const text_runs = []
                const records = []
                const getNodeMetrics = createNodeMetricsResolver()

                for (const node of nodes) {
                    const record = renderer.getRecord(node)
                    const { panel_data, text_data } = renderer.updateRecord(node, record, RECORD_ALL, getNodeMetrics)
                    if (panel_data !== null) {
                        panels.push(panel_data)
                    }
                    if (text_data !== null) {
                        text_runs.push(text_data.run)
                        glyphs.push(...text_data.glyphs)
                    }
                    records.push({
                        has_panel: record.panel_slot !== -1,
                        glyph_count: record.glyph_count,
                        has_text_shadow: record.has_text_shadow,
                        text_stroke_width: record.text_stroke_width,
                    })
                }

                const node_state = nodes.map((node) => ({
                    id: node.id,
                    path: node.path,
                    order: node.order,
                    layout: node.layout,
                    scrollTop: node.scrollTop,
                    scrollLeft: node.scrollLeft,
                    scrollHeight: node.scrollHeight,
                    scrollWidth: node.scrollWidth,
                    clientHeight: node.clientHeight,
                    clientWidth: node.clientWidth,
                    styles: Object.fromEntries(
                        Object.entries(node.styles).filter(([, style]) => (style as any).parsed.kind !== 'unset'),
                    ),
                }))

                return JSON.stringify({ node_state, records, panels, glyphs, text_runs })
            }

            function setSetupStyle(node, expanded_names, name, value) {
                if (!expanded_names.includes(name)) {
                    node.style(name, value)
                }
            }

            for (const { name, value, expanded_names } of style_cases) {
                const stage = ui.create()
                const before = ui.create()
                const target = ui.create()
                const first_child = ui.create()
                const second_child = ui.create()
                const text = ui.create()

                stage.style('width', '360px')
                stage.style('height', '220px')
                stage.style('flexDirection', 'row')
                stage.style('alignItems', 'flex-start')

                before.style('width', '40px')
                before.style('height', '40px')
                before.style('flexShrink', '0')
                before.style('zIndex', '1')
                before.style('backgroundColor', '#222222')

                setSetupStyle(target, expanded_names, 'width', '120px')
                if (name !== 'aspectRatio') {
                    setSetupStyle(target, expanded_names, 'height', '100px')
                }
                setSetupStyle(target, expanded_names, 'flexShrink', '0')
                setSetupStyle(target, expanded_names, 'flexDirection', 'row')
                setSetupStyle(target, expanded_names, 'backgroundColor', '#336699')

                first_child.style('width', overflow_style_names.has(name) ? '200px' : '40px')
                first_child.style('height', overflow_style_names.has(name) ? '160px' : '30px')
                first_child.style('flexShrink', '0')
                first_child.style('backgroundColor', '#ff0000')
                second_child.style('width', '40px')
                second_child.style('height', '50px')
                second_child.style('flexShrink', '0')
                second_child.style('backgroundColor', '#00ff00')

                setSetupStyle(text, expanded_names, 'width', '140px')
                setSetupStyle(text, expanded_names, 'height', '80px')
                setSetupStyle(text, expanded_names, 'flexShrink', '0')
                setSetupStyle(text, expanded_names, 'fontFamily', FONT_NAME_POPPINS)
                setSetupStyle(text, expanded_names, 'backgroundColor', '#eeeeee')
                text.text('A A')

                if (name === 'alignContent') {
                    target.style('flexWrap', 'wrap')
                    first_child.style('width', '80px')
                    second_child.style('width', '80px')
                }
                if (background_image_style_names.has(name)) {
                    target.style('backgroundImage', coin.src)
                }
                if (name.startsWith('border') && name.endsWith('Color')) {
                    const side = name.slice(6, -5)
                    target.style(`border${side}Style`, 'solid')
                    target.style(`border${side}Width`, '4px')
                }
                if (name.startsWith('border') && name.endsWith('Style')) {
                    const side = name.slice(6, -5)
                    target.style(`border${side}Color`, '#ffffff')
                    target.style(`border${side}Width`, '4px')
                }
                if (name.startsWith('border') && name.endsWith('Width')) {
                    const side = name.slice(6, -5)
                    target.style(`border${side}Color`, '#ffffff')
                    target.style(`border${side}Style`, 'solid')
                }
                if (name === 'boxSizing') {
                    target.style('padding', '10px')
                    target.style('border', '4px solid #ffffff')
                }

                target.add(first_child)
                target.add(second_child)
                stage.add(before)
                stage.add(target)
                stage.add(text)
                ui.root.add(stage)

                const styled_node = text_style_names.has(name) ? text : target
                const undefined_value = readState()

                styled_node.style(name, value)
                const defined_value = readState()

                styled_node.style(name, 'unset')
                const unset_value = readState()

                states.push({ name, undefined_value, defined_value, unset_value })
                stage.destroy()
            }

            ui.destroy()
            resources.dispose()
            canvas.remove()

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
