import { test, expect } from '@playwright/test'
import UI from '../src/UI'
import RendererDivs from '../src/renderer/RendererDivs.ts'

test('UI and Node api creates, styles, updates, and removes nodes', async () => {
    const canvas = createDiv()
    const renderer = new RendererDivs({ canvas, createDiv })
    const ui = new UI({ renderer })

    await ui.init()
    ui.root.setStyle('width', '200px')
    ui.root.setStyle('height', '200px')

    const child = ui.create({
        width: '120px',
        backgroundColor: '#123',
    })
    const sibling = ui.create()
    const grandchild = ui.create()

    ui.root.add(child)
    ui.root.add(sibling)
    child.add(grandchild)

    child.setStyle('height', '40px')
    sibling.setStyle('marginLeft', '10%')

    expect(() => {
        ui.create({ backgroundColor: 'red' })
    }).toThrow(
        /invalid value 'red' for property 'backgroundColor': expected hex color/,
    )
    expect(() => {
        child.setStyle('width', true)
    }).toThrow(/invalid value 'true' for property 'width': expected px unit/)

    expect(child.styles).toMatchObject({
        width: {
            value: '120px',
            parsed: { value: 120, unit: 'px' },
        },
        backgroundColor: {
            value: '#123',
            parsed: { rgba: [17 / 255, 34 / 255, 51 / 255, 1] },
        },
        height: {
            value: '40px',
            parsed: { value: 40, unit: 'px' },
        },
    })
    expect(sibling.styles.marginLeft).toEqual({
        value: '10%',
        parsed: { value: 10, unit: '%' },
    })

    expect([...ui.nodes]).toEqual([child, sibling, grandchild])
    expect(child.parent).toBe(ui.root)
    expect(sibling.parent).toBe(ui.root)
    expect(grandchild.parent).toBe(child)
    expect(child.path).toEqual([0])
    expect(sibling.path).toEqual([1])
    expect(grandchild.path).toEqual([0, 0])

    ui.update()

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
    expect(child.element.getChildCount()).toBe(0)
    expect(child.parent).toBe(null)
    expect(grandchild.parent).toBe(null)

    ui.update()

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

    ui.root.remove(parent)

    expect(ui.nodes.length).toBe(1)
    expect([...ui.nodes]).toEqual([sibling])
    expect(parent.parent).toBe(null)
    expect(child.parent).toBe(null)
    expect(grandchild.parent).toBe(null)
    expect(canvas.children.map(({ id }) => id)).toEqual(['node-4'])
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
