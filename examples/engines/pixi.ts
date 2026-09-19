import { Container, DOMAdapter, Sprite, Texture, WebGPURenderer } from 'pixi.js'
import { loadAssets, registerAssets } from '../shared/assets'
import { createBackgroundUI } from '../shared/uis/background-ui'
import { createForegroundUI } from '../shared/uis/foreground-ui'

const TEXTURE_SIZE = 256

export { DOMAdapter }

export async function main({ canvas, onCanvasEvent, UI, ResourcesWebGPU, loadImage, loadJson }) {
    const adapter = await navigator.gpu.requestAdapter()
    const resources = await ResourcesWebGPU.create({ canvas, adapter })
    const device_pixel_ratio = window.devicePixelRatio
    const { ui: background_ui } = await UI.create({ resources, device_pixel_ratio })
    const { ui: foreground_ui } = await UI.create({ resources, device_pixel_ratio })

    const pixi_renderer = new WebGPURenderer()
    await pixi_renderer.init({
        canvas,
        gpu: {
            adapter: resources.adapter,
            device: resources.device,
        },
        resolution: device_pixel_ratio,
        backgroundAlpha: 0,
        clearBeforeRender: false,
        antialias: false,
        skipExtensionImports: true,
    })

    const stage = new Container()
    const square = new Sprite(createGradientTexture())
    square.anchor.set(0.5)
    stage.addChild(square)

    const assets = await loadAssets({ loadImage, loadJson })
    registerAssets({ resources, assets })
    const { grid } = createBackgroundUI({ ui: background_ui, assets, background_color: '#e2cff4' })
    createForegroundUI({ ui: foreground_ui, assets, title: 'Hello Pixi.js!' })
    syncCanvasSize({ canvas, pixi_renderer, square, background_ui, foreground_ui })
    background_ui.update()
    foreground_ui.update()

    // Event handling
    onCanvasEvent('resize', () => {
        syncCanvasSize({ canvas, pixi_renderer, square, background_ui, foreground_ui })
        background_ui.update()
        foreground_ui.update()
    })

    let grid_x = 0

    function frame() {
        grid_x += 1
        grid.style('backgroundPosition', `${grid_x}px ${grid_x}px`)
        background_ui.update()
        background_ui.draw({ load_op: 'clear' })

        square.rotation = Date.now() / 1000
        pixi_renderer.render({ container: stage, clear: false })

        foreground_ui.update()
        foreground_ui.draw()

        resources.present()

        requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
}

function syncCanvasSize({ canvas, pixi_renderer, square, background_ui, foreground_ui }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    pixi_renderer.resize(width, height, device_pixel_ratio)

    const square_size = Math.min(width, height) * 0.5
    square.position.set(width / 2, height / 2)
    square.width = square_size
    square.height = square_size

    for (const ui of [background_ui, foreground_ui]) {
        ui.setViewport(width, height)
        ui.setDevicePixelRatio(device_pixel_ratio)
    }
}

function createGradientTexture() {
    const pixels = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * 4)

    for (let y = 0; y < TEXTURE_SIZE; y++) {
        for (let x = 0; x < TEXTURE_SIZE; x++) {
            const pixel_index = (y * TEXTURE_SIZE + x) * 4
            pixels[pixel_index] = (x / (TEXTURE_SIZE - 1)) * 255
            pixels[pixel_index + 1] = (1 - y / (TEXTURE_SIZE - 1)) * 255
            pixels[pixel_index + 2] = 255
            pixels[pixel_index + 3] = 255
        }
    }

    return Texture.from({
        resource: pixels,
        width: TEXTURE_SIZE,
        height: TEXTURE_SIZE,
        format: 'rgba8unorm',
    })
}
