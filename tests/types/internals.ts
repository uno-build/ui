import Renderer from '../../src/core/Renderer'
import Resources from '../../src/core/Resources'
import UIWorldSpace from '../../types/ui/UIWorldSpace'
import Node from '../../src/core/Node'
import Operations from '../../src/core/Operations'
import { OPERATIONS } from '../../src/core/constants'
import type { ComputedLayout, StyleUpdate } from '../../types/style/types'

// @ts-expect-error Abstract renderer methods must be implemented.
class IncompleteRenderer extends Renderer {}
// @ts-expect-error Abstract resource methods must be implemented.
class IncompleteResources extends Resources {}
// @ts-expect-error Abstract world-space hooks must be implemented.
class IncompleteWorldSpace extends UIWorldSpace {}

type CustomResourceTypes = {
    image: { width: number, height: number, pixels: Uint8Array }
    font_image: Uint8Array
    font_data: { line_height: number }
    registered_image: { key: string }
    registered_font: number
}

class CompleteResources extends Resources<HTMLCanvasElement, CustomResourceTypes> {
    constructor(canvas: HTMLCanvasElement) { super({ canvas }) }
    registerImage(src: string, image: CustomResourceTypes['image']) { return { key: src } }
    disposeImage(src: string): void {}
    getImageSize(src: string): { width: number; height: number } | undefined { return undefined }
    registerFont(name: string, image: Uint8Array, json: CustomResourceTypes['font_data']) { return json.line_height }
    disposeFont(name: string): void {}
}

const resources: Resources<HTMLCanvasElement, CustomResourceTypes> = new CompleteResources(document.createElement('canvas'))
const pixels = new Uint8Array(4)
resources.registerImage('icon', { width: 1, height: 1, pixels }).key.toUpperCase()
resources.registerFont('font', pixels, { line_height: 20 }).toFixed()
resources.canvas.getContext('2d')
// @ts-expect-error The image contract requires pixels.
resources.registerImage('icon', { width: 1, height: 1 })
// @ts-expect-error Fonts can use a different image representation.
resources.registerFont('font', {}, { line_height: 20 })
// @ts-expect-error Font metadata follows the custom resource contract.
resources.registerFont('font', pixels, { line_height: '20' })
// @ts-expect-error Registered image return values retain their contract.
resources.registerImage('icon', { width: 1, height: 1, pixels }).missing
class InvalidResources extends CompleteResources {
    // @ts-expect-error An override must return the declared registration result.
    registerImage(src: string, image: CustomResourceTypes['image']) { return 1 }
}

type CustomElement = { label: string }
type CustomNode = Node<CustomElement>
type CustomRenderer = Renderer<{ clear?: boolean }, number, CustomElement, { ready: boolean }>

class CompleteRenderer extends Renderer<{ clear?: boolean }, number, CustomElement, { ready: boolean }> {
    async init() { return { ready: true } }
    draw(options?: { clear?: boolean }) { return options?.clear ? 1 : 0 }
    createElement(node: CustomNode) { return { label: String(node.id) } }
    getChildIndex(node: CustomNode) { return node.children.length }
    getLayout(node: CustomNode): ComputedLayout {
        return { x: 0, y: 0, width: 100, height: 20, left: 0, top: 0, centerX: 50, centerY: -10 }
    }
    detachChild(parent: CustomNode, node: CustomNode): void {}
    destroyNode(node: CustomNode): void {}
    updateStyle(node: CustomNode, style: StyleUpdate): void { node.element?.label.toUpperCase() }
    protected insertChild(parent: CustomNode, node: CustomNode, child_index: number): void {}
}

const renderer: CustomRenderer = new CompleteRenderer()
declare const node: CustomNode
const operations = new Operations<CustomElement>()
renderer.createElement(node).label.toUpperCase()
renderer.getLayout(node).width.toFixed()
renderer.getChildIndex(node).toFixed()
renderer.draw({ clear: true }).toFixed()
const initialized = await renderer.init()
initialized.ready.valueOf()
renderer.prepareLayout(new Set([node]), operations).valueOf()
renderer.beforeUpdate([node], operations)
renderer.afterUpdate([node], operations)
renderer.update([node], operations)
renderer.addChild(node, node, 0)
renderer.destroy([node])
renderer.updateStyle(node, { name: 'customStyle', value: 'custom', expanded: [{ name: 'customStyle', value: 'custom', parsed: { custom: true } }] })
// @ts-expect-error Renderer nodes must be Uno nodes.
renderer.createElement({})
// @ts-expect-error Drawing options retain the custom renderer contract.
renderer.draw({ clear: 'yes' })
// @ts-expect-error Styles passed to renderers include their expanded values.
renderer.updateStyle(node, { name: 'width', value: '10px' })
// @ts-expect-error Insertion indices are numbers.
renderer.addChild(node, node, '0')
// @ts-expect-error Renderer insertion hooks remain protected.
renderer.insertChild(node, node, 0)
// @ts-expect-error Initialization results retain their contract.
initialized.missing
class InvalidLayoutRenderer extends CompleteRenderer {
    // @ts-expect-error A renderer layout must contain geometry, not just optional fields.
    getLayout(node: CustomNode) { return { width: '100' } }
}
class InvalidElementRenderer extends CompleteRenderer {
    // @ts-expect-error A renderer must return its declared element type.
    createElement(node: CustomNode) { return document.createElement('div') }
}

operations.add({ op: OPERATIONS.ADD, parent: null, node })
operations.add({ op: OPERATIONS.TEXT, node, value: 'hello' })
operations.add({ op: OPERATIONS.VIEWPORT, width: 100, height: 20 })
operations.add({ op: OPERATIONS.RESOURCE_IMAGE })
operations.layout_nodes.add(node)
operations.scroll_nodes.add(node)
operations.setUpdateLayout(true)
for (const operation of operations.items) {
    if (operation.op === OPERATIONS.TEXT) {
        operation.value.toUpperCase()
        operation.node.element?.label.toUpperCase()
        // @ts-expect-error Text operations do not contain viewport dimensions.
        operation.width
    } else if (operation.op === OPERATIONS.VIEWPORT) {
        operation.width.toFixed()
        // @ts-expect-error Global operations do not carry a node.
        operation.node
    }
}
// @ts-expect-error Text operations require their text payload.
operations.add({ op: OPERATIONS.TEXT, node })
// @ts-expect-error Operation names are the runtime discriminants.
operations.add({ op: 'invalid' })
// @ts-expect-error Layout flags must be boolean.
operations.setUpdateLayout('yes')
