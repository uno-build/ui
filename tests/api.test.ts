import { test, expect } from '@playwright/test'
import WebGPUResources from '../src/renderer/webgpu/WebGPUResources'
import UIWorldSpace from '../src/ui/UIWorldSpace.ts'
import TestRenderer from './TestRenderer.ts'
import TestUI from './TestUI.ts'

test('UI and Node api creates, styles, updates, and removes nodes', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    ui.root.style('width', '200px')
    ui.root.style('height', '200px')

    const child = ui.create()
    child.style('width', '120px')
    child.style('backgroundColor', '#123')
    const sibling = ui.create()
    const grandchild = ui.create()

    ui.root.add(child)
    ui.root.add(sibling)
    child.add(grandchild)

    child.style('height', '40px')
    sibling.style('marginLeft', '10%')

    expect(() => {
        ui.create().style('backgroundColor', 'red')
    }).toThrow(/invalid value 'red' for property 'backgroundColor': expected hex color/)
    expect(() => {
        child.style('width', true)
    }).toThrow(/style value must be a string/)

    expect(child.styles).toMatchObject({
        width: {
            value: '120px',
            parsed: { value: 120, kind: 'px' },
        },
        backgroundColor: {
            value: '#123',
            parsed: { rgba: [17, 34, 51, 255] },
        },
        height: {
            value: '40px',
            parsed: { value: 40, kind: 'px' },
        },
    })
    expect(sibling.styles.marginLeft).toEqual({
        value: '10%',
        parsed: { value: 10, kind: '%' },
    })

    expect([...ui.nodes]).toEqual([child, sibling, grandchild])
    expect(child.parent).toBe(ui.root)
    expect(sibling.parent).toBe(ui.root)
    expect(grandchild.parent).toBe(child)
    expect(ui.root.children).toEqual([child, sibling])
    expect(child.children).toEqual([grandchild])
    expect(sibling.children).toEqual([])
    expect(grandchild.children).toEqual([])
    expect(child.path).toEqual([0])
    expect(sibling.path).toEqual([1])
    expect(grandchild.path).toEqual([0, 0])

    ui.update()
    ui.draw()

    expect([...ui.nodes].toSorted(byId)).toEqual([child, sibling, grandchild])
    expect([...ui.nodes]).toEqual([child, grandchild, sibling])
    expect(ui.root.layout).toMatchObject({
        x: 0,
        y: 0,
        width: 200,
        height: 200,
    })
    expect(child.layout).toMatchObject({ x: 0, y: 0, width: 120, height: 40 })
    expect(sibling.layout).toMatchObject({
        x: 140,
        y: 0,
        width: 0,
        height: 200,
    })
    expect(grandchild.layout).toMatchObject({
        x: 0,
        y: 0,
        width: 0,
        height: 40,
    })

    ui.root.remove(child)

    expect([...ui.nodes]).toEqual([sibling])
    expect(child.element).toBe(null)
    expect(grandchild.element).toBe(null)
    expect(ui.root.children).toEqual([sibling])
    expect(child.children).toEqual([])
    expect(grandchild.children).toEqual([])
    expect(child.parent).toBe(null)
    expect(grandchild.parent).toBe(null)

    ui.update()
    ui.draw()

    expect(sibling.layout).toMatchObject({ x: 20, y: 0, width: 0, height: 200 })
})

test('UI destroy releases attached and detached nodes once', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    const root = ui.root
    const parent = ui.create()
    const child = ui.create()
    const detached = ui.create()
    let destroy_count = 0
    let destroyed_nodes
    const destroy = renderer.destroy.bind(renderer)

    renderer.destroy = (nodes) => {
        destroy_count++
        destroyed_nodes = nodes
        destroy(nodes)
    }

    root.add(parent)
    parent.add(child)
    detached.style('width', '20px')

    ui.destroy()
    ui.destroy()

    expect(destroy_count).toBe(1)
    expect(destroyed_nodes).toEqual([root, parent, child, detached])
    expect(ui.destroyed).toBe(true)
    expect(ui.root).toBe(null)
    expect(ui.renderer).toBe(null)
    expect((ui as any).nodes).toEqual([])
    expect((ui as any).created_nodes.size).toBe(0)
    expect((renderer as any).pending_styles).toEqual([])

    for (const node of [root, parent, child, detached]) {
        expect(node.ui).toBe(null)
        expect(node.parent).toBe(null)
        expect(node.children).toEqual([])
        expect(node.element).toBe(null)
    }

    expect(ui.create()).toBe(undefined)
    expect(ui.update()).toBe(undefined)
    expect(ui.draw()).toBe(undefined)
    expect(() => detached.style('width', '40px')).not.toThrow()
})

