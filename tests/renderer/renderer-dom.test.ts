import { expect, test } from '@playwright/test'
import { OPERATIONS, RESOURCE_EVENT } from '../../src/core/constants.ts'
import Operations from '../../src/core/Operations.ts'
import Resources from '../../src/core/Resources.ts'
import RendererDom from '../../src/renderer/RendererDom.ts'
import ResourcesDom from '../../src/renderer/dom/ResourcesDom.ts'
import { isSameLayout } from '../../src/layouter/utils.ts'
import Style from '../../src/style'
import { OVERFLOW } from '../../src/style/constants.ts'
import TestUI from '../utils/TestUI.ts'

test('layout comparison supports DOM layouts without padding', () => {
    const border = { top: 0, right: 0, bottom: 0, left: 0 }
    const layout = { x: 0, y: 0, width: 100, height: 50, border }

    expect(isSameLayout(layout, { ...layout, border: { ...border } })).toBe(true)
    expect(isSameLayout(layout, { ...layout, border: { ...border, left: 1 } })).toBe(false)
})

test('RendererDom sets the document root font size', () => {
    const document_element = { style: {} }
    const original_document = (globalThis as any).document

    ;(globalThis as any).document = {
        body: {
            parentElement: document_element,
        },
    }

    try {
        const renderer = new RendererDom({ resources: ResourcesDom.create({ canvas: {} }) })

        renderer.setRootSize(20)

        expect(document_element.style.fontSize).toBe('20px')
    } finally {
        ;(globalThis as any).document = original_document
    }
})

test('RendererDom keeps viewport units as native CSS values', () => {
    const renderer = new RendererDom({ resources: ResourcesDom.create({ canvas: {} }) })
    const element = { style: {} }
    const node = {}
    ;(renderer as any).elements.set(node, element)
    ;(renderer as any).updateStyle(node, Style.resolveStyle('width', '20vw'))
    ;(renderer as any).updateStyle(node, Style.resolveStyle('fontSize', '5vh'))

    expect(element.style).toEqual({
        width: '20vw',
        fontSize: '5vh',
    })
})

test('RendererDom maps textStroke only to webkitTextStroke', () => {
    const renderer = new RendererDom({ resources: ResourcesDom.create({ canvas: {} }) })
    const element = { style: {} }
    const node = {}
    ;(renderer as any).elements.set(node, element)
    ;(renderer as any).updateStyle(node, Style.resolveStyle('textStroke', '4PX #1234'))

    expect(element.style).toEqual({
        webkitTextStroke: '4px #1234',
    })
    ;(renderer as any).updateStyle(node, Style.resolveStyle('textStroke', 'unset'))

    expect(element.style).toEqual({
        webkitTextStroke: 'unset',
    })
})

test('RendererDom maps whiteSpace and restores its default with unset', () => {
    const renderer = new RendererDom({ resources: ResourcesDom.create({ canvas: {} }) })
    const element = { style: {} }
    const node = {}
    ;(renderer as any).elements.set(node, element)
    ;(renderer as any).updateStyle(node, Style.resolveStyle('whiteSpace', 'nowrap'))

    expect(element.style.whiteSpace).toBe('nowrap')

    ;(renderer as any).updateStyle(node, Style.resolveStyle('whiteSpace', 'unset'))

    expect(element.style.whiteSpace).toBe('pre-wrap')
})

test('RendererDom resolves natural and unset lineHeight from registered font metrics', () => {
    const resources = ResourcesDom.create({ canvas: {} })
    const renderer = new RendererDom({ resources })
    const element = { style: {} }
    const node = {
        styles: {
            fontFamily: { value: 'Poppins-Regular' },
        },
    }
    ;(renderer as any).elements.set(node, element)
    resources.registerFont('Poppins-Regular', { image: {}, data: { metrics: { lineHeight: 1.5 } } })
    ;(renderer as any).updateStyle(node, Style.resolveStyle('fontFamily', 'Poppins-Regular'))
    expect(element.style.lineHeight).toBe('1.5')

    const explicit_line_height = Style.resolveStyle('lineHeight', '20px')
    node.styles.lineHeight = explicit_line_height.expanded[0]
    ;(renderer as any).updateStyle(node, explicit_line_height)
    expect(element.style.lineHeight).toBe('20px')

    const unset_line_height = Style.resolveStyle('lineHeight', 'unset')
    node.styles.lineHeight = unset_line_height.expanded[0]
    ;(renderer as any).updateStyle(node, unset_line_height)
    expect(element.style.lineHeight).toBe('1.5')
})

