import { expect, test } from '@playwright/test'
import RendererThreeWorldSpace from '../src/renderer/RendererThreeWorldSpace.ts'
import RendererWebGPU from '../src/renderer/RendererWebGPU.ts'
import { createDomUI } from 'uno-ui/dom'
import { createThreeWorldSpaceUI } from 'uno-ui/three'
import { createOverlayUI, createWebGPU } from 'uno-ui/webgpu'

test('createWebGPU returns the configured resources and loadYoga reference', async () => {
    const device = { id: 'device' }
    const adapter = {
        requestDevice: (descriptor) => {
            expect(descriptor).toEqual({ requiredLimits: { maxStorageBuffersInVertexStage: 2 } })
            return device
        },
    }
    const configurations = []
    const context = {
        configure: (configuration) => configurations.push(configuration),
    }
    const canvas = {
        getContext: (name) => {
            expect(name).toBe('webgpu')
            return context
        },
    }
    const loadYoga = () => {}
    const original_gpu = (globalThis.navigator as any).gpu

    Object.defineProperty(globalThis.navigator, 'gpu', {
        configurable: true,
        value: {
            requestAdapter: (options) => {
                expect(options).toEqual({ featureLevel: 'compatibility' })
                return adapter
            },
            getPreferredCanvasFormat: () => 'rgba8unorm',
        },
    })

    try {
        const webgpu = await createWebGPU({ canvas, loadYoga })

        expect(webgpu).toEqual({
            canvas,
            loadYoga,
            adapter,
            device,
            context,
            format: 'rgba8unorm',
        })
        expect(configurations).toEqual([
            {
                device,
                format: 'rgba8unorm',
                alphaMode: 'premultiplied',
            },
        ])
    } finally {
        Object.defineProperty(globalThis.navigator, 'gpu', {
            configurable: true,
            value: original_gpu,
        })
    }
})

test('createOverlayUI returns independent initialized UIs using webgpu loadYoga', async () => {
    const original_init = RendererWebGPU.prototype.init
    const loadYoga = () => {}
    const engines = []
    const consumed_loaders = []
    const webgpu = {
        canvas: {},
        loadYoga,
        adapter: {},
        device: {},
        context: {},
        format: 'rgba8unorm',
    }

    RendererWebGPU.prototype.init = async function () {
        const engine = { createNode() {} }
        ;(this as any).engine = engine
        engines.push(engine)
        consumed_loaders.push((this as any).loadYoga)
    }

    try {
        const first = await createOverlayUI({ webgpu })
        const second = await createOverlayUI({ webgpu })

        expect(Object.keys(first)).toEqual(['ui'])
        expect(Object.keys(second)).toEqual(['ui'])
        expect(first.ui.root).not.toBe(second.ui.root)
        expect((first.ui as any).init).toBeUndefined()
        expect(engines[0]).not.toBe(engines[1])
        expect(consumed_loaders).toEqual([loadYoga, loadYoga])
    } finally {
        RendererWebGPU.prototype.init = original_init
    }
})

test('createThreeWorldSpaceUI returns only ui and plane', async () => {
    const original_init = RendererThreeWorldSpace.prototype.init
    const plane = { id: 'plane' }
    const webgpu = {
        canvas: {},
        loadYoga() {},
        adapter: {},
        device: {},
        context: {},
        format: 'rgba8unorm',
    }

    RendererThreeWorldSpace.prototype.init = async function () {
        ;(this as any).engine = { createNode() {} }
        return { plane }
    }

    try {
        const result = await createThreeWorldSpaceUI({
            webgpu,
            texture_width: 100,
            texture_height: 50,
            world_width: 2,
            world_height: 1,
        })

        expect(Object.keys(result)).toEqual(['ui', 'plane'])
        expect(result.ui.root).not.toBeNull()
        expect(result.plane).toBe(plane)
    } finally {
        RendererThreeWorldSpace.prototype.init = original_init
    }
})

test('createDomUI uses the container as its root element', async () => {
    const original_document = globalThis.document
    const container = {}

    ;(globalThis as any).document = {
        body: {
            parentElement: { style: {} },
        },
    }

    try {
        const result = await createDomUI({ container })

        expect(Object.keys(result)).toEqual(['ui'])
        expect(result.ui.root.element).toBe(container)
    } finally {
        ;(globalThis as any).document = original_document
    }
})
