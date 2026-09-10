import { EventEmitter, EVENT, DEFINED_EVENTS, PLATFORM_EVENT_NAMES } from 'uno-ui/events'
import ResourcesDom from 'uno-ui/ResourcesDom'
import ResourcesWebGPU from 'uno-ui/ResourcesWebGPU'
import UIDom from 'uno-ui/UIDom'
import UIWebGPU from 'uno-ui/UIWebGPU'
import { loadYoga } from 'yoga-layout/load'
import { compilerConfig as octane_config } from 'uno-ui/octane/config'
import { compilerConfig as solid_config } from 'uno-ui/solid/config'

const emitter = new EventEmitter()
const stopListening: () => void = emitter.on(EVENT.CLICK.name, (event) => event)
emitter.emit('ready')
stopListening()
PLATFORM_EVENT_NAMES.map((name) => name.toUpperCase())
// @ts-expect-error Event definitions require a UI instance.
DEFINED_EVENTS.map(defineEvent => defineEvent({ ui: {} }))

const canvas = document.createElement('canvas')
const resources = ResourcesDom.create({ canvas })
resources.registerImage('icon', { width: 10, height: 20 })
resources.disposeImage('icon')
resources.registerFont('font', {}, { metrics: { lineHeight: 1.2 } })
resources.disposeFont('font')
const image_size: { width: number; height: number } | undefined = resources.getImageSize('icon')
const { ui } = await UIDom.create({ resources })
DEFINED_EVENTS.map(defineEvent => defineEvent({ ui }))
const node = ui.create()!
const sibling = ui.create()!
ui.root?.add(node)
node.add(sibling, null)
node.text('Hello')
node.style('color', '#ffffff')
node.focus(new Event('focus'))
node.blur()
ui.draw()

const gpu_resources = await ResourcesWebGPU.create({ canvas })
const gpu_image = { bitmap: canvas, width: 10, height: 20 }
gpu_resources.registerImage('icon', gpu_image)
gpu_resources.disposeImage('icon')
gpu_resources.registerFont('font', gpu_image, {
    metrics: { lineHeight: 1.2, ascender: 0.9, descender: -0.3 },
    atlas: { size: 32, distanceRange: 4, yOrigin: 'bottom' },
    glyphs: [{ unicode: 65, advance: 0.6 }],
})
gpu_resources.disposeFont('font')
const gpu = await UIWebGPU.create({ resources: gpu_resources, loadYoga, defined_events: DEFINED_EVENTS })
await UIWebGPU.create({
    resources: gpu_resources,
    loadYoga,
    image_min_filter: 'nearest',
    image_mag_filter: 'linear',
    defined_events: [({ ui }) => {
        const gpu_ui: UIWebGPU = ui
        return {
            types: [EVENT.CLICK],
            destroy() { gpu_ui.events.emit('cleanup') },
            destroyNode(node) { node.blur() },
        }
    }, ({ ui }) => ({ types: [], destroy() { ui.events.emit('cleanup') } })],
})
gpu.ui.draw({ submit: false })
octane_config.renderers.rules[0]?.include
solid_config.solid.moduleName.toUpperCase()

class CustomDom extends UIDom {
    constructor(options: any) {
        super(options)
    }
}
class CustomResources extends ResourcesDom {
    constructor(options: any) {
        super(options)
    }
}
new CustomDom({ resources: new CustomResources({ canvas }) })

// @ts-expect-error Constructors remain protected.
new UIDom({ resources })
// @ts-expect-error Constructors remain protected.
new ResourcesWebGPU({ canvas })
// @ts-expect-error Storage remains private.
emitter.listeners
// @ts-expect-error Initialization remains protected.
ui.initialize()
// @ts-expect-error Listeners must be callable.
emitter.on('ready', 1)
// @ts-expect-error Existing image keys are strings.
resources.registerImage(42, {})
// @ts-expect-error The same contract applies to WebGPU overrides.
gpu_resources.disposeImage(42)
// @ts-expect-error Existing text values are strings.
node.text(42)