test('ResourcesDom inherits the canvas resource', () => {
    const canvas = {}
    const resources = ResourcesDom.create({ canvas })

    expect(resources).toBeInstanceOf(Resources)
    expect(resources.canvas).toBe(canvas)
})

test('ResourcesDom rejects duplicate fonts and allows registration after disposal', () => {
    const resources = ResourcesDom.create({ canvas: {} })
    const first_metrics = { lineHeight: 1.5 }
    const second_metrics = { lineHeight: 2 }
    const changes = []
    resources.events.on(RESOURCE_EVENT.FONT, (event_data) => {
        expect(event_data).toBeUndefined()
        changes.push(resources.getFont('Poppins'))
    })

    resources.registerFont('Poppins', { image: {}, data: { metrics: first_metrics } })

    expect(() => resources.registerFont('Poppins', { image: {}, data: { metrics: second_metrics } })).toThrow(
        'Font "Poppins" is already registered.',
    )
    expect(resources.getFont('Poppins')).toBe(first_metrics)
    expect(changes).toEqual([first_metrics])

    resources.disposeFont('missing')
    resources.disposeFont('Poppins')
    resources.registerFont('Poppins', { image: {}, data: { metrics: second_metrics } })

    expect(resources.getFont('Poppins')).toBe(second_metrics)
    expect(changes).toEqual([first_metrics, undefined, second_metrics])
})

test('ResourcesDom rejects duplicate images and allows registration after disposal', () => {
    const resources = ResourcesDom.create({ canvas: {} })
    const first_image = { src: '/assets/first.png', width: 32, height: 16 }
    const second_image = { src: '/assets/second.png', width: 64, height: 48 }
    const changes = []
    resources.events.on(RESOURCE_EVENT.IMAGE, (event_data) => {
        expect(event_data).toBeUndefined()
        changes.push(resources.getImage('avatar'))
    })

    resources.registerImage('avatar', first_image)

    expect(() => resources.registerImage('avatar', second_image)).toThrow('Image "avatar" is already registered.')
    expect(resources.getImage('avatar')).toBe(first_image)
    expect(resources.getImageSize('avatar')).toEqual({ width: 32, height: 16 })
    expect(changes).toEqual([first_image])

    resources.disposeImage('missing')
    resources.disposeImage('avatar')
    expect(resources.getImageSize('avatar')).toBeUndefined()
    resources.registerImage('avatar', second_image)

    expect(resources.getImage('avatar')).toBe(second_image)
    expect(resources.getImageSize('avatar')).toEqual({ width: 64, height: 48 })
    expect(changes).toEqual([first_image, undefined, second_image])
})

test('RendererDom resolves backgroundImage from registered images', () => {
    const resources = ResourcesDom.create({ canvas: {} })
    const renderer = new RendererDom({ resources })
    const element = { style: {} }
    const node = {
        styles: {
            backgroundRepeat: { value: 'repeat-x' },
        },
    }
    ;(renderer as any).elements.set(node, element)
    resources.registerImage('avatar', { src: '/assets/avatar.png' })
    ;(renderer as any).updateStyle(node, Style.resolveStyle('backgroundImage', 'avatar'))

    expect(element.style).toEqual({
        backgroundImage: 'url("/assets/avatar.png")',
        backgroundRepeat: 'repeat-x',
    })
})

test('ResourcesDom queues loaded web fonts and retains events emitted after capture', async () => {
    const original_document = (globalThis as any).document
    const fonts = createFontSet()
    ;(globalThis as any).document = { fonts }
    const resources = ResourcesDom.create({ canvas: createDomElement() })
    const renderer = new RendererDom({ resources })
    const ui = await TestUI.create({ renderer, resources })
    const operations = (ui as any).operations

    try {
        operations.capture()
        operations.consume()
        expect(operations.capture()).toBe(false)

        fonts.dispatchEvent({ type: 'loadingdone' })
        expect(operations.capture()).toBe(true)
        expect(operations.items).toEqual([{ op: OPERATIONS.RESOURCE_FONT }])
        expect(renderer.prepareLayout(new Set(), operations)).toBe(true)
        expect(operations.needUpdateLayout()).toBe(false)

        fonts.dispatchEvent({ type: 'loadingdone' })
        operations.consume()
        expect(operations.capture()).toBe(true)
        expect(operations.items).toEqual([{ op: OPERATIONS.RESOURCE_FONT }])
        operations.consume()
        expect(operations.capture()).toBe(false)
    } finally {
        ui.destroy()
        ;(globalThis as any).document = original_document
    }
})

