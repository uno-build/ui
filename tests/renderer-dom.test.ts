import { expect, test } from '@playwright/test'
import RendererDom from '../src/renderer/RendererDom.ts'
import DOMSharedContext from '../src/renderer/dom/DOMSharedContext.ts'
import Style from '../src/style'

test('RendererDom sets the document root font size', () => {
    const document_element = { style: {} }
    const original_document = (globalThis as any).document

    ;(globalThis as any).document = {
        body: {
            parentElement: document_element,
        },
    }

    try {
        const renderer = new RendererDom({ canvas: {} })

        renderer.setRootSize(20)

        expect(document_element.style.fontSize).toBe('20px')
    } finally {
        ;(globalThis as any).document = original_document
    }
})

test('RendererDom keeps viewport units as native CSS values', () => {
    const renderer = new RendererDom({ canvas: {} })
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
    const renderer = new RendererDom({ canvas: {} })
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

test('RendererDom resolves natural and unset lineHeight from registered font metrics', () => {
    const dom = DOMSharedContext.create()
    const renderer = new RendererDom({ canvas: {}, dom })
    const element = { style: {} }
    const node = {
        styles: {
            fontFamily: { value: 'Poppins-Regular' },
        },
    }
    ;(renderer as any).elements.set(node, element)
    dom.registerFont('Poppins-Regular', {}, { metrics: { lineHeight: 1.5 } })

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

test('RendererDom synchronizes node scroll state after update', () => {
    const canvas = createScrollableElement({
        scroll_width: 600,
        scroll_height: 500,
        client_width: 300,
        client_height: 200,
    })
    const element = createScrollableElement({
        scroll_width: 400,
        scroll_height: 350,
        client_width: 150,
        client_height: 100,
    })
    const renderer = new RendererDom({ canvas })
    const root = createNode(0)
    const node = createNode(1)
    root.scroll_left = 40
    root.scroll_top = 30
    node.scroll_left = 25
    node.scroll_top = 20
    renderer.createElement(root)
    ;(renderer as any).elements.set(node, element)

    renderer.beforeUpdate([node])
    renderer.afterUpdate([node])

    expect(canvas.scrollLeft).toBe(40)
    expect(canvas.scrollTop).toBe(30)
    expect(root.scroll_width).toBe(600)
    expect(root.scroll_height).toBe(500)
    expect(root.client_width).toBe(300)
    expect(root.client_height).toBe(200)
    expect(element.scrollLeft).toBe(25)
    expect(element.scrollTop).toBe(20)
    expect(node.scroll_width).toBe(400)
    expect(node.scroll_height).toBe(350)
    expect(node.client_width).toBe(150)
    expect(node.client_height).toBe(100)
})

test('RendererDom layout remains in content coordinates while the parent is scrolled', () => {
    const canvas = {
        scrollLeft: 40,
        scrollTop: 30,
        children: [],
        getBoundingClientRect() {
            return { left: 10, top: 20, width: 300, height: 200 }
        },
    }
    const renderer = new RendererDom({ canvas })
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

    expect(renderer.getLayout(node)).toMatchObject({
        left: 50,
        top: 50,
        x: 50,
        y: 50,
        width: 100,
        height: 50,
    })
})

function createNode(id) {
    return {
        id,
        scroll_left: 0,
        scroll_top: 0,
        scroll_width: 0,
        scroll_height: 0,
        client_width: 0,
        client_height: 0,
        hasTextContent() {
            return false
        },
    }
}

function createScrollableElement({ scroll_width, scroll_height, client_width, client_height }) {
    return {
        scrollLeft: 0,
        scrollTop: 0,
        scrollWidth: scroll_width,
        scrollHeight: scroll_height,
        clientWidth: client_width,
        clientHeight: client_height,
    }
}
