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
    const ui = new UI({ renderer })

    await ui.init()

    const child = ui.create()
    ui.root.add(child)

    child.text('Hello')
    ui.update()
    ui.draw()
    expect(child.text_content).toBe('Hello')
    expect(canvas.children[0].innerHTML).toBe('Hello')

    child.text('World')
    ui.update()
    ui.draw()
    expect(child.text_content).toBe('World')
    expect(canvas.children[0].innerHTML).toBe('World')

    child.text('')
    ui.update()
    ui.draw()
    expect(child.text_content).toBe('')
    expect(canvas.children[0].innerHTML).toBe('')
})

test('Node text updates size from renderer text measure', async () => {
    const canvas = createDiv()
    const renderer = new RendererDivs({ canvas, createDiv })
    const ui = new UI({ renderer })
    renderer.getTextMeasure = (node) => {
        const font_size = node.styles.fontSize?.parsed.value ?? 10

        return {
            width: node.text_content.length * font_size,
            height: font_size * 2,
        }
    }

    await ui.init()

    const child = ui.create()
    expect(child.text_content).toBeUndefined()

    child.style('width', '200px')
    child.style('height', '80px')
    child.style('fontSize', '10px')
    child.text('Hey')

    expect(child.text_content).toBe('Hey')
    expect(child.styles.width.value).toBe('30px')
    expect(child.styles.height.value).toBe('20px')

    child.style('width', '999px')
    child.style('height', '999px')

    expect(child.styles.width.value).toBe('30px')
    expect(child.styles.height.value).toBe('20px')

    child.style('fontSize', '20px')

    expect(child.styles.width.value).toBe('60px')
    expect(child.styles.height.value).toBe('40px')

    child.text('Hello')

    expect(child.styles.width.value).toBe('100px')
    expect(child.styles.height.value).toBe('40px')
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