test('RendererDom refreshes detached background images after registration and disposal', () => {
    const resources = ResourcesDom.create({ canvas: {} })
    const renderer = new RendererDom({ resources })
    const operations = new Operations()
    resources.events.on(RESOURCE_EVENT.IMAGE, () => operations.add({ op: OPERATIONS.RESOURCE_IMAGE }))
    const background_image = Style.resolveStyle('backgroundImage', 'avatar')
    const node = {
        parent: null,
        styles: {
            backgroundImage: background_image.expanded[0],
            backgroundRepeat: { value: 'repeat-x' },
        },
    }
    const element = { style: {} }
    ;(renderer as any).elements.set(node, element)
    renderer.updateStyle(node, background_image)
    expect(element.style.backgroundImage).toBe('none')

    resources.registerImage('avatar', { src: '/assets/avatar.png' })
    expect(operations.capture()).toBe(true)
    expect(operations.items).toEqual([{ op: OPERATIONS.RESOURCE_IMAGE }])
    operations.setUpdateLayout(renderer.prepareLayout(new Set([node]), operations))

    expect(element.style.backgroundImage).toBe('url("/assets/avatar.png")')
    expect(element.style.backgroundRepeat).toBe('repeat-x')
    operations.consume()
    expect(operations.capture()).toBe(false)

    resources.disposeImage('avatar')
    expect(operations.capture()).toBe(true)
    operations.setUpdateLayout(renderer.prepareLayout(new Set([node]), operations))
    expect(element.style.backgroundImage).toBe('none')
    operations.consume()
    expect(operations.capture()).toBe(false)
})

test('RendererDom refreshes detached font metrics while preserving explicit line height', () => {
    const resources = ResourcesDom.create({ canvas: {} })
    const renderer = new RendererDom({ resources })
    const operations = new Operations()
    resources.events.on(RESOURCE_EVENT.FONT, () => operations.add({ op: OPERATIONS.RESOURCE_FONT }))
    const font_family = Style.resolveStyle('fontFamily', 'Poppins')
    const line_heights = [undefined, Style.resolveStyle('lineHeight', '20px'), Style.resolveStyle('lineHeight', 'unset')]
    const nodes = line_heights.map((line_height) => ({
        parent: null,
        styles: {
            fontFamily: font_family.expanded[0],
            ...(line_height === undefined ? {} : { lineHeight: line_height.expanded[0] }),
        },
    }))
    const elements = nodes.map((node) => {
        const element = { style: {} }
        ;(renderer as any).elements.set(node, element)
        renderer.updateStyle(node, font_family)
        return element
    })

    expect(elements.map((element) => element.style.lineHeight)).toEqual(['', '20px', ''])

    resources.registerFont('Poppins', { image: {}, data: { metrics: { lineHeight: 1.5 } } })
    operations.capture()
    expect(operations.items).toEqual([{ op: OPERATIONS.RESOURCE_FONT }])
    operations.setUpdateLayout(renderer.prepareLayout(new Set(nodes), operations))
    expect(elements.map((element) => element.style.lineHeight)).toEqual(['1.5', '20px', '1.5'])
    operations.consume()

    resources.disposeFont('Poppins')
    operations.capture()
    operations.setUpdateLayout(renderer.prepareLayout(new Set(nodes), operations))
    expect(elements.map((element) => element.style.lineHeight)).toEqual(['', '20px', ''])
    operations.consume()
    expect(operations.capture()).toBe(false)
})

