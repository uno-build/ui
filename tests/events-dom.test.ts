import { expect, test } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { PLATFORM_EVENT_NAMES } from '../src/events/constants'

const WORKSPACE_PATH = fileURLToPath(new URL('..', import.meta.url))

test('UIDom adapts native events to the UI event contract', async ({ page }) => {
    await page.goto('/dev/layouts/?renderers=RendererDom')

    const result = await page.evaluate(
        async ({ module_urls }) => {
            const [{ default: UIDom }, { default: ResourcesDom }] = await Promise.all([
                import(module_urls.ui),
                import(module_urls.resources),
            ])
            const canvas = document.createElement('div')
            Object.assign(canvas.style, {
                boxSizing: 'border-box',
                display: 'flex',
                position: 'absolute',
                left: '20px',
                top: '30px',
                width: '200px',
                height: '100px',
                zIndex: '1000',
            })
            document.body.appendChild(canvas)

            const resources = ResourcesDom.create({ canvas })
            const { ui } = await UIDom.create({ resources })
            const child = ui.create()
            const sibling = ui.create()

            ui.root.style('width', '200px')
            ui.root.style('height', '100px')
            child.style('width', '100px')
            child.style('height', '50px')
            sibling.style('width', '100px')
            sibling.style('height', '50px')
            child.text('<span>child</span>')
            ui.root.add(child)
            ui.root.add(sibling)
            ui.update()

            const nested_element = child.element.firstElementChild
            const pointer_events = []
            let current_source_event
            let child_event
            let click_event
            const removed_listener = () => pointer_events.push({ listener: 'removed' })
            const child_listener = (event) => {
                child_event = event
                pointer_events.push({
                    listener: 'child',
                    type: event.type,
                    x: event.x,
                    y: event.y,
                    target_matches: event.target === child,
                    current_target_matches: event.current_target === child,
                    source_event_matches: event.source_event === current_source_event,
                })
            }
            const root_listener = (event) => {
                pointer_events.push({
                    listener: 'root',
                    type: event.type,
                    x: event.x,
                    y: event.y,
                    target_matches: event.target === child,
                    current_target_matches: event.current_target === ui.root,
                    source_event_matches: event.source_event === current_source_event,
                    event_matches: event === child_event,
                })
            }

            child.on('pointerdown', removed_listener)
            child.off('pointerdown', removed_listener)
            child.on('pointerdown', child_listener)
            child.on('pointerdown', child_listener)
            ui.root.on('pointerdown', root_listener)
            child.on('click', (event) => {
                click_event = {
                    type: event.type,
                    source_type: event.source_event.type,
                    target_matches: event.target === child,
                    current_target_matches: event.current_target === child,
                }
            })

            current_source_event = new PointerEvent('pointerdown', {
                bubbles: true,
                pointerId: 1,
                pointerType: 'mouse',
                clientX: 190,
                clientY: 90,
            })
            nested_element.dispatchEvent(current_source_event)
            nested_element.dispatchEvent(
                new PointerEvent('pointerup', {
                    bubbles: true,
                    pointerId: 1,
                    pointerType: 'mouse',
                    clientX: 190,
                    clientY: 90,
                }),
            )
            nested_element.dispatchEvent(
                new MouseEvent('click', {
                    bubbles: true,
                    clientX: 190,
                    clientY: 90,
                }),
            )

            const transitions = []
            child.on('pointerout', (event) => {
                transitions.push({
                    type: event.type,
                    target_matches: event.target === child,
                    related_target_matches: event.related_target === sibling,
                    current_target_matches: event.current_target === child,
                })
            })
            sibling.on('pointerover', (event) => {
                transitions.push({
                    type: event.type,
                    target_matches: event.target === sibling,
                    related_target_matches: event.related_target === child,
                    current_target_matches: event.current_target === sibling,
                })
            })
            child.element.dispatchEvent(
                new PointerEvent('pointerout', {
                    bubbles: true,
                    pointerId: 1,
                    pointerType: 'mouse',
                    clientX: 170,
                    clientY: 55,
                    relatedTarget: sibling.element,
                }),
            )
            sibling.element.dispatchEvent(
                new PointerEvent('pointerover', {
                    bubbles: true,
                    pointerId: 1,
                    pointerType: 'mouse',
                    clientX: 170,
                    clientY: 55,
                    relatedTarget: child.element,
                }),
            )

            const propagation = []
            child.on('pointermove', (event) => {
                propagation.push('child-first')
                event.stopPropagation()
            })
            child.on('pointermove', () => propagation.push('child-second'))
            ui.root.on('pointermove', () => propagation.push('root'))
            canvas.addEventListener('pointermove', () => propagation.push('native-root'))
            nested_element.dispatchEvent(
                new PointerEvent('pointermove', {
                    bubbles: true,
                    pointerId: 1,
                    pointerType: 'mouse',
                    clientX: 70,
                    clientY: 55,
                }),
            )

            let destroyed_calls = 0
            const child_element = child.element
            child.on('pointercancel', () => destroyed_calls++)
            ui.root.on('pointercancel', () => destroyed_calls++)
            child.destroy()
            child_element.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }))
            ui.destroy()
            canvas.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }))
            canvas.remove()

            return {
                pointer_events,
                transitions,
                click_event,
                propagation,
                destroyed_calls,
            }
        },
        {
            module_urls: {
                ui: `/@fs${WORKSPACE_PATH}src/ui/UIDom.js`,
                resources: `/@fs${WORKSPACE_PATH}src/renderer/dom/ResourcesDom.ts`,
            },
        },
    )

    expect(result.pointer_events).toEqual([
        {
            listener: 'child',
            type: 'pointerdown',
            x: 170,
            y: 60,
            target_matches: true,
            current_target_matches: true,
            source_event_matches: true,
        },
        {
            listener: 'root',
            type: 'pointerdown',
            x: 170,
            y: 60,
            target_matches: true,
            current_target_matches: true,
            source_event_matches: true,
            event_matches: true,
        },
    ])
    expect(result.transitions).toEqual([
        {
            type: 'pointerout',
            target_matches: true,
            related_target_matches: true,
            current_target_matches: true,
        },
        {
            type: 'pointerover',
            target_matches: true,
            related_target_matches: true,
            current_target_matches: true,
        },
    ])
    expect(result.click_event).toEqual({
        type: 'click',
        source_type: 'click',
        target_matches: true,
        current_target_matches: true,
    })
    expect(result.propagation).toEqual(['child-first', 'child-second', 'native-root'])
    expect(result.destroyed_calls).toBe(0)
})

