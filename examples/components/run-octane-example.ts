import ResourcesWebGPU from 'uno-ui/ResourcesWebGPU'
import UIWebGPU from 'uno-ui/UIWebGPU'
import { loadYoga } from 'yoga-layout/load'

type CreateExample = (context: { ui: UIWebGPU; resources: ResourcesWebGPU }) => void | Promise<void>

export default async function runOctaneExample(create_example: CreateExample) {
    const canvas = document.querySelector<HTMLCanvasElement>('canvas')!
    const device_pixel_ratio = window.devicePixelRatio

    const resources = await ResourcesWebGPU.create({ canvas })
    const { ui } = await UIWebGPU.create({ resources, loadYoga, device_pixel_ratio })

    function syncCanvasSize() {
        const width = canvas.clientWidth
        const height = canvas.clientHeight

        canvas.width = Math.max(1, Math.round(width * device_pixel_ratio))
        canvas.height = Math.max(1, Math.round(height * device_pixel_ratio))
        ui.setViewport(width, height)
        ui.setDevicePixelRatio(device_pixel_ratio)
        ui.update()
    }

    syncCanvasSize()
    window.addEventListener('resize', syncCanvasSize)
    ;['pointerdown', 'pointerup', 'pointermove', 'pointercancel', 'wheel'].forEach((type) => {
        canvas.addEventListener(type, (event) => ui.dispatchEvent(event))
    })

    requestAnimationFrame(function render() {
        ui.draw()
        requestAnimationFrame(render)
    })

    await create_example({ ui, resources })
}
