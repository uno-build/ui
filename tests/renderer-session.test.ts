import { expect, test } from '@playwright/test'
import RendererSession from '../src/renderer/RendererSession.ts'

;(globalThis as any).GPUBufferUsage = {
    VERTEX: 1,
    COPY_DST: 2,
}

test('RendererSession initializes one device and canvas context', async () => {
    const device = createDevice()
    const adapter = {
        request_device_count: 0,
        async requestDevice() {
            this.request_device_count++
            return device
        },
    }
    const gpu = {
        request_adapter_count: 0,
        async requestAdapter() {
            this.request_adapter_count++
            return adapter
        },
        getPreferredCanvasFormat() {
            return 'bgra8unorm'
        },
    }
    ;(globalThis.navigator as any).gpu = gpu
    const render_context = createContext()
    const canvas = {
        get_context_count: 0,
        getContext() {
            this.get_context_count++
            return render_context
        },
    }
    const session = new RendererSession({ canvas })

    const first = await session.init()
    const second = await session.init()

    expect(first).toEqual(second)
    expect(gpu.request_adapter_count).toBe(1)
    expect(adapter.request_device_count).toBe(1)
    expect(canvas.get_context_count).toBe(1)
    expect(render_context.configurations).toEqual([
        {
            device,
            format: 'bgra8unorm',
            alphaMode: 'premultiplied',
        },
    ])
    expect(render_context.receivers).toEqual([render_context])
    expect(device.buffers).toHaveLength(1)
    expect(device.shader_modules).toHaveLength(1)
})

test('RendererSession shares one canvas texture until endFrame', async () => {
    const device = createDevice()
    const render_context = createContext({ present: true })
    const session = await createSession({ device, render_context })

    const first_texture = session.context.getCurrentTexture()

    expect(session.context.getCurrentTexture()).toBe(first_texture)
    expect(render_context.texture_requests).toBe(1)

    session.endFrame()

    expect(render_context.present_count).toBe(1)
    expect(render_context.receivers.at(-1)).toBe(render_context)
    expect(session.context.getCurrentTexture()).not.toBe(first_texture)
    expect(render_context.texture_requests).toBe(2)
})

test('RendererSession context forwards native configure and present with the native receiver', async () => {
    const device = createDevice()
    const render_context = createContext({ present: true })
    const session = await createSession({ device, render_context })
    const configuration = { device, format: 'bgra8unorm', alphaMode: 'opaque' }

    session.context.getCurrentTexture()
    session.context.configure(configuration)
    session.context.getCurrentTexture()
    session.context.present()

    expect(render_context.configurations.at(-1)).toBe(configuration)
    expect(render_context.present_count).toBe(1)
    expect(render_context.receivers.slice(-2)).toEqual([render_context, render_context])
    expect(render_context.texture_requests).toBe(2)
    session.context.getCurrentTexture()
    expect(render_context.texture_requests).toBe(3)
    expect(session.context.canvas).toBe(render_context.canvas)
    expect(session.context.__brand).toBe('GPUCanvasContext')
    session.context.unconfigure()
    expect(render_context.unconfigure_count).toBe(1)
    expect(render_context.calls.every(({ receiver }) => receiver === render_context)).toBe(true)
})

test('RendererSession rejects a canvas configuration with a different device or format', async () => {
    const device = createDevice()
    const render_context = createContext()
    const session = await createSession({ device, render_context })

    expect(() => session.context.configure({ device, format: 'rgba16float' })).toThrow(
        /must use the session device and format/,
    )
    expect(() => session.context.configure({ device: {}, format: 'bgra8unorm' })).toThrow(
        /must use the session device and format/,
    )
    expect(render_context.configurations).toHaveLength(1)
})

test('RendererSession endFrame releases the web canvas texture without native present', async () => {
    const device = createDevice()
    const render_context = createContext()
    const session = await createSession({ device, render_context })

    const first_texture = session.getCurrentTexture()
    session.endFrame()

    expect(session.getCurrentTexture()).not.toBe(first_texture)
    expect(render_context.texture_requests).toBe(2)
})

test('RendererSession caches pipelines and samplers by their render configuration', async () => {
    const device = createDevice()
    const session = await createSession({ device, render_context: createContext() })

    const srgb_pipeline = session.getPipeline({ srgb: true })
    const linear_pipeline = session.getPipeline({ srgb: false })
    const linear_sampler = session.getImageSampler({ min_filter: 'linear', mag_filter: 'linear' })
    const nearest_sampler = session.getImageSampler({ min_filter: 'nearest', mag_filter: 'nearest' })

    expect(session.getPipeline({ srgb: true })).toBe(srgb_pipeline)
    expect(linear_pipeline).not.toBe(srgb_pipeline)
    expect(session.getImageSampler({ min_filter: 'linear', mag_filter: 'linear' })).toBe(linear_sampler)
    expect(nearest_sampler).not.toBe(linear_sampler)
    expect(device.pipelines).toHaveLength(2)
    expect(device.samplers).toHaveLength(2)
})

async function createSession({ device, render_context }) {
    ;(globalThis.navigator as any).gpu = {
        getPreferredCanvasFormat() {
            return 'bgra8unorm'
        },
    }
    return RendererSession.create({
        canvas: {
            getContext() {
                return render_context
            },
        },
        device,
    })
}

function createContext({ present = false } = {}) {
    let context
    const canvas = { id: 'canvas' }
    context = {
        configurations: [],
        calls: [],
        receivers: [],
        texture_requests: 0,
        present_count: 0,
        unconfigure_count: 0,
        configure(configuration) {
            this.calls.push({ method: 'configure', receiver: this })
            this.receivers.push(this)
            this.configurations.push(configuration)
        },
        unconfigure() {
            this.calls.push({ method: 'unconfigure', receiver: this })
            this.receivers.push(this)
            this.unconfigure_count++
        },
        getCurrentTexture() {
            this.calls.push({ method: 'getCurrentTexture', receiver: this })
            this.receivers.push(this)
            this.texture_requests++
            return { id: this.texture_requests }
        },
    }

    if (present) {
        ;(context as any).present = function () {
            this.calls.push({ method: 'present', receiver: this })
            this.receivers.push(this)
            this.present_count++
        }
    }

    Object.defineProperties(context, {
        __brand: {
            get() {
                if (this !== context) throw new Error('Expected GPUCanvasContext')
                return 'GPUCanvasContext'
            },
        },
        canvas: {
            get() {
                if (this !== context) throw new Error('Expected GPUCanvasContext')
                return canvas
            },
        },
    })

    return context
}

function createDevice() {
    return {
        buffers: [],
        shader_modules: [],
        pipelines: [],
        samplers: [],
        queue: {
            writeBuffer() {},
        },
        createBuffer(descriptor) {
            const buffer = { descriptor }
            this.buffers.push(buffer)
            return buffer
        },
        createShaderModule(descriptor) {
            const shader_module = { descriptor }
            this.shader_modules.push(shader_module)
            return shader_module
        },
        createRenderPipeline(descriptor) {
            const pipeline = { descriptor }
            this.pipelines.push(pipeline)
            return pipeline
        },
        createSampler(descriptor) {
            const sampler = { descriptor }
            this.samplers.push(sampler)
            return sampler
        },
    }
}