test('UIs observe shared resource changes independently and retain registrations made during an update', async () => {
    const original_document = (globalThis as any).document
    ;(globalThis as any).document = { fonts: createFontSet() }
    const resources = ResourcesDom.create({ canvas: createDomElement() })
    const first_ui = await TestUI.create({ renderer: new RendererDom({ resources }), resources })
    const second_ui = await TestUI.create({ renderer: new RendererDom({ resources }), resources })
    const first_operations = (first_ui as any).operations
    const second_operations = (second_ui as any).operations

    try {
        first_operations.capture()
        first_operations.consume()
        second_operations.capture()
        second_operations.consume()
        resources.registerImage('avatar', { src: '/assets/avatar.png' })

        first_operations.capture()
        second_operations.capture()
        first_operations.consume()
        expect(first_operations.capture()).toBe(false)
        expect(second_operations.items).toEqual([{ op: OPERATIONS.RESOURCE_IMAGE }])

        resources.registerFont('Poppins', { image: {}, data: { metrics: { lineHeight: 1.5 } } })
        second_operations.consume()

        first_operations.capture()
        second_operations.capture()
        expect(first_operations.items).toEqual([{ op: OPERATIONS.RESOURCE_FONT }])
        expect(second_operations.items).toEqual(first_operations.items)
        first_operations.consume()
        second_operations.consume()
        expect(first_operations.capture()).toBe(false)
        expect(second_operations.capture()).toBe(false)
    } finally {
        first_ui.destroy()
        second_ui.destroy()
        ;(globalThis as any).document = original_document
    }
})

test('ResourcesDom shares its font listener until the last UI is destroyed', async () => {
    const original_document = (globalThis as any).document
    const fonts = createFontSet()
    ;(globalThis as any).document = { fonts }
    const resources = ResourcesDom.create({ canvas: createDomElement() })
    resources.registerFont('Poppins', { image: {}, data: { metrics: { lineHeight: 1.5 } } })
    const first_ui = await TestUI.create({ renderer: new RendererDom({ resources }), resources })
    const second_ui = await TestUI.create({ renderer: new RendererDom({ resources }), resources })
    const first_operations = (first_ui as any).operations
    const second_operations = (second_ui as any).operations

    try {
        second_operations.capture()
        second_operations.consume()
        expect(fonts.getListenerCount('loadingdone')).toBe(1)

        first_ui.destroy()
        first_ui.destroy()
        expect(fonts.getListenerCount('loadingdone')).toBe(1)
        expect(resources.getFont('Poppins')).toEqual({ lineHeight: 1.5 })

        fonts.dispatchEvent({ type: 'loadingdone' })
        resources.registerImage('avatar', { src: '/assets/avatar.png' })
        expect(first_operations.capture()).toBe(false)
        expect(second_operations.capture()).toBe(true)
        expect(second_operations.items).toEqual([
            { op: OPERATIONS.RESOURCE_FONT },
            { op: OPERATIONS.RESOURCE_IMAGE },
        ])
    } finally {
        second_ui.destroy()
        expect(fonts.getListenerCount('loadingdone')).toBe(0)
        ;(globalThis as any).document = original_document
    }
})

test('ResourcesDom font observation cleanup remains safe when called more than once', () => {
    const original_document = (globalThis as any).document
    const fonts = createFontSet()
    ;(globalThis as any).document = { fonts }
    const resources = ResourcesDom.create({ canvas: {} })
    const changes = []
    const unsubscribe = resources.events.on(RESOURCE_EVENT.FONT, (event_data) => changes.push(event_data))
    const stopObservingFirst = resources.observeFonts()
    const stopObservingSecond = resources.observeFonts()

    try {
        stopObservingFirst()
        stopObservingFirst()
        expect(fonts.getListenerCount('loadingdone')).toBe(1)
        fonts.dispatchEvent({ type: 'loadingdone' })
        expect(changes).toEqual([undefined])
        stopObservingSecond()
        stopObservingSecond()
        expect(fonts.getListenerCount('loadingdone')).toBe(0)
        fonts.dispatchEvent({ type: 'loadingdone' })
        expect(changes).toEqual([undefined])
    } finally {
        stopObservingFirst()
        stopObservingSecond()
        unsubscribe()
        ;(globalThis as any).document = original_document
    }
})