test('UIWorldSpace destroy releases only its GPU texture once', () => {
    let renderer_destroy_count = 0
    let texture_destroy_count = 0
    const ui = Object.assign(Object.create(UIWorldSpace.prototype), {
        root: null,
        renderer: {
            destroy(nodes) {
                renderer_destroy_count++
                expect(nodes).toEqual([])
            },
        },
        nodes: [],
        created_nodes: new Set(),
        destroyed: false,
        gpu_texture: {
            destroy() {
                texture_destroy_count++
            },
        },
        gpu_texture_view: {},
    })

    ui.destroy()
    ui.destroy()

    expect(renderer_destroy_count).toBe(1)
    expect(texture_destroy_count).toBe(1)
    expect(ui.gpu_texture).toBe(null)
    expect(ui.gpu_texture_view).toBe(null)
})

test('UI stores context-dependent styles without resolving them', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })

    const node = ui.create()
    node.style('width', '2rem')
    node.style('height', '20vw')
    node.style('minHeight', '30vh')
    node.style('fontSize', '1.25rem')
    node.style('top', '-0.5rem')
    expect(node.styles).toMatchObject({
        width: {
            value: '2rem',
            parsed: { value: 2, kind: 'rem' },
        },
        height: {
            value: '20vw',
            parsed: { value: 20, kind: 'vw' },
        },
        minHeight: {
            value: '30vh',
            parsed: { value: 30, kind: 'vh' },
        },
        fontSize: {
            value: '1.25rem',
            parsed: { value: 1.25, kind: 'rem' },
        },
        top: {
            value: '-0.5rem',
            parsed: { value: -0.5, kind: 'rem' },
        },
    })

    ui.setRootSize(20)
    ui.setViewport(320, 180)
    node.style('width', '2rem')
    node.style('height', '20vw')
    node.style('minHeight', '30vh')
    node.style('fontSize', '1.25rem')
    node.style('top', '-0.5rem')
    expect(node.styles).toMatchObject({
        width: {
            value: '2rem',
            parsed: { value: 2, kind: 'rem' },
        },
        height: {
            value: '20vw',
            parsed: { value: 20, kind: 'vw' },
        },
        minHeight: {
            value: '30vh',
            parsed: { value: 30, kind: 'vh' },
        },
        fontSize: {
            value: '1.25rem',
            parsed: { value: 1.25, kind: 'rem' },
        },
        top: {
            value: '-0.5rem',
            parsed: { value: -0.5, kind: 'rem' },
        },
    })
})

test('Node remove removes descendants', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })

    const parent = ui.create()
    const child = ui.create()
    const grandchild = ui.create()
    const sibling = ui.create()

    ui.root.add(parent)
    ui.root.add(sibling)
    parent.add(child)
    child.add(grandchild)

    expect(ui.nodes.length).toBe(4)
    expect(ui.root.children).toEqual([parent, sibling])
    expect(parent.children).toEqual([child])
    expect(child.children).toEqual([grandchild])

    ui.root.remove(parent)

    expect(ui.nodes.length).toBe(1)
    expect([...ui.nodes]).toEqual([sibling])
    expect(ui.root.children).toEqual([sibling])
    expect(parent.children).toEqual([])
    expect(child.children).toEqual([])
    expect(grandchild.children).toEqual([])
    expect(parent.parent).toBe(null)
    expect(child.parent).toBe(null)
    expect(grandchild.parent).toBe(null)
    expect(parent.element).toBe(null)
    expect(child.element).toBe(null)
    expect(grandchild.element).toBe(null)
})

test('Node add and remove throw for invalid tree operations', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })

    const child = ui.create()
    const detached_parent = ui.create()
    const detached_child = ui.create()

    ui.root.add(child)

    expect(() => {
        ui.root.add(child)
    }).toThrow(/child already added/)
    expect(() => {
        detached_parent.add(detached_child)
    }).toThrow(/cannot add child before adding parent/)
    expect(() => {
        ui.root.remove(detached_child)
    }).toThrow(/child not found/)
})

