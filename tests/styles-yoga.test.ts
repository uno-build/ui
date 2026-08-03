import { test, expect } from '@playwright/test'
import UI from '../src/core/UI'
import TestRenderer from './TestRenderer.ts'

test('width', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    expect(root.layout.width).toBe(200)
    expect(child.layout.width).toBe(0)

    child.style('width', '50px')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(50)

    child.style('width', '50%')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(100)

    child.style('width', 'auto')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(0)
})

test('height', async () => {
    const { ui, root, child } = await createUI({ height: '200px' })
    expect(root.layout.height).toBe(200)
    expect(child.layout.height).toBe(200)

    child.style('height', '50px')
    ui.update()
    ui.draw()
    expect(child.layout.height).toBe(50)

    child.style('height', '50%')
    ui.update()
    ui.draw()
    expect(child.layout.height).toBe(100)

    child.style('height', 'auto')
    ui.update()
    ui.draw()
    expect(child.layout.height).toBe(200)
})

test('minWidth', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    expect(root.layout.width).toBe(200)
    expect(child.layout.width).toBe(0)

    child.style('minWidth', '50px')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(50)

    child.style('minWidth', '50%')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(100)

    child.style('minWidth', 'unset')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(0)
})

test('minHeight', async () => {
    const { ui, root, child } = await createUI({
        height: '200px',
        alignItems: 'flex-start',
    })
    expect(root.layout.height).toBe(200)
    expect(child.layout.height).toBe(0)

    child.style('minHeight', '50px')
    ui.update()
    ui.draw()
    expect(child.layout.height).toBe(50)

    child.style('minHeight', '50%')
    ui.update()
    ui.draw()
    expect(child.layout.height).toBe(100)

    child.style('minHeight', 'unset')
    ui.update()
    ui.draw()
    expect(child.layout.height).toBe(0)
})

test('maxWidth', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    expect(root.layout.width).toBe(200)
    expect(child.layout.width).toBe(0)

    child.style('width', '150px')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(150)

    child.style('maxWidth', '50px')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(50)

    child.style('maxWidth', '50%')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(100)

    child.style('maxWidth', 'unset')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(150)
})

test('maxHeight', async () => {
    const { ui, root, child } = await createUI({
        height: '200px',
        alignItems: 'flex-start',
    })
    expect(root.layout.height).toBe(200)
    expect(child.layout.height).toBe(0)

    child.style('height', '150px')
    ui.update()
    ui.draw()
    expect(child.layout.height).toBe(150)

    child.style('maxHeight', '50px')
    ui.update()
    ui.draw()
    expect(child.layout.height).toBe(50)

    child.style('maxHeight', '50%')
    ui.update()
    ui.draw()
    expect(child.layout.height).toBe(100)

    child.style('maxHeight', 'unset')
    ui.update()
    ui.draw()
    expect(child.layout.height).toBe(150)
})

test('position', async () => {
    const { ui, root, child } = await createUI({
        height: '200px',
        alignItems: 'flex-start',
    })
    expect(root.layout.width).toBe(200)
    expect(root.layout.height).toBe(200)

    child.style('width', '50px')
    child.style('height', '40px')
    ui.update()
    ui.draw()
    expect(child.layout.x).toBe(0)
    expect(child.layout.y).toBe(0)

    child.style('position', 'static')
    child.style('left', '20px')
    child.style('top', '30px')
    ui.update()
    ui.draw()
    expect(child.layout.x).toBe(0)
    expect(child.layout.y).toBe(0)

    child.style('position', 'relative')
    ui.update()
    ui.draw()
    expect(child.layout.x).toBe(20)
    expect(child.layout.y).toBe(30)

    child.style('position', 'absolute')
    child.style('left', '25%')
    child.style('top', '10%')
    ui.update()
    ui.draw()
    expect(child.layout.x).toBe(50)
    expect(child.layout.y).toBe(20)

    child.style('left', 'unset')
    child.style('top', 'unset')
    ui.update()
    ui.draw()
    expect(child.layout.x).toBe(0)
    expect(child.layout.y).toBe(0)

    child.style('right', '25%')
    child.style('bottom', '10%')
    ui.update()
    ui.draw()
    expect(child.layout.x).toBe(100)
    expect(child.layout.y).toBe(140)

    child.style('right', 'unset')
    child.style('bottom', 'unset')
    ui.update()
    ui.draw()
    expect(child.layout.x).toBe(0)
    expect(child.layout.y).toBe(0)
})

