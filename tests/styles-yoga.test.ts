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

test('position', async () => {
    const { ui, root, child } = await createUI({
        height: '200px',
        alignItems: 'flex-start',
    })
    expect(root.layout.width).toBe(200)
    expect(root.layout.height).toBe(200)

    child.setStyle('width', '50px')
    child.setStyle('height', '40px')
    ui.update()
    expect(child.layout.x).toBe(0)
    expect(child.layout.y).toBe(0)

    child.setStyle('position', 'static')
    child.setStyle('left', '20px')
    child.setStyle('top', '30px')
    ui.update()
    expect(child.layout.x).toBe(0)
    expect(child.layout.y).toBe(0)

    child.setStyle('position', 'relative')
    ui.update()
    expect(child.layout.x).toBe(20)
    expect(child.layout.y).toBe(30)

    child.setStyle('position', 'absolute')
    child.setStyle('left', '25%')
    child.setStyle('top', '10%')
    ui.update()
    expect(child.layout.x).toBe(50)
    expect(child.layout.y).toBe(20)

    child.setStyle('left', 'unset')
    child.setStyle('top', 'unset')
    ui.update()
    expect(child.layout.x).toBe(0)
    expect(child.layout.y).toBe(0)

    child.setStyle('right', '25%')
    child.setStyle('bottom', '10%')
    ui.update()
    expect(child.layout.x).toBe(100)
    expect(child.layout.y).toBe(140)

    child.setStyle('right', 'unset')
    child.setStyle('bottom', 'unset')
    ui.update()
    expect(child.layout.x).toBe(0)
    expect(child.layout.y).toBe(0)
})

test('flex', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    expect(root.layout.width).toBe(200)
    expect(child.layout.width).toBe(0)

    child.setStyle('flex', '1')
    ui.update()
    expect(child.layout.width).toBe(200)

    child.setStyle('flex', 'unset')
    ui.update()
    expect(child.layout.width).toBe(0)
})

test('flexDirection', async () => {
    const { ui, root, child } = await createUI({ height: '200px' })
    const sibling = ui.create()
    const cases = [
        ['row', 0, 0, 50, 0],
        ['row-reverse', 150, 0, 100, 0],
        ['column', 0, 0, 0, 50],
        ['column-reverse', 0, 150, 0, 100],
    ] as const

    child.setStyle('width', '50px')
    child.setStyle('height', '50px')
    sibling.setStyle('width', '50px')
    sibling.setStyle('height', '50px')
    root.add(sibling)

    for (const [flexDirection, childX, childY, siblingX, siblingY] of cases) {
        root.setStyle('flexDirection', flexDirection)
        ui.update()
        expect(child.layout.x).toBe(childX)
        expect(child.layout.y).toBe(childY)
        expect(sibling.layout.x).toBe(siblingX)
        expect(sibling.layout.y).toBe(siblingY)
    }
})

test('flexWrap', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    const sibling = ui.create()
    const cases = [
        ['nowrap', 100, 0, 100, 100, 0],
        ['wrap', 150, 0, 150, 0, 50],
        ['wrap-reverse', 150, 50, 150, 0, 0],
    ] as const

    child.setStyle('width', '150px')
    child.setStyle('height', '50px')
    sibling.setStyle('width', '150px')
    sibling.setStyle('height', '50px')
    root.add(sibling)

    for (const [
        flexWrap,
        childWidth,
        childY,
        siblingWidth,
        siblingX,
        siblingY,
    ] of cases) {
        root.setStyle('flexWrap', flexWrap)
        ui.update()
        expect(child.layout.width).toBe(childWidth)
        expect(child.layout.y).toBe(childY)
        expect(sibling.layout.width).toBe(siblingWidth)
        expect(sibling.layout.x).toBe(siblingX)
        expect(sibling.layout.y).toBe(siblingY)
    }
})

test('alignContent', async () => {
    const { ui, root, child } = await createUI({
        width: '200px',
        height: '200px',
        flexWrap: 'wrap',
    })
    const sibling = ui.create()
    const cases = [
        ['flex-start', 0, 50],
        ['center', 50, 100],
        ['flex-end', 100, 150],
        ['stretch', 0, 100],
        ['baseline', 0, 50],
        ['space-between', 0, 150],
        ['space-around', 25, 125],
        ['space-evenly', 33, 117],
    ] as const

    child.setStyle('width', '150px')
    child.setStyle('height', '50px')
    sibling.setStyle('width', '150px')
    sibling.setStyle('height', '50px')
    root.add(sibling)

    for (const [alignContent, childY, siblingY] of cases) {
        root.setStyle('alignContent', alignContent)
        ui.update()
        expect(child.layout.y).toBe(childY)
        expect(sibling.layout.y).toBe(siblingY)
    }
})