test('UI with RendererDom resolves resources registered before its creation', async () => {
    const original_document = (globalThis as any).document
    ;(globalThis as any).document = { fonts: createFontSet(), createElement: () => createDomElement() }
    const resources = ResourcesDom.create({ canvas: createDomElement() })
    resources.registerImage('avatar', { src: '/assets/avatar.png' })
    resources.registerFont('Poppins', { image: {}, data: { metrics: { lineHeight: 1.5 } } })
    const renderer = new RendererDom({ resources })
    renderer.getLayout = () => ({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        border: { top: 0, right: 0, bottom: 0, left: 0 },
    })
    const ui = await TestUI.create({ renderer, resources })

    try {
        const node = ui.create()
        node.style('backgroundImage', 'avatar')
        node.style('fontFamily', 'Poppins')
        ui.root.add(node)
        ui.update()

        expect(node.element.style.backgroundImage).toBe('url("/assets/avatar.png")')
        expect(node.element.style.lineHeight).toBe('1.5')
        expect((ui as any).operations.capture()).toBe(false)
    } finally {
        ui.destroy()
        ;(globalThis as any).document = original_document
    }
})

test('RendererDom synchronizes root and child scroll state once after update', () => {
    const canvas = createScrollableElement({
        scrollWidth: 600,
        scrollHeight: 500,
        clientWidth: 300,
        clientHeight: 200,
    })
    const element = createScrollableElement({
        scrollWidth: 400,
        scrollHeight: 350,
        clientWidth: 150,
        clientHeight: 100,
    })
    const renderer = new RendererDom({ resources: ResourcesDom.create({ canvas }) })
    const root = createNode(0)
    const node = createNode(1)
    const applied_nodes = []
    const read_nodes = []
    const applyNodeScroll = (renderer as any).applyNodeScroll.bind(renderer)
    ;(renderer as any).applyNodeScroll = (target) => {
        applied_nodes.push(target)
        applyNodeScroll(target)
    }
    const readNodeScroll = (renderer as any).readNodeScroll.bind(renderer)
    ;(renderer as any).readNodeScroll = (target, read_metrics) => {
        read_nodes.push(target)
        return readNodeScroll(target, read_metrics)
    }
    root.scrollLeft = 40
    root.scrollTop = 30
    node.scrollLeft = 25
    node.scrollTop = 20
    renderer.createElement(root)
    ;(renderer as any).elements.set(node, element)

    const operations = createOperations([], true)
    renderer.beforeUpdate([root, node], operations)
    renderer.afterUpdate([root, node], operations)

    expect(applied_nodes).toEqual([root, node])
    expect(read_nodes).toEqual([root, node])
    expect(canvas.scrollLeft).toBe(40)
    expect(canvas.scrollTop).toBe(30)
    expect(root.scrollWidth).toBe(600)
    expect(root.scrollHeight).toBe(500)
    expect(root.clientWidth).toBe(300)
    expect(root.clientHeight).toBe(200)
    expect(element.scrollLeft).toBe(25)
    expect(element.scrollTop).toBe(20)
    expect(node.scrollWidth).toBe(400)
    expect(node.scrollHeight).toBe(350)
    expect(node.clientWidth).toBe(150)
    expect(node.clientHeight).toBe(100)
})

test('RendererDom deduplicates native scroll against committed programmatic metrics', () => {
    const canvas = createScrollableElement({ scrollWidth: 200, scrollHeight: 300, clientWidth: 100, clientHeight: 100 })
    const renderer = new RendererDom({ resources: ResourcesDom.create({ canvas }) })
    const node = createNode(0)
    node.styles.overflowY = { parsed: { enum: OVERFLOW.scroll } }
    renderer.createElement(node)
    const operations = createOperations([], true)

    renderer.afterUpdate([node], operations)
    expect(operations.scroll_changed_nodes.size).toBe(0)
    operations.consume()
    expect([...operations.scroll_changed_nodes]).toEqual([node])
    expect(renderer.syncScroll(canvas, operations)).toBeUndefined()

    node.scrollTop = 40
    operations.add({ op: OPERATIONS.SCROLL, node })
    operations.capture()
    renderer.beforeUpdate([node], operations)
    renderer.afterUpdate([node], operations)
    operations.consume()
    expect([...operations.scroll_changed_nodes]).toEqual([node])
    expect(renderer.syncScroll(canvas, operations)).toBeUndefined()

    canvas.scrollTop = 60
    expect(renderer.syncScroll(canvas, operations)).toBe(node)
    expect(node.scrollTop).toBe(60)
    expect(renderer.syncScroll(canvas, operations)).toBeUndefined()
})