test('flex', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    expect(root.layout.width).toBe(200)
    expect(child.layout.width).toBe(0)

    child.style('flex', '1')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(200)

    child.style('flex', 'unset')
    ui.update()
    ui.draw()
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

    child.style('width', '50px')
    child.style('height', '50px')
    sibling.style('width', '50px')
    sibling.style('height', '50px')
    root.add(sibling)

    for (const [flexDirection, childX, childY, siblingX, siblingY] of cases) {
        root.style('flexDirection', flexDirection)
        ui.update()
        ui.draw()
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

    child.style('width', '150px')
    child.style('height', '50px')
    sibling.style('width', '150px')
    sibling.style('height', '50px')
    root.add(sibling)

    for (const [flexWrap, childWidth, childY, siblingWidth, siblingX, siblingY] of cases) {
        root.style('flexWrap', flexWrap)
        ui.update()
        ui.draw()
        expect(child.layout.width).toBe(childWidth)
        expect(child.layout.y).toBe(childY)
        expect(sibling.layout.width).toBe(siblingWidth)
        expect(sibling.layout.x).toBe(siblingX)
        expect(sibling.layout.y).toBe(siblingY)
    }
})

test('wrapped relative percent offsets use border side widths', async () => {
    const { ui, root, child } = await createUI({
        height: '200px',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        borderTopWidth: '10px',
        borderBottomWidth: '10px',
    })
    const sibling = ui.create()

    child.style('width', '150px')
    child.style('height', '50px')
    sibling.style('width', '150px')
    sibling.style('height', '50px')
    sibling.style('position', 'relative')
    sibling.style('top', '10%')
    root.add(sibling)
    ui.update()
    ui.draw()

    expect(sibling.layout.y).toBe(78)
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
        ['space-evenly', 100 / 3, 350 / 3],
    ] as const

    child.style('width', '150px')
    child.style('height', '50px')
    sibling.style('width', '150px')
    sibling.style('height', '50px')
    root.add(sibling)

    for (const [alignContent, childY, siblingY] of cases) {
        root.style('alignContent', alignContent)
        ui.update()
        ui.draw()
        expect(child.layout.y).toBeCloseTo(childY)
        expect(sibling.layout.y).toBeCloseTo(siblingY)
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

    child.style('width', '50px')
    sibling.style('width', '50px')
    sibling.style('height', '80px')
    root.add(sibling)

    for (const [alignItems, childY, childHeight, siblingY] of cases) {
        root.style('alignItems', alignItems)
        ui.update()
        ui.draw()
        expect(child.layout.y).toBe(childY)
        expect(child.layout.height).toBe(childHeight)
        expect(sibling.layout.y).toBe(siblingY)
    }
})

test('alignSelf', async () => {
    const { ui, root, child } = await createUI({
        width: '200px',
        height: '200px',
        alignItems: 'flex-end',
    })
    const sibling = ui.create()
    const cases = [
        ['auto', 200, 0, 120],
        ['normal', 200, 0, 120],
        ['flex-start', 0, 0, 120],
        ['center', 100, 0, 120],
        ['flex-end', 200, 0, 120],
        ['stretch', 0, 200, 120],
        ['baseline', 0, 0, 0],
    ] as const

    child.style('width', '50px')
    sibling.style('width', '50px')
    sibling.style('height', '80px')
    root.add(sibling)

    for (const [alignSelf, childY, childHeight, siblingY] of cases) {
        child.style('alignSelf', alignSelf)
        ui.update()
        ui.draw()
        expect(child.layout.y).toBe(childY)
        expect(child.layout.height).toBe(childHeight)
        expect(sibling.layout.y).toBe(siblingY)
    }
})

