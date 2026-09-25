import { expect, test } from '@playwright/test'
import { loadYoga } from 'yoga-layout/load'
import { PerspectiveCamera } from 'three/webgpu'
import EventEmitter from '../../src/core/EventEmitter'
import { PLATFORM_EVENT_NAMES } from '../../src/events/constants'
import UI from '../../src/ui/UI'
import UIWebGPU from '../../src/ui/UIWebGPU'
import UIThree from '../../src/ui/UIThree'
import UIBabylon from '../../src/ui/UIBabylon'
import UIBabylonLite from '../../src/ui/UIBabylonLite'
import UIPlayCanvas from '../../src/ui/UIPlayCanvas'
import UIWorldSpace from '../../src/ui/UIWorldSpace'
import UIWebGPUThree from '../../src/ui/UIWebGPUThree'
import UIWebGPUBabylonLite from '../../src/ui/UIWebGPUBabylonLite'

;(globalThis as any).GPUBufferUsage = { VERTEX: 1, UNIFORM: 2, STORAGE: 4, COPY_DST: 8 }
;(globalThis as any).GPUTextureUsage = { RENDER_ATTACHMENT: 1, TEXTURE_BINDING: 2 }

test('UI registers unique platform definitions and preserves the synchronous source event', async () => {
    const { canvas, listeners, registrations } = createCanvas()
    const { ui } = await UI.create({
        resources: createResources(canvas),
        defined_events: [() => ({
            types: [
                { name: 'pointerdown', platform: true, prop: 'onPointerDown', priority: 'discrete' },
                { name: 'activate', platform: true, prop: 'onActivate', priority: 'discrete' },
                { name: 'synthetic', platform: false, prop: 'onSynthetic', priority: 'discrete' },
            ],
            destroy() {},
        })],
    })
    const received_events = []
    ui.dispatchPlatformEvent = (event) => { received_events.push({ event, current_target: event.currentTarget }) }
    const source_event = { type: 'pointerdown', currentTarget: null, clientX: 10, clientY: 20 }

    try {
        ui.registerPlatformEvents()
        ui.registerPlatformEvents()
        expect([...listeners.keys()]).toEqual([...PLATFORM_EVENT_NAMES, 'activate'])
        expect(registrations.every(({ options }) => options.passive === false)).toBe(true)
        expect(listeners.get('pointerdown').size).toBe(1)
        canvas.dispatchEvent(source_event)
        expect(received_events).toHaveLength(0)

        ui.root.layout = { x: 0, y: 0, width: 200, height: 100 }
        canvas.dispatchEvent(source_event)
        expect(received_events).toEqual([{ event: source_event, current_target: canvas }])
        expect(source_event.currentTarget).toBe(null)
    } finally {
        ui.destroy()
    }
    expect([...listeners.values()].every((handlers) => handlers.size === 0)).toBe(true)
})

test('UI cleanup is idempotent and leaves other instances and native listeners intact', async () => {
    const { canvas, listeners } = createCanvas()
    let native_calls = 0
    let first_calls = 0
    let second_calls = 0
    canvas.addEventListener('pointerdown', () => native_calls++)
    const { ui: first } = await UI.create({ resources: createResources(canvas) })
    const { ui: second } = await UI.create({ resources: createResources(canvas) })
    first.root.layout = second.root.layout = { x: 0, y: 0, width: 200, height: 100 }
    first.dispatchPlatformEvent = () => { first_calls++ }
    second.dispatchPlatformEvent = () => { second_calls++ }

    first.destroy()
    first.destroy()
    canvas.dispatchEvent({ type: 'pointerdown' })
    expect([native_calls, first_calls, second_calls]).toEqual([1, 0, 1])
    expect(listeners.get('pointerdown').size).toBe(2)

    second.destroy()
    expect(listeners.get('pointerdown').size).toBe(1)
})

test('UI register_platform_events opt-out installs no listeners', async () => {
    const { canvas, listeners } = createCanvas()
    const { ui } = await UI.create({ resources: createResources(canvas), register_platform_events: false })
    expect(listeners.size).toBe(0)
    ui.destroy()
})

test('manual platform event registration can be removed and registered again, but not after destroy', async () => {
    const { canvas, listeners, registrations } = createCanvas()
    const { ui } = await UIWebGPU.create({ resources: createResources(canvas), loadYoga })
    let received_events = 0
    ui.root.layout = { x: 0, y: 0, width: 200, height: 100 }
    ui.dispatchPlatformEvent = () => { received_events++ }
    expect(listeners.size).toBe(0)

    ui.registerPlatformEvents()
    ui.registerPlatformEvents()
    expect(registrations).toHaveLength(PLATFORM_EVENT_NAMES.length)
    canvas.dispatchEvent({ type: 'pointerdown' })
    expect(received_events).toBe(1)

    ui.removePlatformEvents()
    ui.removePlatformEvents()
    canvas.dispatchEvent({ type: 'pointerdown' })
    expect(received_events).toBe(1)
    expect([...listeners.values()].every((handlers) => handlers.size === 0)).toBe(true)

    ui.registerPlatformEvents()
    canvas.dispatchEvent({ type: 'pointerdown' })
    expect(received_events).toBe(2)
    expect(registrations).toHaveLength(PLATFORM_EVENT_NAMES.length * 2)
    ui.destroy()
    ui.registerPlatformEvents()
    ui.removePlatformEvents()
    ui.destroy()
    expect(registrations).toHaveLength(PLATFORM_EVENT_NAMES.length * 2)
    expect([...listeners.values()].every((handlers) => handlers.size === 0)).toBe(true)
})

