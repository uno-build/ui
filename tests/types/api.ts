import { EventEmitter, EVENT, DEFINED_EVENTS, PLATFORM_EVENT_NAMES } from 'uno-ui/events'
import ResourcesDom from 'uno-ui/ResourcesDom'
import ResourcesWebGPU from 'uno-ui/ResourcesWebGPU'
import UIDom from 'uno-ui/UIDom'
import UIWebGPU from 'uno-ui/UIWebGPU'
import UIThree from 'uno-ui/UIThree'
import UIBabylon from 'uno-ui/UIBabylon'
import UIBabylonLite from 'uno-ui/UIBabylonLite'
import UIPlayCanvas from 'uno-ui/UIPlayCanvas'
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
const gpu = await UIWebGPU.create({ resources: gpu_resources, defined_events: DEFINED_EVENTS })
gpu.ui.draw({ submit: false })
await UIThree.create({ resources: gpu_resources })
await UIBabylon.create({ resources: gpu_resources })
await UIBabylonLite.create({ resources: gpu_resources })
await UIPlayCanvas.create({ resources: gpu_resources })
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