test('justifyContent', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    const sibling = ui.create()
    const cases = [
        ['flex-start', 0, 50],
        ['center', 50, 100],
        ['flex-end', 100, 150],
        ['space-between', 0, 150],
        ['space-around', 25, 125],
        ['space-evenly', 100 / 3, 350 / 3],
    ] as const

    child.style('width', '50px')
    child.style('height', '50px')
    sibling.style('width', '50px')
    sibling.style('height', '50px')
    root.add(sibling)

    for (const [justifyContent, childX, siblingX] of cases) {
        root.style('justifyContent', justifyContent)
        ui.update()
        ui.draw()
        expect(child.layout.x).toBeCloseTo(childX)
        expect(sibling.layout.x).toBeCloseTo(siblingX)
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

    wrapper.style('width', '100px')
    wrapper.style('height', '100px')
    child.style('width', '40px')
    child.style('height', '40px')
    sibling.style('width', '50px')
    sibling.style('height', '50px')
    wrapper.add(child)
    root.add(sibling)

    wrapper.style('display', 'flex')
    ui.update()
    ui.draw()
    expect(wrapper.layout.width).toBe(100)
    expect(child.layout.width).toBe(40)
    expect(sibling.layout.x).toBe(100)

    wrapper.style('display', 'none')
    ui.update()
    ui.draw()
    expect(wrapper.layout.width).toBe(0)
    expect(child.layout.width).toBe(0)
    expect(sibling.layout.x).toBe(0)

    wrapper.style('display', 'contents')
    ui.update()
    ui.draw()
    expect(wrapper.layout.width).toBe(0)
    expect(child.layout.width).toBe(40)
    expect(sibling.layout.x).toBe(40)
})

test('flexGrow', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    const sibling = ui.create()

    child.style('width', '50px')
    sibling.style('width', '50px')
    root.add(sibling)
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(50)
    expect(sibling.layout.x).toBe(50)

    child.style('flexGrow', '1')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(150)
    expect(sibling.layout.x).toBe(150)

    child.style('flexGrow', 'unset')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(50)
    expect(sibling.layout.x).toBe(50)
})

test('flexShrink', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    const sibling = ui.create()

    child.style('width', '150px')
    sibling.style('width', '150px')
    root.add(sibling)
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(100)
    expect(sibling.layout.width).toBe(100)

    child.style('flexShrink', '0')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(150)
    expect(sibling.layout.width).toBe(50)

    child.style('flexShrink', 'unset')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(100)
    expect(sibling.layout.width).toBe(100)
})

test('flexBasis', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    expect(root.layout.width).toBe(200)
    expect(child.layout.width).toBe(0)

    child.style('flexBasis', '50px')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(50)

    child.style('flexBasis', '50%')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(100)

    child.style('width', '75px')
    child.style('flexBasis', 'auto')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(75)

    child.style('flexBasis', 'unset')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(75)
})

test('aspectRatio', async () => {
    const { ui, child } = await createUI({
        height: '200px',
        alignItems: 'flex-start',
    })

    child.style('width', '100px')
    child.style('aspectRatio', '2')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(100)
    expect(child.layout.height).toBe(50)

    child.style('aspectRatio', 'unset')
    ui.update()
    ui.draw()
    expect(child.layout.width).toBe(100)
    expect(child.layout.height).toBe(0)

    const { ui: heightUi, child: heightChild } = await createUI({
        height: '200px',
        alignItems: 'flex-start',
    })

    heightChild.style('height', '80px')
    heightChild.style('aspectRatio', '2')
    heightUi.update()
    heightUi.draw()
    expect(heightChild.layout.width).toBe(160)
    expect(heightChild.layout.height).toBe(80)
})

