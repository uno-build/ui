import ResourcesDom from 'uno-ui/ResourcesDom'
import ResourcesWebGPU from 'uno-ui/ResourcesWebGPU'
import UIDom from 'uno-ui/UIDom'
import UIWebGPU from 'uno-ui/UIWebGPU'
import { PLATFORM_EVENT_NAMES } from 'uno-ui/events'
import { registerRootComponent } from 'uno-ui/vue'
import { loadYoga } from 'yoga-layout/load'
import { loadImage, loadJson } from '../../tests/utils/load-assets'
import { initSettingsPanel } from '../settings/settings-panel'
import Components from './Components.vue'

const TEXT_FONT_FAMILY = 'Poppins-Regular'
const IMAGE_SRC = 'assets/images/coin.png'
const RENDERERS = {
    RendererDom: { element_type: 'div', ui_class: UIDom, resources_class: ResourcesDom },
    RendererWebGPU: { element_type: 'canvas', ui_class: UIWebGPU, resources_class: ResourcesWebGPU },
}
const root = document.getElementById('root')!
const device_pixel_ratio = window.devicePixelRatio
const uis = []
const [image, font_image, font_json] = await Promise.all([
    loadImage(`/${IMAGE_SRC}`),
    loadImage(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.png`),
    loadJson(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.json`),
])

initSettingsPanel({ root })

for (const [renderer_name, setup] of Object.entries(RENDERERS)) {
    const element = document.createElement(setup.element_type)
    element.id = renderer_name
    root.appendChild(element)

    const resources = await setup.resources_class.create({ canvas: element })
    const { ui } = await setup.ui_class.create({ resources, loadYoga, device_pixel_ratio })
    resources.registerImage(IMAGE_SRC, image)
    resources.registerFont(TEXT_FONT_FAMILY, font_image, font_json)

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

    const renderer = registerRootComponent(Components, { ui })
    renderer.render({ image_src: IMAGE_SRC })
    uis.push(ui)
}

requestAnimationFrame(function render() {
    uis.forEach((ui) => ui.draw())
    requestAnimationFrame(render)
})