test('UIDom uses native scrolling inside bordered scroll containers', async ({ page }) => {
    await page.goto('/dev/layouts/?renderers=RendererDom')

    const result = await page.evaluate(
        async ({ module_urls }) => {
            const [{ default: UIDom }, { default: ResourcesDom }] = await Promise.all([
                import(module_urls.ui),
                import(module_urls.resources),
            ])
            const canvas = document.createElement('div')
            Object.assign(canvas.style, {
                boxSizing: 'border-box',
                display: 'flex',
                position: 'absolute',
                left: '20px',
                top: '30px',
                width: '200px',
                height: '200px',
                zIndex: '1000',
            })
            document.body.appendChild(canvas)

            const resources = ResourcesDom.create({ canvas })
            const { ui } = await UIDom.create({ resources })
            const scroll = ui.create()
            const child = ui.create()

            ui.root.style('width', '200px')
            ui.root.style('height', '200px')
            scroll.style('width', '100px')
            scroll.style('height', '100px')
            scroll.style('overflow', 'scroll')
            scroll.style('border', '4px solid #000000')
            child.style('width', '100px')
            child.style('height', '200px')
            child.style('flexShrink', '0')
            ui.root.add(scroll)
            scroll.add(child)
            ui.update()

            let pointer_down_calls = 0
            const scroll_events = []
            let wheel_event
            child.on('pointerdown', () => pointer_down_calls++)
            scroll.on('wheel', (event) => {
                wheel_event = {
                    source_type: event.source_event.type,
                    target_matches: event.target === child,
                    current_target_matches: event.current_target === scroll,
                    delta_y: event.delta_y,
                }
            })
            scroll.on('scroll', (event) => {
                scroll_events.push({
                    source_type: event.source_event.type,
                    target_matches: event.target === scroll,
                    scroll_left: event.scroll_left,
                    scroll_top: event.scroll_top,
                })
            })
            child.element.dispatchEvent(
                new PointerEvent('pointerdown', {
                    bubbles: true,
                    pointerId: 1,
                    pointerType: 'mouse',
                    clientX: 30,
                    clientY: 40,
                }),
            )
            child.element.dispatchEvent(
                new WheelEvent('wheel', {
                    bubbles: true,
                    clientX: 30,
                    clientY: 40,
                    deltaY: 40,
                }),
            )

            const scroll_top_after_wheel = scroll.scrollTop
            const native_scroll = new Promise((resolve) => {
                scroll.element.addEventListener('scroll', resolve, { once: true })
            })
            scroll.element.scrollTop = 40
            await native_scroll

            const border = scroll.layout.border
            const scroll_top = scroll.scrollTop
            ui.destroy()
            canvas.remove()

            return { border, pointer_down_calls, scroll_events, scroll_top, scroll_top_after_wheel, wheel_event }
        },
        {
            module_urls: {
                ui: `/@fs${WORKSPACE_PATH}src/ui/UIDom.js`,
                resources: `/@fs${WORKSPACE_PATH}src/renderer/dom/ResourcesDom.ts`,
            },
        },
    )

    expect(result).toEqual({
        border: {
            top: 4,
            right: 4,
            bottom: 4,
            left: 4,
        },
        pointer_down_calls: 1,
        scroll_events: [
            {
                source_type: 'scroll',
                target_matches: true,
                scroll_left: 0,
                scroll_top: 40,
            },
        ],
        scroll_top: 40,
        scroll_top_after_wheel: 0,
        wheel_event: {
            source_type: 'wheel',
            target_matches: true,
            current_target_matches: true,
            delta_y: 40,
        },
    })
})