test('boxSizing', async () => {
    const cases = [
        ['border-box', 100, 100, 70, 70],
        ['content-box', 130, 130, 100, 100],
    ] as const

    for (const [boxSizing, boxWidth, boxHeight, innerWidth, innerHeight] of cases) {
        const { ui, child: box } = await createUI({
            height: '200px',
            alignItems: 'flex-start',
        })
        const inner = ui.create()

        box.style('boxSizing', boxSizing)
        box.style('width', '100px')
        box.style('height', '100px')
        box.style('padding', '10px')
        box.style('borderTopWidth', '5px')
        box.style('borderLeftWidth', '5px')
        box.style('borderRightWidth', '5px')
        box.style('borderBottomWidth', '5px')
        inner.style('flex', '1')
        box.add(inner)
        ui.update()
        ui.draw()

        expect(box.layout.width).toBe(boxWidth)
        expect(box.layout.height).toBe(boxHeight)
        expect(inner.layout.x).toBe(15)
        expect(inner.layout.y).toBe(15)
        expect(inner.layout.width).toBe(innerWidth)
        expect(inner.layout.height).toBe(innerHeight)
    }
})

test('border width', async () => {
    const cases = [
        [
            {
                borderTopWidth: '10px',
                borderLeftWidth: '10px',
                borderRightWidth: '10px',
                borderBottomWidth: '10px',
            },
            10,
            10,
            180,
            180,
        ],
        [{ borderTopWidth: '10px' }, 0, 10, 200, 190],
        [{ borderLeftWidth: '10px' }, 10, 0, 190, 200],
        [{ borderRightWidth: '10px' }, 0, 0, 190, 200],
        [{ borderBottomWidth: '10px' }, 0, 0, 200, 190],
    ] as const

    for (const [styles, x, y, width, height] of cases) {
        const { ui, child } = await createUI({
            height: '200px',
            ...styles,
        })

        child.style('flex', '1')
        ui.update()
        ui.draw()
        expect(child.layout.x).toBe(x)
        expect(child.layout.y).toBe(y)
        expect(child.layout.width).toBe(width)
        expect(child.layout.height).toBe(height)
    }
})

test('direction', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    const sibling = ui.create()
    const cases = [
        ['inherit', 0, 50],
        ['ltr', 0, 50],
        ['rtl', 150, 100],
    ] as const

    child.style('width', '50px')
    child.style('height', '50px')
    sibling.style('width', '50px')
    sibling.style('height', '50px')
    root.add(sibling)

    for (const [direction, childX, siblingX] of cases) {
        root.style('direction', direction)
        ui.update()
        ui.draw()
        expect(child.layout.x).toBe(childX)
        expect(sibling.layout.x).toBe(siblingX)
    }
})

test('gap', async () => {
    const { ui, root, child } = await createUI({ width: '200px' })
    const sibling = ui.create()

    child.style('width', '50px')
    child.style('height', '50px')
    sibling.style('width', '50px')
    sibling.style('height', '50px')
    root.add(sibling)
    ui.update()
    ui.draw()
    expect(sibling.layout.x).toBe(50)

    root.style('gap', '10px')
    ui.update()
    ui.draw()
    expect(sibling.layout.x).toBe(60)

    root.style('gap', '0px')
    ui.update()
    ui.draw()
    expect(sibling.layout.x).toBe(50)

    root.style('gap', '10%')
    ui.update()
    ui.draw()
    expect(sibling.layout.x).toBe(70)

    root.style('gap', '0px')
    ui.update()
    ui.draw()
    expect(sibling.layout.x).toBe(50)

    root.style('columnGap', '10px')
    ui.update()
    ui.draw()
    expect(sibling.layout.x).toBe(60)

    root.style('columnGap', '0px')
    ui.update()
    ui.draw()
    expect(sibling.layout.x).toBe(50)

    root.style('columnGap', '10%')
    ui.update()
    ui.draw()
    expect(sibling.layout.x).toBe(70)

    root.style('columnGap', '0px')
    ui.update()
    ui.draw()
    expect(sibling.layout.x).toBe(50)

    const {
        ui: rowUi,
        root: rowRoot,
        child: rowChild,
    } = await createUI({
        width: '200px',
        height: '200px',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
    })
    const rowSibling = rowUi.create()

    rowChild.style('width', '150px')
    rowChild.style('height', '50px')
    rowSibling.style('width', '150px')
    rowSibling.style('height', '50px')
    rowRoot.add(rowSibling)
    rowUi.update()
    rowUi.draw()
    expect(rowSibling.layout.y).toBe(50)

    rowRoot.style('rowGap', '10px')
    rowUi.update()
    rowUi.draw()
    expect(rowSibling.layout.y).toBe(60)

    rowRoot.style('rowGap', '0px')
    rowUi.update()
    rowUi.draw()
    expect(rowSibling.layout.y).toBe(50)

    rowRoot.style('rowGap', '10%')
    rowUi.update()
    rowUi.draw()
    expect(rowSibling.layout.y).toBe(70)

    rowRoot.style('rowGap', '0px')
    rowUi.update()
    rowUi.draw()
    expect(rowSibling.layout.y).toBe(50)
})

