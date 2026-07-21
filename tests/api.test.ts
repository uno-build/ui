import { test, expect } from '@playwright/test'
import UI from '../src/UI'
import RendererDivs from '../src/renderer/RendererDivs.ts'

test('UI and Node api creates, styles, updates, and removes nodes', async () => {
    const canvas = createDiv()
    const renderer = new RendererDivs({ canvas, createDiv })
    const ui = new UI({ renderer })

    await ui.init()
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
    expect(canvas.children.map(({ id }) => id)).toContain('node-2')
    expect(canvas.children.map(({ id }) => id)).not.toContain('node-1')
    expect(canvas.children.map(({ id }) => id)).not.toContain('node-3')
    expect(ui.root.element.getChildCount()).toBe(1)
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

test('UI stores rem styles without resolving them', async () => {
    const canvas = createDiv()
    const renderer = new RendererDivs({ canvas, createDiv })
    const ui = new UI({ renderer })

    await ui.init()

    const node = ui.create()
    node.style('width', '2rem')
    node.style('fontSize', '1.25rem')
    node.style('top', '-0.5rem')
    expect(node.styles).toMatchObject({
        width: {
            value: '2rem',
            parsed: { value: 2, kind: 'rem' },
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
    node.style('width', '2rem')
    node.style('fontSize', '1.25rem')
    node.style('top', '-0.5rem')
    expect(node.styles).toMatchObject({
        width: {
            value: '2rem',
            parsed: { value: 2, kind: 'rem' },
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
    const canvas = createDiv()
    const renderer = new RendererDivs({ canvas, createDiv })
    const ui = new UI({ renderer })

    await ui.init()

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
    expect(canvas.children.map(({ id }) => id)).toEqual(['node-4'])
})

test('Node add and remove throw for invalid tree operations', async () => {
    const canvas = createDiv()
    const renderer = new RendererDivs({ canvas, createDiv })
    const ui = new UI({ renderer })

    await ui.init()

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
    const canvas = createDiv()
    const renderer = new RendererDivs({ canvas, createDiv })
    const ui = new UI({ renderer })

    await ui.init()

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
    expect(canvas.children).toEqual([])
    expect(child.element).toBe(null)
})

test('Node text stores, replaces, and clears text content', async () => {
    const canvas = createDiv()
    const renderer = new RendererDivs({ canvas, createDiv })
    renderer.getTextMeasure = () => ({ width: 10, height: 10 })
    const ui = new UI({ renderer })

    await ui.init()

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
    expect(canvas.children[0].innerHTML).toBe('Hello')
    expect(canvas.children[0].style.whiteSpace).toBe('pre')

    child.text('World')
    ui.update()
    ui.draw()
    expect(child.text_content).toBe('World')
    expect(canvas.children[0].innerHTML).toBe('World')

    child.text('')
    ui.update()
    ui.draw()
    expect(child.isTextNode()).toBe(true)
    expect(child.hasTextContent()).toBe(false)
    expect(child.text_content).toBe('')
    expect(canvas.children[0].innerHTML).toBe('')
})

test('Node text uses intrinsic size unless dimensions are explicit', async () => {
    const canvas = createDiv()
    const renderer = new RendererDivs({ canvas, createDiv })
    renderer.getTextMeasure = (node) => {
        const font_size = node.styles.fontSize?.parsed.value ?? 16
        const font_scale = node.styles.fontFamily?.value === 'Wide' ? 2 : 1
        return {
            width: node.text_content.length * font_size * font_scale,
            height: font_size * 2,
        }
    }
    const ui = new UI({ renderer })

    await ui.init()
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
    const renderer = new RendererDivs({ canvas: createDiv(), createDiv })
    const ui = new UI({ renderer })

    await ui.init()

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

test('Node lineHeight invalidates text measurement', async () => {
    const renderer = new RendererDivs({ canvas: createDiv(), createDiv })
    const ui = new UI({ renderer })

    await ui.init()

    const node = ui.create()
    node.text('Text')
    let invalidated_node
    renderer.invalidateTextNode = (node) => {
        invalidated_node = node
    }

    node.style('lineHeight', '1.5')

    expect(invalidated_node).toBe(node)
})

test('Node letterSpacing invalidates text measurement', async () => {
    const renderer = new RendererDivs({ canvas: createDiv(), createDiv })
    const ui = new UI({ renderer })

    await ui.init()

    const node = ui.create()
    node.text('Text')
    let invalidated_node
    renderer.invalidateTextNode = (node) => {
        invalidated_node = node
    }

    node.style('letter-spacing', '0.125rem')

    expect(node.styles.letterSpacing).toEqual({
        value: '0.125rem',
        parsed: { value: 0.125, kind: 'rem' },
    })
    expect(invalidated_node).toBe(node)
})

test('overflow shorthand and longhands follow assignment order', async () => {
    const renderer = new RendererDivs({ canvas: createDiv(), createDiv })
    const ui = new UI({ renderer })
    await ui.init()
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

test('UI defaults the device pixel ratio to 1', () => {
    const renderer = new RendererDivs({ canvas: createDiv(), createDiv })
    let device_pixel_ratio
    renderer.setDevicePixelRatio = (value) => {
        device_pixel_ratio = value
    }

    new UI({ renderer })

    expect(device_pixel_ratio).toBe(1)
})

test('UI forwards root size changes to the renderer', () => {
    const renderer = new RendererDivs({ canvas: createDiv(), createDiv })
    const root_sizes = []
    renderer.setRootSize = (value) => {
        root_sizes.push(value)
    }

    const ui = new UI({ renderer })
    ui.setRootSize(20)

    expect(root_sizes).toEqual([16, 20])
})

test('RendererDivs image api hooks are no-ops', async () => {
    const canvas = createDiv()
    const renderer = new RendererDivs({ canvas, createDiv })
    const ui = new UI({ renderer })
    const first_image = createImage('/assets/first.png', 32, 32)
    const second_image = createImage('/assets/second.png', 64, 16)

    await ui.init()

    ui.imageUpload('/assets/Avatar.png', first_image)
    expect(ui.imageList()).toEqual([])

    const child = ui.create()
    child.style('backgroundImage', '/assets/Avatar.png')
    child.style('backgroundSize', '100px 50px')
    child.style('backgroundPosition', '4px 6px')
    ui.root.add(child)

    ui.update()
    ui.draw()
    expect(canvas.children[0].style.backgroundImage).toBe('url("/assets/Avatar.png")')
    expect(canvas.children[0].style.backgroundSize).toBe('100px 50px')
    expect(canvas.children[0].style.backgroundPosition).toBe('4px 6px')

    child.style('backgroundSize', 'unset')
    ui.update()
    ui.draw()
    expect(canvas.children[0].style.backgroundSize).toBe('unset')

    child.style('backgroundSize', '50%')
    ui.update()
    ui.draw()
    expect(canvas.children[0].style.backgroundSize).toBe('50%')

    child.style('backgroundSize', 'cover')
    ui.update()
    ui.draw()
    expect(canvas.children[0].style.backgroundSize).toBe('cover')

    ui.imageUpload('/assets/Avatar.png', second_image)
    expect(ui.imageList()).toEqual([])

    ui.update()
    ui.draw()
    expect(canvas.children[0].style.backgroundImage).toBe('url("/assets/Avatar.png")')

    ui.imageDispose('/assets/Avatar.png')
    expect(ui.imageList()).toEqual([])

    ui.update()
    ui.draw()
    expect(canvas.children[0].style.backgroundImage).toBe('url("/assets/Avatar.png")')
    expect(() => ui.imageDispose('/assets/Avatar.png')).not.toThrow()
})

test('UI fontRegister delegates to renderer', () => {
    const calls = []
    const renderer = {
        setDevicePixelRatio() {},
        setRootSize() {},
        fontRegister(name, image, json) {
            calls.push({ name, image, json })
        },
    }
    const ui = new UI({ renderer })
    const image = createImage('/assets/fonts/Poppins.png', 484, 484)
    const json = { atlas: { type: 'msdf' } }

    ui.fontRegister('Poppins', image, json)

    expect(calls).toEqual([{ name: 'Poppins', image, json }])
})

test('RendererDivs measures registered fonts from glyph metrics', () => {
    const renderer = new RendererDivs({ canvas: createDiv(), createDiv })

    renderer.fontRegister('Poppins', null, {
        metrics: { lineHeight: 1.5 },
        glyphs: [
            { unicode: 65, advance: 0.5 },
            { unicode: 32, advance: 0.25 },
            { unicode: 66, advance: 0.8 },
        ],
    })

    expect(
        renderer.getTextMeasure({
            text_content: 'A B',
            hasTextContent() {
                return true
            },
            styles: {
                fontFamily: { value: 'Poppins' },
                fontSize: { parsed: { value: 20 } },
            },
        }),
    ).toEqual({ width: 31, height: 30 })
})

function createDiv() {
    return {
        children: [],
        style: {},
        appendChild(child) {
            this.children.push(child)
        },
        removeChild(child) {
            const index = this.children.indexOf(child)
            this.children.splice(index, 1)
        },
    }
}

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
