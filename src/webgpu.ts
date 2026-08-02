import { createUI } from './UI'
import RendererWebGPU from './renderer/RendererWebGPU'

export async function createWebGPU({ canvas, loadYoga }) {
    const adapter = await globalThis.navigator.gpu.requestAdapter({ featureLevel: 'compatibility' })
    const device = await adapter.requestDevice({
        requiredLimits: {
            maxStorageBuffersInVertexStage: 2,
        },
    })
    const context = canvas.getContext('webgpu')
    const format = globalThis.navigator.gpu.getPreferredCanvasFormat()
    context.configure({
        device,
        format,
        alphaMode: 'premultiplied',
    })

    return {
        canvas,
        loadYoga,
        adapter,
        device,
        context,
        format,
    }
}

export async function createOverlayUI({ webgpu }) {
    const renderer = new RendererWebGPU({ webgpu })
    const { ui } = await createUI({ renderer })
    return { ui }
}