test('RendererDom updates only text operation targets, including root and detached nodes', () => {
    const canvas = createDomElement()
    const renderer = new RendererDom({ resources: ResourcesDom.create({ canvas }) })
    const root = { ...createNode(0), ui: {}, text_content: 'newer root text' }
    const detached = { ...createNode(1), ui: {}, text_content: 'newer detached text' }
    const destroyed = { ...createNode(2), ui: null }
    const detached_element = createDomElement()
    const writes = []
    renderer.createElement(root)
    ;(renderer as any).elements.set(detached, detached_element)
    Object.defineProperty(canvas, 'innerHTML', {
        set(value) {
            writes.push({ node: root, value })
        },
    })
    Object.defineProperty(detached_element, 'innerHTML', {
        set(value) {
            writes.push({ node: detached, value })
        },
    })

    renderer.beforeUpdate([root], createOperations([], true))
    expect(writes).toEqual([])

    const operations = createOperations([
        { op: OPERATIONS.TEXT, node: root, value: 'captured root text' },
        { op: OPERATIONS.TEXT, node: detached, value: '' },
        { op: OPERATIONS.TEXT, node: destroyed, value: 'destroyed text' },
    ], true)
    renderer.beforeUpdate([root], operations)

    expect(writes).toEqual([
        { node: root, value: 'captured root text' },
        { node: detached, value: '' },
    ])
})

test('RendererDom targets scroll operations without touching the root or siblings', () => {
    const root = createNode(0)
    const node = createNode(1)
    const sibling = createNode(2)
    const canvas = createDomElement()
    const element = createDomElement()
    const sibling_element = createDomElement()
    const renderer = new RendererDom({ resources: ResourcesDom.create({ canvas }) })
    const touched_nodes = []
    const metric_reads = []
    renderer.createElement(root)
    ;(renderer as any).elements.set(node, element)
    ;(renderer as any).elements.set(sibling, sibling_element)

    for (const property of ['scrollWidth', 'scrollHeight', 'clientWidth', 'clientHeight']) {
        Object.defineProperty(element, property, {
            get() {
                metric_reads.push(property)
                return 100
            },
        })
    }

    for (const [target, target_element] of [
        [root, canvas],
        [node, element],
        [sibling, sibling_element],
    ]) {
        let scroll_top = 0
        Object.defineProperty(target_element, 'scrollTop', {
            get() {
                touched_nodes.push(target)
                return scroll_top
            },
            set(value) {
                touched_nodes.push(target)
                scroll_top = Math.max(0, Math.min(value, 100))
            },
        })
    }

    node.scrollTop = 200
    node.scrollLeft = 25
    const operations = createOperations([{ op: OPERATIONS.SCROLL, node }])
    renderer.beforeUpdate([root, node, sibling], operations)
    renderer.afterUpdate([root, node, sibling], operations)

    expect(touched_nodes.length).toBeGreaterThan(0)
    expect(new Set(touched_nodes)).toEqual(new Set([node]))
    expect(metric_reads).toEqual([])
    expect(node.scrollTop).toBe(100)
    expect(node.scrollLeft).toBe(25)
    expect(element.scrollLeft).toBe(25)
    expect(operations.scroll_nodes).toEqual(new Set([node]))
})

test('UI with RendererDom skips geometry for paint, order, DPR and scroll and wakes for a loaded font', async () => {
    const original_document = (globalThis as any).document
    const fonts = createFontSet()
    ;(globalThis as any).document = { fonts, createElement: () => createDomElement() }
    const resources = ResourcesDom.create({ canvas: createDomElement() })
    const renderer = new RendererDom({ resources })
    const layout_reads = []
    renderer.getLayout = (node) => {
        layout_reads.push(node)
        return {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            border: { top: 0, right: 0, bottom: 0, left: 0 },
        }
    }
    const ui = await TestUI.create({ renderer, resources })

    try {
        const node = ui.create()
        ui.root.add(node)
        ui.update()
        ui.update()
        expect(layout_reads).toEqual([ui.root, node])

        node.style('backgroundColor', '#123')
        ui.update()
        node.style('zIndex', '1')
        ui.update()
        ui.setDevicePixelRatio(1.1)
        ui.update()
        node.scrollTop = 20
        ui.update()
        expect(layout_reads).toEqual([ui.root, node])
        expect((ui as any).operations.capture()).toBe(false)

        fonts.dispatchEvent({ type: 'loadingdone' })
        ui.update()
        expect(layout_reads).toEqual([ui.root, node, ui.root, node])
        expect((ui as any).operations.capture()).toBe(false)
        ui.update()
        expect(layout_reads).toHaveLength(4)
    } finally {
        ui.destroy()
        ;(globalThis as any).document = original_document
    }
})