test('platform event registration skips canvases without the required event capabilities', async () => {
    const { canvas, registrations } = createCanvas()
    for (const candidate of [
        undefined,
        { getContext() {} },
        { ...canvas, addEventListener: undefined },
        { ...canvas, removeEventListener: undefined },
        { ...canvas, getBoundingClientRect: undefined },
    ]) {
        const { ui } = await UIWebGPU.create({ resources: createResources(candidate), loadYoga })
        expect(ui.registerPlatformEvents()).toBeUndefined()
        ui.removePlatformEvents()
        ui.destroy()
    }
    expect(registrations).toHaveLength(0)
})

test('automatic registration handles asynchronous dispatch failures', async () => {
    const { canvas } = createCanvas()
    const failure = new Error('Picking failed')
    const errors = []
    const { ui } = await UIWebGPU.create({ resources: createResources(canvas), loadYoga })
    ui.root.layout = { x: 0, y: 0, width: 200, height: 100 }
    ui.dispatchPlatformEvent = () => Promise.reject(failure)
    const originalError = console.error
    console.error = (error) => errors.push(error)
    ui.registerPlatformEvents()
    try {
        canvas.dispatchEvent({ type: 'pointerdown' })
        await Promise.resolve()
        expect(errors).toEqual([failure])
    } finally {
        ui.destroy()
        console.error = originalError
    }
})

test('world-space wrappers inherit the camera setter without adding event registration', () => {
    for (const UIClass of [UIThree, UIBabylon, UIBabylonLite, UIPlayCanvas]) {
        expect(UIClass.prototype.setCamera).toBe(UIWorldSpace.prototype.setCamera)
    }
})

test('UIThree registers on create but waits for a camera to dispatch, without reactivating removed listeners', async () => {
    const { canvas, listeners, registrations } = createCanvas()
    const output = await UIThree.create(worldOptions(canvas))
    const { ui } = output
    const first_camera = new PerspectiveCamera()
    const second_camera = new PerspectiveCamera()
    const received_cameras = []
    const received_events = []
    ui.events_source.on('pointerdown', (event) => received_events.push(event))
    try {
        expect(listeners.size).toBe(PLATFORM_EVENT_NAMES.length)
        expect(registrations).toHaveLength(PLATFORM_EVENT_NAMES.length)
        expect(ui.dispatchPlatformEvent({} as any)).toBeUndefined()
        ui.root.layout = { x: 0, y: 0, width: 200, height: 100 }
        canvas.dispatchEvent({ type: 'pointerdown' })
        expect(received_events).toEqual([])

        ui.dispatchPlatformEvent = () => { received_cameras.push((ui as any).camera) }
        ui.setCamera(first_camera)
        ui.setCamera(first_camera)
        expect(registrations).toHaveLength(PLATFORM_EVENT_NAMES.length)
        canvas.dispatchEvent({ type: 'pointerdown' })
        ui.setCamera(second_camera)
        canvas.dispatchEvent({ type: 'pointerdown' })
        expect(received_cameras).toEqual([first_camera, second_camera])
        expect(registrations).toHaveLength(PLATFORM_EVENT_NAMES.length)

        ui.removePlatformEvents()
        ui.setCamera(first_camera)
        canvas.dispatchEvent({ type: 'pointerdown' })
        expect(received_cameras).toEqual([first_camera, second_camera])
        expect([...listeners.values()].every((handlers) => handlers.size === 0)).toBe(true)
        expect(registrations).toHaveLength(PLATFORM_EVENT_NAMES.length)
    } finally {
        disposeThree(output)
    }
    ui.destroy()
    ui.setCamera(first_camera)
    expect((ui as any).camera).toBe(null)
    expect([...listeners.values()].every((handlers) => handlers.size === 0)).toBe(true)
    expect(registrations).toHaveLength(PLATFORM_EVENT_NAMES.length)
})

