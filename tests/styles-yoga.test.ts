import { test, expect } from '@playwright/test'
import RendererDivs from '../src/renderer/RendererDivs.ts'
import UI from '../src/UI'

test('width', async () => {
    const { ui, root } = await createUI()
    const child = ui.create()
    root.setStyle('width', '200px')
    root.add(child)
    ui.update()
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

async function createUI() {
    const canvas = createDiv()
    const renderer = new RendererDivs({ canvas, createDiv })
    const ui = new UI({ renderer })
    await ui.init()
    return { ui, root: ui.root }
}

function createDiv() {
    return {
        style: {},
        appendChild() {},
        removeChild() {},
    }
}
