import { expect, test } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import { PLATFORM_EVENT_NAMES } from '../src/events/constants'

const WORKSPACE_PATH = fileURLToPath(new URL('..', import.meta.url))
const EVENT_FLOW = [
    ['pointerdown', 'child'],
    ['pointerdown', 'root'],
    ['pointermove', 'child'],
    ['pointermove', 'root'],
    ['pointerup', 'child'],
    ['pointerup', 'root'],
    ['pointerdown', 'child'],
    ['pointerdown', 'root'],
    ['pointercancel', 'child'],
    ['pointercancel', 'root'],
]

test('UIWebGPU dispatches pointer events in UI coordinates', async ({ page }) => {
    await page.goto('/dev/?renderers=RendererDom')

    const events = await page.evaluate(
        async ({ event_types, module_urls }) => {
            const [{ default: UIWebGPU }, { default: ResourcesWebGPU }, { loadYoga }] = await Promise.all([
                import(module_urls.ui),
                import(module_urls.resources),
                import('/@id/yoga-layout/load'),
            ])
            const canvas = document.createElement('canvas')
            canvas.width = 400
            canvas.height = 200
            Object.assign(canvas.style, {
                position: 'absolute',
                left: '0',
                top: '0',
                width: '400px',
                height: '200px',
            })
            document.body.appendChild(canvas)

            const resources = await ResourcesWebGPU.create({ canvas })
            const { ui } = await UIWebGPU.create({ resources, loadYoga })
            const child = ui.create()
            const events = []
            let current_source_event

            ui.root.style('width', '200px')
            ui.root.style('height', '100px')
            child.style('width', '100px')
            child.style('height', '50px')
            ui.root.add(child)
            ui.update()

            const record = (expected_current_target, current_target) => (event) => {
                events.push({
                    type: event.type,
                    x: event.x,
                    y: event.y,
                    target: event.target === child ? 'child' : 'root',
                    current_target,
                    current_target_matches: event.current_target === expected_current_target,
                    source_event_matches: event.source_event === current_source_event,
                    has_distance: 'distance_to_camera' in event,
                })
            }
            const removed_listener = () => events.push({ current_target: 'removed' })

            child.on('pointerdown', removed_listener)
            child.off('pointerdown', removed_listener)
            for (const type of event_types) {
                child.on(type, record(child, 'child'))
                ui.root.on(type, record(ui.root, 'root'))
                canvas.addEventListener(type, (source_event) => {
                    current_source_event = source_event
                    ui.dispatchPlatformEvent(source_event)
                })
            }

            const rect = canvas.getBoundingClientRect()
            const dispatch = (type, pointer_id, x, y) => {
                canvas.dispatchEvent(
                    new PointerEvent(type, {
                        pointerId: pointer_id,
                        clientX: rect.left + x,
                        clientY: rect.top + y,
                    }),
                )
            }

            dispatch('pointerdown', 1, 100, 50)
            dispatch('pointermove', 1, 300, 150)
            dispatch('pointerup', 1, 300, 150)
            dispatch('pointerdown', 2, 100, 50)
            dispatch('pointercancel', 2, 300, 150)

            ui.destroy()
            resources.dispose()
            canvas.remove()
            return events
        },
        {
            event_types: PLATFORM_EVENT_NAMES,
            module_urls: {
                ui: `/@fs${WORKSPACE_PATH}src/ui/UIWebGPU.ts`,
                resources: `/@fs${WORKSPACE_PATH}src/renderer/webgpu/ResourcesWebGPU.ts`,
            },
        },
    )

    expect(events.map(({ type, current_target }) => [type, current_target])).toEqual(EVENT_FLOW)
    expect(events.every(({ target }) => target === 'child')).toBe(true)
    expect(events.every(({ current_target_matches }) => current_target_matches)).toBe(true)
    expect(events.every(({ source_event_matches }) => source_event_matches)).toBe(true)
    expect(events.every(({ has_distance }) => has_distance === false)).toBe(true)

    for (const event of events) {
        const is_pointerdown = event.type === 'pointerdown'
        expect(event.x).toBe(is_pointerdown ? 50 : 150)
        expect(event.y).toBe(is_pointerdown ? 25 : 75)
    }
})