test('Node remove discards pending styles', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })

    const child = ui.create()
    child.style('width', '120px')
    child.style('backgroundColor', '#123')

    ui.root.add(child)
    ui.root.remove(child)

    expect(() => {
        ui.update()
        ui.draw()
    }).not.toThrow()
    expect([...ui.nodes]).toEqual([])
    expect(child.element).toBe(null)
})

test('Node text stores, replaces, and clears text content', async () => {
    const renderer = new TestRenderer()
    renderer.getTextMeasure = () => ({ width: 10, height: 10 })
    const ui = await TestUI.create({ renderer })

    const child = ui.create()
    ui.root.add(child)
    expect(child.isTextNode()).toBe(false)
    expect(child.hasTextContent()).toBe(false)

    child.text('Hello')
    ui.update()
    ui.draw()
    expect(child.isTextNode()).toBe(true)
    expect(child.hasTextContent()).toBe(true)
    expect(child.text_content).toBe('Hello')

    child.text('World')
    ui.update()
    ui.draw()
    expect(child.text_content).toBe('World')

    child.text('')
    ui.update()
    ui.draw()
    expect(child.isTextNode()).toBe(true)
    expect(child.hasTextContent()).toBe(false)
    expect(child.text_content).toBe('')
})

test('Node text uses intrinsic size unless dimensions are explicit', async () => {
    const renderer = new TestRenderer()
    renderer.getTextMeasure = (node) => {
        const font_size = node.styles.fontSize?.parsed.value ?? 16
        const font_scale = node.styles.fontFamily?.value === 'Wide' ? 2 : 1
        return {
            width: node.text_content.length * font_size * font_scale,
            height: font_size * 2,
        }
    }
    const ui = await TestUI.create({ renderer })
    ui.root.style('width', '500px')
    ui.root.style('height', '100px')
    ui.root.style('alignItems', 'flex-start')

    const child = ui.create()
    expect(child.text_content).toBeUndefined()

    child.style('width', '300px')
    child.style('height', '80px')
    ui.root.add(child)
    ui.update()

    child.text('Hey')
    ui.update()

    expect(child.styles.width.value).toBe('300px')
    expect(child.styles.height.value).toBe('80px')
    expect(child.layout).toMatchObject({ width: 300, height: 80 })

    child.style('width', '400px')
    child.style('height', '90px')
    child.style('fontSize', '20px')
    ui.update()

    expect(child.styles.width.value).toBe('400px')
    expect(child.styles.height.value).toBe('90px')
    expect(child.layout).toMatchObject({ width: 400, height: 90 })

    child.text('Hello')
    ui.update()

    expect(child.layout).toMatchObject({ width: 400, height: 90 })

    child.style('fontFamily', 'Wide')
    ui.update()

    expect(child.layout).toMatchObject({ width: 400, height: 90 })

    child.style('width', 'auto')
    child.style('height', 'auto')
    ui.update()

    expect(child.layout).toMatchObject({ width: 200, height: 40 })
})

test('Node text cannot have children', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })

    const parent = ui.create()
    const child = ui.create()
    ui.root.add(parent)
    parent.add(child)

    expect(() => parent.text('Parent')).toThrow(/Nodes with text cannot have children/)

    const text = ui.create()
    text.text('Text')
    ui.root.add(text)

    expect(() => text.add(ui.create())).toThrow(/Nodes with text cannot have children/)
})

test('Node style does not invalidate text measurement directly', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    const invalidated_nodes = []
    const node = ui.create()
    node.text('Text')
    renderer.invalidateTextNode = (node) => {
        invalidated_nodes.push(node)
    }

    node.style('fontSize', '20px')

    expect(invalidated_nodes).toEqual([])
})

test('Node stores normalized text measurement styles', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    const node = ui.create()

    node.style('letter-spacing', '0.125rem')

    expect(node.styles.letterSpacing).toEqual({
        value: '0.125rem',
        parsed: { value: 0.125, kind: 'rem' },
    })
})