// @ts-expect-error WebGPU resources are required.
UIWebGPU.create({ loadYoga })
// @ts-expect-error Yoga must be supplied by the consumer.
UIWebGPU.create({ resources: gpu_resources })
// @ts-expect-error DOM resources cannot supply WebGPU managers.
UIWebGPU.create({ resources, loadYoga })
// @ts-expect-error Yoga loaders must return the Yoga API.
UIWebGPU.create({ resources: gpu_resources, loadYoga: async () => ({}) })
// @ts-expect-error Image filters accept only supported values.
UIWebGPU.create({ resources: gpu_resources, loadYoga, image_min_filter: 'invalid' })
// @ts-expect-error Magnification filters accept only supported values.
UIWebGPU.create({ resources: gpu_resources, loadYoga, image_mag_filter: 'invalid' })
// @ts-expect-error Event controllers require cleanup.
UIWebGPU.create({ resources: gpu_resources, loadYoga, defined_events: [() => ({ types: [] })] })
// @ts-expect-error Unknown options should not be silently accepted.
UIWebGPU.create({ resources: gpu_resources, loadYoga, image_filter: 'linear' })
// @ts-expect-error WebGPU constructors remain protected.
new UIWebGPU({ resources: gpu_resources, loadYoga })

const draw_result = gpu.ui.draw({ submit: false, load_op: 'clear' })
draw_result?.command_encoder.finish()
draw_result?.texture_view.label.toUpperCase()
gpu_resources.device.createCommandEncoder()
gpu_resources.context.present?.()
gpu_resources.image_manager.getImage('icon')?.image_size[0].toFixed()
gpu_resources.font_manager.getFont('font')?.metrics.ascender.toFixed()
resources.getFont('font')?.lineHeight.toFixed()
resources.getImage('icon')?.width.toFixed()
ui.setViewport(800, 600)
ui.setDevicePixelRatio(2)
ui.setRootSize(16)
node.layout.width?.toFixed()
node.layout.border?.top.toFixed()
node.id.toFixed()
node.on(EVENT.CLICK.name, (event) => {
    event.x.toFixed()
    event.current_target.text('clicked')
    event.stopPropagation()
    // @ts-expect-error Click events do not have wheel deltas.
    event.delta_y
})
node.on('wheel', (event) => event.delta_y.toFixed())
node.on('focus', (event) => event.related_target?.blur())
node.on('scroll', (event) => event.scroll_top.toFixed())
node.on('custom', (event: { detail: string }) => event.detail.toUpperCase())
ui.events.on('click', (event) => event.event_data.x.toFixed())
// @ts-expect-error Raw UI events are not propagated node events.
ui.events.on('click', (event) => event.stopPropagation())

// @ts-expect-error Drawing uses WebGPU load operations.
gpu.ui.draw({ load_op: 'invalid' })
// @ts-expect-error Drawing returns a typed result.
draw_result?.missing
// @ts-expect-error Dimensions must be numbers.
ui.setViewport('800', 600)
// @ts-expect-error Pixel ratio must be numeric.
ui.setDevicePixelRatio('2')
// @ts-expect-error Root font size must be numeric.
ui.setRootSize('16px')
// @ts-expect-error Node removal requires a Node.
node.remove({})
// @ts-expect-error Styles use string values, including numbers encoded as strings.
node.style('width', 100)
// @ts-expect-error Listeners must be callable.
node.on('click', 42)
// @ts-expect-error Registered images require a bitmap and dimensions.
gpu_resources.registerImage('invalid', {})
// @ts-expect-error Font data requires atlas metrics and glyphs.
gpu_resources.registerFont('invalid', gpu_image, {})
// @ts-expect-error DOM resources need an HTMLElement.
ResourcesDom.create({ canvas: {} })
// @ts-expect-error A context or a canvas is required.
ResourcesWebGPU.create({})
// @ts-expect-error Atlas sizes must be numbers.
ResourcesWebGPU.create({ canvas, image_atlas_size: '2048' })
// @ts-expect-error Texture formats are WebGPU formats.
ResourcesWebGPU.create({ canvas, format: 'invalid' })
declare const context: GPUCanvasContext & { present(): void }
declare const device: GPUDevice
await ResourcesWebGPU.create({ context, device, format: 'rgba8unorm' })
await ResourcesWebGPU.create({ canvas: { getContext: () => context }, device })
const key = Symbol('event')
emitter.on(key, () => {})
emitter.emit(key)
emitter.on({}, () => {})
const typed_emitter = new EventEmitter<{ ready: { count: number } }>()
typed_emitter.on('ready', (event) => event.count.toFixed())
// @ts-expect-error Event payloads follow the supplied event map.
typed_emitter.emit('ready', { count: '1' })