test('UIDom preserves native event sources alongside UIWebGPU normalization', async ({ page }) => {
    await page.goto('/dev/layouts/?renderers=RendererDom')

    await page.evaluate(
        async ({ module_urls, platform_event_names }) => {
            const [
                { default: UIDom },
                { default: UIWebGPU },
                { default: ResourcesDom },
                { default: ResourcesWebGPU },
                { loadYoga },
            ] = await Promise.all([
                import(module_urls.ui_dom),
                import(module_urls.ui_webgpu),
                import(module_urls.resources_dom),
                import(module_urls.resources_webgpu),
                import('/@id/yoga-layout/load'),
            ])
            const dom_canvas = document.createElement('div')
            const webgpu_canvas = document.createElement('canvas')
            webgpu_canvas.width = 200
            webgpu_canvas.height = 100
            Object.assign(dom_canvas.style, {
                boxSizing: 'border-box',
                display: 'flex',
                position: 'absolute',
                left: '20px',
                top: '30px',
                width: '200px',
                height: '100px',
                zIndex: '1000',
            })
            Object.assign(webgpu_canvas.style, {
                position: 'absolute',
                left: '300px',
                top: '30px',
                width: '200px',
                height: '100px',
                zIndex: '1000',
            })
            document.body.append(dom_canvas, webgpu_canvas)

            const dom_resources = ResourcesDom.create({ canvas: dom_canvas })
            const webgpu_resources = await ResourcesWebGPU.create({ canvas: webgpu_canvas })
            const { ui: dom_ui } = await UIDom.create({ resources: dom_resources })
            const { ui: webgpu_ui } = await UIWebGPU.create({ resources: webgpu_resources, loadYoga })

            const createNodes = (ui) => {
                const child = ui.create()
                const sibling = ui.create()
                ui.root.style('width', '200px')
                ui.root.style('height', '100px')
                child.style('width', '100px')
                child.style('height', '100px')
                sibling.style('width', '100px')
                sibling.style('height', '100px')
                ui.root.add(child)
                ui.root.add(sibling)
                ui.update()
                return { child, sibling }
            }
            const dom_nodes = createNodes(dom_ui)
            const webgpu_nodes = createNodes(webgpu_ui)
            const event_types = ['pointerover', 'pointermove', 'pointerdown', 'pointerup', 'click', 'pointerout']
            const dom_synthetic = []
            const webgpu_synthetic = []
            const dom_node_names = new Map([
                [dom_nodes.child, 'child'],
                [dom_nodes.sibling, 'sibling'],
            ])
            const webgpu_node_names = new Map([
                [webgpu_nodes.child, 'child'],
                [webgpu_nodes.sibling, 'sibling'],
            ])
            const recordSynthetic = (trace, names) => (event) => {
                trace.push({
                    type: event.type,
                    target: names.get(event.target),
                    current_target: names.get(event.current_target),
                    related_target: names.get(event.related_target) ?? null,
                    source_type: event.source_event.type,
                })
            }
            let collect_dom = true
            let collect_webgpu = true

            for (const type of event_types) {
                dom_nodes.child.on(type, (event) => {
                    if (collect_dom) {
                        recordSynthetic(dom_synthetic, dom_node_names)(event)
                    }
                })
                dom_nodes.sibling.on(type, (event) => {
                    if (collect_dom) {
                        recordSynthetic(dom_synthetic, dom_node_names)(event)
                    }
                })
                webgpu_nodes.child.on(type, (event) => {
                    if (collect_webgpu) {
                        recordSynthetic(webgpu_synthetic, webgpu_node_names)(event)
                    }
                })
                webgpu_nodes.sibling.on(type, (event) => {
                    if (collect_webgpu) {
                        recordSynthetic(webgpu_synthetic, webgpu_node_names)(event)
                    }
                })
            }

            for (const type of platform_event_names) {
                webgpu_canvas.addEventListener(type, (event) => webgpu_ui.dispatchPlatformEvent(event))
            }

            ;(window as any).event_parity = {
                stopDom() {
                    collect_dom = false
                },
                finish() {
                    collect_webgpu = false
                    const result = {
                        dom_synthetic,
                        webgpu_synthetic,
                    }
                    dom_ui.destroy()
                    webgpu_ui.destroy()
                    webgpu_resources.dispose()
                    dom_canvas.remove()
                    webgpu_canvas.remove()
                    return result
                },
            }
        },
        {
            platform_event_names: PLATFORM_EVENT_NAMES,
            module_urls: {
                ui_dom: `/@fs${WORKSPACE_PATH}src/ui/UIDom.js`,
                ui_webgpu: `/@fs${WORKSPACE_PATH}src/ui/UIWebGPU.js`,
                resources_dom: `/@fs${WORKSPACE_PATH}src/renderer/dom/ResourcesDom.ts`,
                resources_webgpu: `/@fs${WORKSPACE_PATH}src/renderer/webgpu/ResourcesWebGPU.ts`,
            },
        },
    )

    await page.mouse.move(70, 80)
    await page.mouse.down()
    await page.mouse.up()
    await page.mouse.move(170, 80)
    await page.evaluate(() => (window as any).event_parity.stopDom())

    await page.mouse.move(260, 180)
    await page.mouse.move(350, 80)
    await page.mouse.down()
    await page.mouse.up()
    await page.mouse.move(450, 80)

    const result = await page.evaluate(() => (window as any).event_parity.finish())
    const getEmissions = (trace) =>
        trace.map(({ type, target, related_target }) => ({ type, target, related_target }))

    expect(getEmissions(result.webgpu_synthetic)).toEqual(getEmissions(result.dom_synthetic))
    expect(result.dom_synthetic.every(({ target, current_target }) => target === current_target)).toBe(true)
    expect(result.webgpu_synthetic.every(({ target, current_target }) => target === current_target)).toBe(true)
    expect(result.dom_synthetic.map(({ type, source_type }) => [type, source_type])).toEqual([
        ['pointerover', 'pointerover'],
        ['pointermove', 'pointermove'],
        ['pointerdown', 'pointerdown'],
        ['pointerup', 'pointerup'],
        ['click', 'click'],
        ['pointerout', 'pointerout'],
        ['pointerover', 'pointerover'],
        ['pointermove', 'pointermove'],
    ])
    expect(result.webgpu_synthetic.map(({ type, source_type }) => [type, source_type])).toEqual([
        ['pointerover', 'pointermove'],
        ['pointermove', 'pointermove'],
        ['pointerdown', 'pointerdown'],
        ['pointerup', 'pointerup'],
        ['click', 'pointerup'],
        ['pointerout', 'pointermove'],
        ['pointerover', 'pointermove'],
        ['pointermove', 'pointermove'],
    ])
})
