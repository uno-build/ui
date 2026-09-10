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
DEFINED_EVENTS.map(defineEvent => defineEvent({ ui: {} }))

const canvas = document.createElement('canvas')
const resources = ResourcesDom.create({ canvas })
resources.registerImage('icon', { width: 10, height: 20 })
resources.disposeImage('icon')
resources.registerFont('font', {}, { metrics: {} })
resources.disposeFont('font')
const image_size: { width: number; height: number } | undefined = resources.getImageSize('icon')
const { ui } = await UIDom.create({ resources })
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
gpu_resources.registerImage('icon', {})
gpu_resources.disposeImage('icon')
gpu_resources.registerFont('font', {}, {})
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
