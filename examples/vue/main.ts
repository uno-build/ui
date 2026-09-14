import ResourcesDom from 'uno-ui/ResourcesDom'
import ResourcesWebGPU from 'uno-ui/ResourcesWebGPU'
import UIDom from 'uno-ui/UIDom'
import UIWebGPU from 'uno-ui/UIWebGPU'
import { PLATFORM_EVENT_NAMES } from 'uno-ui/events'
import { registerRootComponent } from 'uno-ui/vue'
import { loadYoga } from 'yoga-layout/load'
import { initSettingsPanel } from '../settings/settings-panel'

const EXAMPLES = {
    // input: () => import('./input.vue'),
    image: () => import('./image.vue'),
    scrollview: () => import('./scrollview.vue'),
    todo: () => import('./todo.vue'),
    'todo-playcanvas': () => import('./todo-playcanvas'),
}
const RENDERERS = {
    RendererDom: { element: document.createElement('div'), ui_class: UIDom, resources_class: ResourcesDom },
    RendererWebGPU: {
        element: document.createElement('canvas'),
        ui_class: UIWebGPU,
        resources_class: ResourcesWebGPU,
    },
}
const root = document.getElementById('root')!
const settings_examples = document.getElementById('settings-examples')!
const example_name = new URLSearchParams(location.search).get('example') as keyof typeof EXAMPLES

for (const [renderer_name, setup] of Object.entries(RENDERERS)) {
    setup.element.id = renderer_name
}

for (const available_example_name of Object.keys(EXAMPLES)) {
    const example_url = new URL(window.location.href)
    example_url.searchParams.set('example', available_example_name)

    const example_link = document.createElement('a')
    example_link.className = 'settings-example'
    example_link.href = example_url.href
    example_link.textContent = available_example_name
    if (available_example_name === example_name) {
        example_link.ariaCurrent = 'page'
    }
    settings_examples.appendChild(example_link)
}

initSettingsPanel({ root })

if (example_name === 'todo-playcanvas') {
    const [{ main }, { default: UIPlayCanvas }] = await Promise.all([
        EXAMPLES[example_name](),
        import('uno-ui/UIPlayCanvas'),
    ])
    const canvas = RENDERERS.RendererWebGPU.element
    root.appendChild(canvas)
    await main({
        canvas,
        onCanvasEvent: window.addEventListener.bind(window),
        ResourcesWebGPU,
        UIPlayCanvas,
        loadYoga,
    })
} else {
    const { default: Example, loadResources } = await EXAMPLES[example_name]()
    const device_pixel_ratio = window.devicePixelRatio
    const uis = []

    for (const setup of Object.values(RENDERERS)) {
        const { element } = setup
        root.appendChild(element)

        const resources = await setup.resources_class.create({ canvas: element })
        const { ui } = await setup.ui_class.create({ resources, loadYoga, device_pixel_ratio })

        function syncRendererSize() {
            const width = root.clientWidth
            const height = root.clientHeight

            if (element instanceof HTMLCanvasElement) {
                element.width = Math.max(1, Math.round(width * device_pixel_ratio))
                element.height = Math.max(1, Math.round(height * device_pixel_ratio))
            }

            ui.setViewport(width, height)
            ui.setDevicePixelRatio(device_pixel_ratio)
            ui.update()
        }

        syncRendererSize()
        window.addEventListener('resize', syncRendererSize)

        if (element instanceof HTMLCanvasElement) {
            PLATFORM_EVENT_NAMES.forEach((type) => {
                element.addEventListener(type, (event) => ui.dispatchPlatformEvent(event))
            })
        }

        await loadResources(resources)
        const renderer = registerRootComponent(Example, { ui })
        renderer.render({})
        uis.push(ui)
    }

    requestAnimationFrame(function render() {
        uis.forEach((ui) => ui.draw())
        requestAnimationFrame(render)
    })
}
