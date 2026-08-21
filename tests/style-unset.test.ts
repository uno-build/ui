import { expect, test } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import Style from '../src/style'

const STYLE_VALUES: Record<string, string> = {
    zIndex: '2',
    overflow: 'hidden',
    overflowX: 'hidden',
    overflowY: 'hidden',
    opacity: '0.5',
    boxShadow: '1px 2px 3px 0px #123456',
    textShadow: '1px 2px 3px #123456',
    textStroke: '2px #123456',
    border: '2px solid #123456',
    borderRadius: '8px',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    borderBottomLeftRadius: '8px',
    borderBottomRightRadius: '8px',
    borderTopStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderTopColor: '#123456',
    borderLeftColor: '#123456',
    borderRightColor: '#123456',
    borderBottomColor: '#123456',
    backgroundColor: '#123456',
    backgroundImage: '/assets/images/coin.png',
    backgroundSize: '20px 30px',
    backgroundSizeWidth: '20px',
    backgroundSizeHeight: '30px',
    backgroundPosition: '20px 30px',
    backgroundPositionX: '20px',
    backgroundPositionY: '30px',
    backgroundRepeat: 'repeat-x',
    color: '#123456',
    fontFamily: 'ChangaOne-Regular',
    fontSize: '24px',
    lineHeight: '30px',
    letterSpacing: '2px',
    textAlign: 'center',
    position: 'absolute',
    top: '10px',
    left: '10px',
    right: '10px',
    bottom: '10px',
    alignContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'column',
    flexWrap: 'wrap',
    justifyContent: 'center',
    margin: '10px',
    marginTop: '10px',
    marginLeft: '10px',
    marginRight: '10px',
    marginBottom: '10px',
    flex: '2 0 40px',
    flexGrow: '2',
    flexShrink: '0',
    flexBasis: '40px',
    width: '160px',
    height: '140px',
    minWidth: '180px',
    minHeight: '140px',
    maxWidth: '60px',
    maxHeight: '60px',
    boxSizing: 'content-box',
    aspectRatio: '2',
    borderTopWidth: '4px',
    borderLeftWidth: '4px',
    borderRightWidth: '4px',
    borderBottomWidth: '4px',
    display: 'none',
    direction: 'rtl',
    padding: '10px',
    paddingTop: '10px',
    paddingLeft: '10px',
    paddingRight: '10px',
    paddingBottom: '10px',
    gap: '10px',
    rowGap: '10px',
    columnGap: '10px',
}

const STYLE_NAMES = Object.values(Style.STYLE).map((style) => style.name)
const STYLE_CASES = STYLE_NAMES.map((name) => ({
    name,
    value: STYLE_VALUES[name],
    expanded_names: Style.resolveStyle(name, 'unset').expanded.map((style) => style.name),
}))
const WORKSPACE_PATH = fileURLToPath(new URL('..', import.meta.url))

test('Dom unset restores the undefined state for all 79 styles', async ({ page }) => {
    expect(STYLE_NAMES).toHaveLength(79)
    expect(Object.keys(STYLE_VALUES)).toEqual(STYLE_NAMES)

    await page.goto('/dev/?renderers=RendererDom')

    const states = await page.evaluate(
        async ({ module_urls, style_cases }) => {
            const [{ default: UIDom }, { default: ResourcesDom }] = await Promise.all([
                import(module_urls.ui),
                import(module_urls.resources),
            ])
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
                resources.registerImage('/assets/images/coin.png', { src: '/assets/images/coin.png' })

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
            module_urls: {
                ui: `/@fs${WORKSPACE_PATH}src/ui/UIDom.ts`,
                resources: `/@fs${WORKSPACE_PATH}src/renderer/dom/ResourcesDom.ts`,
            },
            style_cases: STYLE_CASES,
        },
    )

    expect(states).toHaveLength(79)
    for (const { name, undefined_value, defined_value, unset_value } of states) {
        expect(defined_value, `${name}: defined`).not.toBe(undefined_value)
        expect(unset_value, `${name}: unset`).toBe(undefined_value)
    }
})

test('WebGPU unset restores the undefined state for all 79 styles', async ({ page }) => {
    expect(STYLE_NAMES).toHaveLength(79)
    expect(Object.keys(STYLE_VALUES)).toEqual(STYLE_NAMES)

    await page.goto('/dev/?renderers=RendererDom')

    const states = await page.evaluate(
        async ({ module_urls, style_cases }) => {
            const [
                { default: UIWebGPU },
                { default: ResourcesWebGPU },
                { loadYoga },
                { loadImage, loadJson },
            ] = await Promise.all([
                import(module_urls.ui),
                import(module_urls.resources),
                import('/@id/yoga-layout/load'),
                import(module_urls.assets),
            ])
            const [coin, poppins_image, poppins_json, changa_image, changa_json] = await Promise.all([
                loadImage('/assets/images/coin.png'),
                loadImage('/assets/fonts/Poppins-Regular.mtsdf.png'),
                loadJson('/assets/fonts/Poppins-Regular.mtsdf.json'),
                loadImage('/assets/fonts/ChangaOne-Regular.mtsdf.png'),
                loadJson('/assets/fonts/ChangaOne-Regular.mtsdf.json'),
            ])
            const text_style_names = new Set([
                'color',
                'fontFamily',
                'fontSize',
                'lineHeight',
                'letterSpacing',
                'textAlign',
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
            resources.registerFont('Poppins-Regular', poppins_image, poppins_json)
            resources.registerFont('ChangaOne-Regular', changa_image, changa_json)

            const { ui } = await UIWebGPU.create({ resources, loadYoga })
            ui.setViewport(400, 300)
            ui.root.style('width', '400px')
            ui.root.style('height', '300px')
            const states = []

            function readState() {
                ui.update()
                const nodes = [...(ui as any).nodes]
                const renderer = ui.renderer as any
                const render_data = renderer.collectRenderData(nodes)
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

                return JSON.stringify({ node_state, render_data, text_runs: renderer.text_runs })
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
                setSetupStyle(text, expanded_names, 'fontFamily', 'Poppins-Regular')
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
            module_urls: {
                ui: `/@fs${WORKSPACE_PATH}src/ui/UIWebGPU.ts`,
                resources: `/@fs${WORKSPACE_PATH}src/renderer/webgpu/ResourcesWebGPU.ts`,
                assets: `/@fs${WORKSPACE_PATH}tests/utils/load-assets.ts`,
            },
            style_cases: STYLE_CASES,
        },
    )

    expect(states).toHaveLength(79)
    for (const { name, undefined_value, defined_value, unset_value } of states) {
        expect(defined_value, `${name}: defined`).not.toBe(undefined_value)
        expect(unset_value, `${name}: unset`).toBe(undefined_value)
    }
})