test('RendererDom destroy removes UI elements and preserves its external root', async () => {
    const original_document = (globalThis as any).document
    const canvas = createDomElement()

    ;(globalThis as any).document = {
        createElement: () => createDomElement(),
        fonts: createFontSet(),
    }

    try {
        const renderer = new RendererDom({ resources: ResourcesDom.create({ canvas }) })
        await renderer.init()
        const root = createNode(0)
        const child = createNode(1)
        const detached = createNode(2)

        renderer.createElement(root)
        const child_element = renderer.createElement(child)
        const detached_element = renderer.createElement(detached)
        renderer.addChild(root, child)
        renderer.destroy([root, child, detached])

        expect(canvas.removed).toBe(false)
        expect(canvas.children).toHaveLength(0)
        expect(child_element.removed).toBe(true)
        expect(detached_element.removed).toBe(true)
    } finally {
        ;(globalThis as any).document = original_document
    }
})

test('RendererDom keeps detached elements alive until destroyNode', async () => {
    const original_document = (globalThis as any).document
    const canvas = createDomElement()

    ;(globalThis as any).document = {
        createElement: () => createDomElement(),
        fonts: createFontSet(),
    }

    try {
        const renderer = new RendererDom({ resources: ResourcesDom.create({ canvas }) })
        await renderer.init()
        const root = createNode(0)
        const child = createNode(1)
        const child_element = renderer.createElement(child)

        renderer.createElement(root)
        renderer.addChild(root, child)
        renderer.detachChild(root, child)

        expect(child_element.removed).toBe(false)
        expect((renderer as any).elements.has(child)).toBe(true)

        renderer.addChild(root, child)
        renderer.detachChild(root, child)
        renderer.destroyNode(child)

        expect(child_element.removed).toBe(true)
        expect((renderer as any).elements.has(child)).toBe(false)

        renderer.destroy([root])
    } finally {
        ;(globalThis as any).document = original_document
    }
})

test('UI with RendererDom destroys a subtree and preserves its parent, sibling and external root', async () => {
    const original_document = (globalThis as any).document
    const canvas = createDomElement()
    const external_element = createDomElement()
    canvas.appendChild(external_element)
    ;(globalThis as any).document = {
        createElement: () => createDomElement(),
        fonts: createFontSet(),
    }
    const resources = ResourcesDom.create({ canvas })
    const renderer = new RendererDom({ resources })
    const ui = await TestUI.create({ renderer, resources })

    try {
        const parent = ui.create()
        const subtree = ui.create()
        const child = ui.create()
        const grandchild = ui.create()
        const sibling = ui.create()
        ui.root.add(parent)
        parent.add(subtree)
        subtree.add(child)
        child.add(grandchild)
        parent.add(sibling)
        grandchild.text('pending text')
        const destroyed_elements = [subtree, child, grandchild].map((node) => [node, node.element])

        subtree.destroy()

        expect([...ui.nodes]).toEqual([ui.root, parent, sibling])
        expect([...(ui as any).nodes_created]).toEqual([ui.root, parent, sibling])
        expect(canvas.children).toEqual([parent.element, external_element])
        expect(parent.children).toEqual([sibling])
        expect(parent.element.children).toEqual([sibling.element])
        expect(sibling.parent).toBe(parent)
        expect(sibling.path).toEqual([0, 0])
        expect(external_element.removed).toBe(false)
        expect((ui as any).operations.pending.some(({ op }) => op === OPERATIONS.TEXT)).toBe(false)

        for (const node of [ui.root, parent, sibling]) {
            expect((renderer as any).elements.get(node)).toBe(node.element)
            expect((renderer as any).element_nodes.get(node.element)).toBe(node)
            expect(node.element.removed).toBe(false)
        }
        for (const [node, element] of destroyed_elements) {
            expect(element.removed).toBe(true)
            expect(element.children).toEqual([])
            expect((renderer as any).elements.has(node)).toBe(false)
            expect((renderer as any).element_nodes.has(element)).toBe(false)
            expect(node.ui).toBe(null)
            expect(node.parent).toBe(null)
            expect(node.children).toEqual([])
            expect(node.element).toBe(null)
        }
    } finally {
        ui.destroy()
        ;(globalThis as any).document = original_document
    }
})