test('overflow shorthand and longhands follow assignment order', async () => {
    const renderer = new TestRenderer()
    const ui = await TestUI.create({ renderer })
    const node = ui.create()

    node.style('overflow', 'scroll')
    node.style('overflowX', 'hidden')

    expect(node.styles.overflowX.parsed.enum).toBe(1)
    expect(node.styles.overflowY.parsed.enum).toBe(2)

    node.style('overflow', 'visible')
    node.style('overflow-y', 'scroll')

    expect(node.styles.overflowX.parsed.enum).toBe(0)
    expect(node.styles.overflowY.parsed.enum).toBe(2)
})

test('UI forwards device pixel ratio changes to the renderer', async () => {
    const renderer = new TestRenderer()
    const device_pixel_ratios = []
    renderer.setDevicePixelRatio = (value) => {
        device_pixel_ratios.push(value)
    }

    const ui = await TestUI.create({ renderer })
    ui.setDevicePixelRatio(2)

    expect(device_pixel_ratios).toEqual([2])
})

test('UI forwards root size changes to the renderer', async () => {
    const renderer = new TestRenderer()
    const root_sizes = []
    renderer.setRootSize = (value) => {
        root_sizes.push(value)
    }

    const ui = await TestUI.create({ renderer })
    ui.setRootSize(20)

    expect(root_sizes).toEqual([20])
})

test('UI forwards viewport changes to the renderer', async () => {
    const renderer = new TestRenderer()
    const viewports = []
    renderer.setViewport = (width, height) => {
        viewports.push([width, height])
    }

    const ui = await TestUI.create({ renderer })
    ui.setViewport(320, 180)

    expect(viewports).toEqual([[320, 180]])
})

test('WebGPUResources image api delegates to the image manager', () => {
    const image = createImage('/assets/first.png', 32, 32)
    const calls = []
    const webgpu = new (WebGPUResources as any)({})
    webgpu.image_manager = {
        imageUpload(src, next_image) {
            calls.push({ kind: 'upload', src, image: next_image })
        },
        imageDispose(src) {
            calls.push({ kind: 'dispose', src })
        },
    }

    webgpu.registerImage('/assets/Avatar.png', image)
    webgpu.disposeImage('/assets/Avatar.png')
    expect(calls).toEqual([
        { kind: 'upload', src: '/assets/Avatar.png', image },
        { kind: 'dispose', src: '/assets/Avatar.png' },
    ])
})

test('WebGPUResources font api delegates to the font manager', () => {
    const calls = []
    const webgpu = new (WebGPUResources as any)({})
    webgpu.font_manager = {
        fontRegister(name, image, json) {
            calls.push({ kind: 'register', name, image, json })
        },
        fontDispose(name) {
            calls.push({ kind: 'dispose', name })
        },
    }
    const image = createImage('/assets/fonts/Poppins.png', 484, 484)
    const json = { atlas: { type: 'msdf' } }

    webgpu.registerFont('Poppins', image, json)
    webgpu.disposeFont('Poppins')

    expect(calls).toEqual([
        { kind: 'register', name: 'Poppins', image, json },
        { kind: 'dispose', name: 'Poppins' },
    ])
})

test('WebGPUResources dispose resets both managers without releasing the shared context', () => {
    let image_dispose_count = 0
    let font_dispose_count = 0
    const image_manager = {
        dispose() {
            image_dispose_count++
        },
    }
    const font_manager = {
        dispose() {
            font_dispose_count++
        },
    }
    const webgpu = new (WebGPUResources as any)({
        canvas: {},
        adapter: {},
        device: {},
        context: {},
        format: 'bgra8unorm',
    })
    webgpu.image_manager = image_manager
    webgpu.font_manager = font_manager

    webgpu.dispose()

    expect(image_dispose_count).toBe(1)
    expect(font_dispose_count).toBe(1)
    expect(webgpu.image_manager).toBe(image_manager)
    expect(webgpu.font_manager).toBe(font_manager)
    expect(webgpu.canvas).not.toBe(null)
    expect(webgpu.adapter).not.toBe(null)
    expect(webgpu.device).not.toBe(null)
    expect(webgpu.context).not.toBe(null)
    expect(webgpu.format).toBe('bgra8unorm')
})

function byId(a, b) {
    return a.id - b.id
}

function createImage(src, width, height) {
    return {
        src,
        width,
        height,
        bitmap: { src },
        preventBleeding: false,
    }
}