test('alignItems', async () => {
    const { ui, root, child } = await createUI({
        width: '200px',
        height: '200px',
    })
    const sibling = ui.create()
    const cases = [
        ['normal', 200, 0, 120],
        ['flex-start', 0, 0, 0],
        ['center', 100, 0, 60],
        ['flex-end', 200, 0, 120],
        ['stretch', 0, 200, 0],
        ['baseline', 80, 0, 0],
    ] as const

    child.setStyle('width', '50px')
    sibling.setStyle('width', '50px')
    sibling.setStyle('height', '80px')
    root.add(sibling)

    for (const [alignItems, childY, childHeight, siblingY] of cases) {
        root.setStyle('alignItems', alignItems)
        ui.update()
        expect(child.layout.y).toBe(childY)
        expect(child.layout.height).toBe(childHeight)
        expect(sibling.layout.y).toBe(siblingY)
    }
})

test('display', async () => {
    const {
        ui,
        root,
        child: wrapper,
    } = await createUI({
        width: '200px',
        height: '200px',
    })
    const child = ui.create()
    const sibling = ui.create()

    wrapper.setStyle('width', '100px')
    wrapper.setStyle('height', '100px')
    child.setStyle('width', '40px')
    child.setStyle('height', '40px')
    sibling.setStyle('width', '50px')
    sibling.setStyle('height', '50px')
    wrapper.add(child)
    root.add(sibling)

    wrapper.setStyle('display', 'flex')
    ui.update()
    expect(wrapper.layout.width).toBe(100)
    expect(child.layout.width).toBe(40)
    expect(sibling.layout.x).toBe(100)

    wrapper.setStyle('display', 'none')
    ui.update()
    expect(wrapper.layout.width).toBe(0)
    expect(child.layout.width).toBe(0)
    expect(sibling.layout.x).toBe(0)

    wrapper.setStyle('display', 'contents')
    ui.update()
    expect(wrapper.layout.width).toBe(0)
    expect(child.layout.width).toBe(40)
    expect(sibling.layout.x).toBe(40)
})

test('flexGrow', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    const sibling = ui.create()

    child.setStyle('width', '50px')
    sibling.setStyle('width', '50px')
    root.add(sibling)
    ui.update()
    expect(child.layout.width).toBe(50)
    expect(sibling.layout.x).toBe(50)

    child.setStyle('flexGrow', '1')
    ui.update()
    expect(child.layout.width).toBe(150)
    expect(sibling.layout.x).toBe(150)

    child.setStyle('flexGrow', 'unset')
    ui.update()
    expect(child.layout.width).toBe(50)
    expect(sibling.layout.x).toBe(50)
})

test('flexShrink', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    const sibling = ui.create()

    child.setStyle('width', '150px')
    sibling.setStyle('width', '150px')
    root.add(sibling)
    ui.update()
    expect(child.layout.width).toBe(100)
    expect(sibling.layout.width).toBe(100)

    child.setStyle('flexShrink', '0')
    ui.update()
    expect(child.layout.width).toBe(150)
    expect(sibling.layout.width).toBe(50)

    child.setStyle('flexShrink', 'unset')
    ui.update()
    expect(child.layout.width).toBe(100)
    expect(sibling.layout.width).toBe(100)
})

test('flexBasis', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    expect(root.layout.width).toBe(200)
    expect(child.layout.width).toBe(0)

    child.setStyle('flexBasis', '50px')
    ui.update()
    expect(child.layout.width).toBe(50)

    child.setStyle('flexBasis', '50%')
    ui.update()
    expect(child.layout.width).toBe(100)

    child.setStyle('width', '75px')
    child.setStyle('flexBasis', 'auto')
    ui.update()
    expect(child.layout.width).toBe(75)

    child.setStyle('flexBasis', 'unset')
    ui.update()
    expect(child.layout.width).toBe(75)
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