test('RendererDom layout remains in content coordinates while the parent is scrolled', () => {
    const original_get_computed_style = globalThis.getComputedStyle
    const canvas = {
        scrollLeft: 40,
        scrollTop: 30,
        children: [],
        getBoundingClientRect() {
            return { left: 10, top: 20, width: 300, height: 200 }
        },
    }
    const renderer = new RendererDom({ resources: ResourcesDom.create({ canvas }) })
    const root = {
        id: 0,
        parent: null,
        layout: { x: 0, y: 0, width: 300, height: 200 },
    }
    const element = {
        getBoundingClientRect() {
            return { left: 20, top: 40, width: 100, height: 50 }
        },
    }
    const node = {
        parent: root,
    }
    renderer.createElement(root)
    ;(renderer as any).elements.set(node, element)

    globalThis.getComputedStyle = () =>
        ({
            borderTopWidth: '1px',
            borderRightWidth: '2px',
            borderBottomWidth: '3px',
            borderLeftWidth: '4px',
        }) as CSSStyleDeclaration

    try {
        expect(renderer.getLayout(node)).toMatchObject({
            left: 50,
            top: 50,
            x: 50,
            y: 50,
            width: 100,
            height: 50,
            border: {
                top: 1,
                right: 2,
                bottom: 3,
                left: 4,
            },
        })
    } finally {
        globalThis.getComputedStyle = original_get_computed_style
    }
})

function createNode(id) {
    return {
        id,
        styles: {},
        scroll_left: 0,
        scroll_top: 0,
        scrollWidth: 0,
        scrollHeight: 0,
        get scrollLeft() {
            return this.scroll_left
        },
        set scrollLeft(value) {
            this.scroll_left = value
        },
        get scrollTop() {
            return this.scroll_top
        },
        set scrollTop(value) {
            this.scroll_top = value
        },
        clientWidth: 0,
        clientHeight: 0,
        hasTextContent() {
            return false
        },
    }
}

function createFontSet() {
    const listeners = new Map()

    return {
        addEventListener(type, onEvent) {
            if (!listeners.has(type)) {
                listeners.set(type, new Set())
            }
            listeners.get(type).add(onEvent)
        },
        removeEventListener(type, onEvent) {
            listeners.get(type)?.delete(onEvent)
        },
        dispatchEvent(event) {
            for (const onEvent of listeners.get(event.type) ?? []) {
                onEvent(event)
            }
        },
        getListenerCount(type) {
            return listeners.get(type)?.size ?? 0
        },
    }
}

function createScrollableElement({ scrollWidth, scrollHeight, clientWidth, clientHeight }) {
    return {
        scrollLeft: 0,
        scrollTop: 0,
        scrollWidth: scrollWidth,
        scrollHeight: scrollHeight,
        clientWidth: clientWidth,
        clientHeight: clientHeight,
    }
}

function createDomElement() {
    const element = {
        style: {},
        scrollLeft: 0,
        scrollTop: 0,
        scrollWidth: 0,
        scrollHeight: 0,
        clientWidth: 0,
        clientHeight: 0,
        children: [],
        parent: null,
        removed: false,
        appendChild(child) {
            child.parent = element
            element.children.push(child)
        },
        insertBefore(child, before) {
            child.parent = element
            const index = before === null ? element.children.length : element.children.indexOf(before)
            element.children.splice(index, 0, child)
        },
        removeChild(child) {
            element.children.splice(element.children.indexOf(child), 1)
            child.parent = null
        },
        remove() {
            element.parent?.removeChild(element)
            element.removed = true
        },
    }

    return element
}

function createOperations(items = [], update_layout = false) {
    const operations = new Operations()
    for (const operation of items) {
        operations.add(operation)
    }
    operations.capture()
    operations.setUpdateLayout(update_layout)
    return operations
}
