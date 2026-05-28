import { test, expect } from '@playwright/test'
import RendererDivs from '../src/renderer/RendererDivs.ts'
import UI from '../src/UI'

test('width', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    expect(root.layout.width).toBe(200)
    expect(child.layout.width).toBe(0)

    child.setStyle('width', '50px')
    ui.update()
    expect(child.layout.width).toBe(50)

    child.setStyle('width', '50%')
    ui.update()
    expect(child.layout.width).toBe(100)

    child.setStyle('width', 'auto')
    ui.update()
    expect(child.layout.width).toBe(0)
})

test('height', async () => {
    const { ui, root, child } = await createUI({ height: '200px' })
    expect(root.layout.height).toBe(200)
    expect(child.layout.height).toBe(200)

    child.setStyle('height', '50px')
    ui.update()
    expect(child.layout.height).toBe(50)

    child.setStyle('height', '50%')
    ui.update()
    expect(child.layout.height).toBe(100)

    child.setStyle('height', 'auto')
    ui.update()
    expect(child.layout.height).toBe(200)
})

test('minWidth', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    expect(root.layout.width).toBe(200)
    expect(child.layout.width).toBe(0)

    child.setStyle('minWidth', '50px')
    ui.update()
    expect(child.layout.width).toBe(50)

    child.setStyle('minWidth', '50%')
    ui.update()
    expect(child.layout.width).toBe(100)

    child.setStyle('minWidth', 'unset')
    ui.update()
    expect(child.layout.width).toBe(0)
})

test('minHeight', async () => {
    const { ui, root, child } = await createUI({
        height: '200px',
        alignItems: 'flex-start',
    })
    expect(root.layout.height).toBe(200)
    expect(child.layout.height).toBe(0)

    child.setStyle('minHeight', '50px')
    ui.update()
    expect(child.layout.height).toBe(50)

    child.setStyle('minHeight', '50%')
    ui.update()
    expect(child.layout.height).toBe(100)

    child.setStyle('minHeight', 'unset')
    ui.update()
    expect(child.layout.height).toBe(0)
})

test('maxWidth', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    expect(root.layout.width).toBe(200)
    expect(child.layout.width).toBe(0)

    child.setStyle('width', '150px')
    ui.update()
    expect(child.layout.width).toBe(150)

    child.setStyle('maxWidth', '50px')
    ui.update()
    expect(child.layout.width).toBe(50)

    child.setStyle('maxWidth', '50%')
    ui.update()
    expect(child.layout.width).toBe(100)

    child.setStyle('maxWidth', 'unset')
    ui.update()
    expect(child.layout.width).toBe(150)
})

test('maxHeight', async () => {
    const { ui, root, child } = await createUI({
        height: '200px',
        alignItems: 'flex-start',
    })
    expect(root.layout.height).toBe(200)
    expect(child.layout.height).toBe(0)

    child.setStyle('height', '150px')
    ui.update()
    expect(child.layout.height).toBe(150)

    child.setStyle('maxHeight', '50px')
    ui.update()
    expect(child.layout.height).toBe(50)

    child.setStyle('maxHeight', '50%')
    ui.update()
    expect(child.layout.height).toBe(100)

    child.setStyle('maxHeight', 'unset')
    ui.update()
    expect(child.layout.height).toBe(150)
})

async function createUI(styles = {}) {
    const canvas = createDiv()
    const renderer = new RendererDivs({ canvas, createDiv })
    const ui = new UI({ renderer })
    await ui.init()
    const root = ui.root
    Object.keys(styles).forEach((name) => {
        root.setStyle(name, styles[name])
    })
    const child = ui.create()
    root.setStyle('width', '200px')
    root.add(child)
    ui.update()
    return { ui, root, child }
}

function createDiv() {
    return {
        style: {},
        appendChild() {},
        removeChild() {},
    }
}