test('margin', async () => {
    const cases = [
        ['margin', 10, 10, 70],
        ['marginTop', 0, 10, 50],
        ['marginLeft', 10, 0, 60],
        ['marginRight', 0, 0, 60],
    ] as const

    for (const [name, childX, childY, siblingX] of cases) {
        const { ui, root, child } = await createUI({
            height: '200px',
            alignItems: 'flex-start',
        })
        const sibling = ui.create()

        child.style('width', '50px')
        child.style('height', '50px')
        child.style(name, '10px')
        sibling.style('width', '50px')
        sibling.style('height', '50px')
        root.add(sibling)
        ui.update()
        ui.draw()
        expect(child.layout.x).toBe(childX)
        expect(child.layout.y).toBe(childY)
        expect(sibling.layout.x).toBe(siblingX)
    }

    const { ui, child } = await createUI({
        height: '200px',
        alignItems: 'flex-end',
    })

    child.style('width', '50px')
    child.style('height', '50px')
    child.style('marginBottom', '10px')
    ui.update()
    ui.draw()
    expect(child.layout.y).toBe(140)
})

test('padding', async () => {
    const cases = [
        ['padding', 10, 10, 180, 180],
        ['paddingTop', 0, 10, 200, 190],
        ['paddingLeft', 10, 0, 190, 200],
        ['paddingRight', 0, 0, 190, 200],
        ['paddingBottom', 0, 0, 200, 190],
    ] as const

    for (const [name, x, y, width, height] of cases) {
        const { ui, child } = await createUI({
            height: '200px',
            [name]: '10px',
        })

        child.style('flex', '1')
        ui.update()
        ui.draw()
        expect(child.layout.x).toBe(x)
        expect(child.layout.y).toBe(y)
        expect(child.layout.width).toBe(width)
        expect(child.layout.height).toBe(height)
    }

    const { ui, child: wrapper } = await createUI({
        height: '200px',
    })
    const child = ui.create()

    wrapper.style('width', '200px')
    wrapper.style('height', '200px')
    wrapper.style('padding', '10%')
    child.style('flex', '1')
    wrapper.add(child)
    ui.update()
    ui.draw()
    expect(child.layout.x).toBe(20)
    expect(child.layout.y).toBe(20)
    expect(child.layout.width).toBe(160)
    expect(child.layout.height).toBe(160)
})

async function createUI(styles = {}) {
    const renderer = new TestRenderer()
    const ui = new UI({ renderer })
    await ui.init()
    const root = ui.root
    Object.keys(styles).forEach((name) => {
        root.style(name, styles[name])
    })
    const child = ui.create()
    root.style('width', '200px')
    root.add(child)
    ui.update()
    ui.draw()
    return { ui, root, child }
}