test('UIThree opt-out and raw UIWebGPUThree stay manual after setCamera', async () => {
    const { canvas, listeners } = createCanvas()
    const automatic = await UIThree.create({ ...worldOptions(canvas), register_platform_events: false })
    const raw = await UIWebGPUThree.create({ ...worldOptions(canvas), loadYoga })
    try {
        for (const { ui } of [automatic, raw]) {
            expect(ui.dispatchPlatformEvent({} as any)).toBeUndefined()
            ui.setCamera(new PerspectiveCamera())
        }
        expect(listeners.size).toBe(0)
        for (const { ui } of [automatic, raw]) {
            ui.registerPlatformEvents()
            ui.registerPlatformEvents()
        }
        expect([...listeners.values()].every((handlers) => handlers.size === 2)).toBe(true)
        automatic.ui.removePlatformEvents()
        automatic.ui.removePlatformEvents()
        expect([...listeners.values()].every((handlers) => handlers.size === 1)).toBe(true)
    } finally {
        disposeThree(automatic)
        disposeThree(raw)
    }
    expect(raw.ui.dispatchPlatformEvent({} as any)).toBeUndefined()
})

test('Babylon Lite drops queued results from the previous camera', async () => {
    const { ui, picker, source_event } = await createLiteFixture()
    const received_events = []
    ui.events_source.on('pointerdown', (event) => received_events.push(event))
    try {
        expect(ui.dispatchPlatformEvent(source_event)).toBeInstanceOf(Promise)
        await ui.dispatchPlatformEvent(source_event)
        ui.setCamera({} as any)
        let releasePick
        picker._pending = new Promise<void>((resolve) => { releasePick = resolve })
        const old_pick = ui.dispatchPlatformEvent(source_event)
        ui.setCamera({} as any)
        releasePick()
        await old_pick
        expect(received_events).toEqual([])
        await ui.dispatchPlatformEvent(source_event)
        expect(received_events).toHaveLength(1)
    } finally {
        ui.destroy()
    }
})

for (const rejects of [false, true]) {
    test(`Babylon Lite disposes its picker after queued picks ${rejects ? 'reject' : 'resolve'}`, async () => {
        const { ui, picker, scene, source_event } = await createLiteFixture()
        const failure = new Error('Picking failed')
        if (rejects) {
            Object.defineProperty(scene, 'camera', { get() { throw failure } })
        }
        let disposed = 0
        let releasePick
        picker._sceneUbo = { destroy() { disposed++ } }
        picker._pending = new Promise<void>((resolve) => { releasePick = resolve })
        ui.setCamera({} as any)
        const received_events = []
        ui.events_source.on('pointerdown', (event) => received_events.push(event))
        const pending = [ui.dispatchPlatformEvent(source_event), ui.dispatchPlatformEvent(source_event)]
        const settled = Promise.allSettled(pending)

        ui.destroy()
        ui.destroy()
        expect(disposed).toBe(0)
        releasePick()
        const results = await settled

        expect(results).toEqual(rejects
            ? [{ status: 'rejected', reason: failure }, { status: 'rejected', reason: failure }]
            : [{ status: 'fulfilled', value: undefined }, { status: 'fulfilled', value: undefined }])
        expect(disposed).toBe(1)
        expect(received_events).toEqual([])
        await ui.dispatchPlatformEvent(source_event)
        expect(disposed).toBe(1)
    })
}

async function createLiteFixture() {
    const { canvas } = createCanvas()
    const scene: any = { surface: { canvas: { width: 200, height: 100 }, engine: {} }, camera: null }
    const { ui } = await UIWebGPUBabylonLite.create({
        ...worldOptions(canvas),
        loadYoga,
        scene,
        engine: {} as any,
        createPlane: () => ({ plane: {} as any }),
    })
    const source_event = { type: 'pointerdown', clientX: 100, clientY: 50, currentTarget: canvas }
    return { ui, picker: (ui as any).picker, scene, source_event }
}

function createCanvas() {
    const listeners = new Map()
    const registrations = []
    const canvas = {
        addEventListener(type, onEvent, options?) {
            if (!listeners.has(type)) listeners.set(type, new Set())
            listeners.get(type).add(onEvent)
            registrations.push({ type, options })
        },
        removeEventListener(type, onEvent) {
            listeners.get(type)?.delete(onEvent)
        },
        getBoundingClientRect() { return { left: 0, top: 0, width: 200, height: 100 } },
        dispatchEvent(event) {
            event.currentTarget = canvas
            listeners.get(event.type)?.forEach((onEvent) => onEvent(event))
            event.currentTarget = null
        },
    }
    return { canvas, listeners, registrations }
}

function createResources(canvas): any {
    return {
        canvas,
        events: new EventEmitter(),
        format: 'rgba8unorm',
        device: {
            queue: { writeBuffer() {} },
            createBuffer() { return { destroy() {} } },
            createTexture() { return { createView() { return {} }, destroy() {} } },
            createShaderModule() { return {} },
            createRenderPipeline() { return { getBindGroupLayout() { return {} } } },
            createSampler() { return {} },
            createBindGroup() { return {} },
        },
        image_manager: { getTextureView() { return {} } },
        font_manager: { getTextureView() { return {} } },
    }
}

function worldOptions(canvas) {
    return {
        resources: createResources(canvas),
        texture_width: 200,
        texture_height: 100,
        world_width: 2,
        world_height: 1,
    }
}

function disposeThree({ ui, geometry, material, texture }) {
    ui.destroy()
    geometry.dispose()
    material.dispose()
    texture.dispose()
}