// @ts-expect-error Required payloads cannot be omitted from explicitly typed event maps.
typed_emitter.emit('ready')
const optional_emitter = new EventEmitter<{ ready: { count: number } | undefined }>()
optional_emitter.emit('ready')
optional_emitter.on('ready', (event) => event?.count.toFixed())

gpu.ui.dispatchPlatformEvent(new PointerEvent('pointerdown'))
gpu.ui.dispatchPlatformEvent({
    type: 'pointermove', clientX: 1, clientY: 2, pointerId: 1,
    currentTarget: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) },
})
// @ts-expect-error Platform pointer events require coordinates and a surface.
gpu.ui.dispatchPlatformEvent({ type: 'pointerdown' })

const dom_ui_resources: ResourcesDom | null = ui.resources
ui.resources?.observeFonts()()
node.element?.style.setProperty('color', 'red')
node.parent?.element?.focus()
node.children[0]?.element?.getBoundingClientRect()
ui.root?.element?.appendChild(document.createElement('div'))
// @ts-expect-error DOM resources do not expose a GPU device.
ui.resources?.device
// @ts-expect-error Elements are nullable after destruction.
node.element.focus()
// @ts-expect-error DOM elements have an HTML interface.
node.element?.missing

const gpu_ui_resources: ResourcesWebGPU | null = gpu.ui.resources
gpu.ui.resources?.device.createCommandEncoder()
gpu.ui.resources?.context.getCurrentTexture()
gpu.ui.resources?.image_manager.getImage('icon')
const gpu_node = gpu.ui.create()!
const gpu_element: undefined | null = gpu_node.element
const gpu_root_element: undefined | null = gpu.ui.root?.element
const gpu_child_element: undefined | null = gpu_node.children[0]?.element
const gpu_parent_element: undefined | null = gpu_node.parent?.element
// @ts-expect-error WebGPU nodes do not have DOM elements.
gpu_node.element?.style
// @ts-expect-error Resources can be cleared when the UI is destroyed.
gpu.ui.resources.device
// @ts-expect-error Resources retain their concrete interface.
gpu.ui.resources?.missing

ui.renderer?.getLayout(node).width.toFixed()
ui.renderer?.getChildIndex(node).toFixed()
ui.renderer?.getEventNode(document.createTextNode('hello'))?.element?.focus()
ui.renderer?.syncScroll(canvas)?.element?.focus()
gpu.ui.renderer?.getLayout(gpu_node).height.toFixed()
gpu.ui.renderer?.getTextMeasure(gpu_node, 100, 'at-most').width.toFixed()
// @ts-expect-error Concrete renderers retain the typed node contract.
ui.renderer?.getLayout({})
// @ts-expect-error Concrete renderers retain numeric viewport dimensions.
gpu.ui.renderer?.setViewport('100', 100)
// @ts-expect-error Measurement modes are the supported layout modes.
gpu.ui.renderer?.getTextMeasure(gpu_node, 100, 'invalid')
// @ts-expect-error Expanded styles are required by concrete renderers too.
gpu.ui.renderer?.updateStyle(gpu_node, { name: 'width', value: '100px' })
