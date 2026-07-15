import { expect, test } from '@playwright/test'
import RendererDom from '../src/renderer/RendererDom.ts'
import Style from '../src/style'

test('RendererDom maps textStroke only to webkitTextStroke', () => {
    const renderer = new RendererDom({ canvas: {} })
    const node = { element: { style: {} } }

    ;(renderer as any).updateStyle(node, Style.resolveStyle('textStroke', '4PX #1234'))

    expect(node.element.style).toEqual({
        webkitTextStroke: '4px #1234',
    })

    ;(renderer as any).updateStyle(node, Style.resolveStyle('textStroke', 'unset'))

    expect(node.element.style).toEqual({
        webkitTextStroke: 'unset',
    })
})
