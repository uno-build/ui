import { test, expect } from '@playwright/test'
import UI from '../src/UI'

test('UI and Node api creates, styles, updates, and removes nodes', async () => {
    const renderer = new TestRenderer()
    const ui = new UI({ renderer })

    await ui.init()

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
    }).toThrow(/invalid value 'red' for property 'backgroundColor': expected hex color/)
    expect(() => {
        child.setStyle('width', true)
    }).toThrow(/style value for property 'width' must be a string/)

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

    expect(renderer.appliedStyles.map(toStyleUpdate)).toEqual([
        [child.id, 'width', '120px'],
        [child.id, 'backgroundColor', '#123'],
        [child.id, 'height', '40px'],
        [sibling.id, 'marginLeft', '10%'],
    ])
    expect(renderer.updates).toEqual([
        ['before', [child, sibling, grandchild]],
        ['after', [child, sibling, grandchild]],
    ])
    expect(child.layout).toEqual({ id: child.id, childCount: 1 })
    expect(sibling.layout).toEqual({ id: sibling.id, childCount: 0 })
    expect(grandchild.layout).toEqual({
        id: grandchild.id,
        childCount: 0,
    })

    child.remove(grandchild)
    ui.root.remove(child)

    expect([...ui.nodes]).toEqual([sibling])
    expect(ui.root.element.children).toEqual([sibling.element])
    expect(child.element.children).toEqual([])
    expect(child.parent).toBe(null)
    expect(grandchild.parent).toBe(null)

    ui.update()

    expect(renderer.updates.slice(2)).toEqual([
        ['before', [sibling]],
        ['after', [sibling]],
    ])
})

class TestRenderer {
    public pendingStyles = []
    public appliedStyles = []
    public updates = []

    public async init() {}

    public createElement(node) {
        return {
            node,
            children: [],
        }
    }

    public addPendingStyle(node, style) {
        this.pendingStyles.push({ node, style })
    }

    public getChildIndex(node) {
        return node.element.children.length
    }

    public addChild(parent, node) {
        parent.element.children.push(node.element)
    }

    public removeChild(parent, node) {
        const index = parent.element.children.indexOf(node.element)
        parent.element.children.splice(index, 1)
    }

    public beforeUpdate(nodes) {
        this.updates.push(['before', [...nodes]])
        this.appliedStyles.push(...this.pendingStyles)
    }

    public getLayout(node) {
        return {
            id: node.id,
            childCount: node.element.children.length,
        }
    }

    public afterUpdate(nodes) {
        this.updates.push(['after', [...nodes]])
        this.pendingStyles.length = 0
    }
}

function toStyleUpdate({ node, style }) {
    return [node.id, style.name, style.value]
}
