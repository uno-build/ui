import { createUniversalLogger, createUniversalRendererRoot } from '../src/components/octane/index.js'
import { BasicComponent } from './octane.universal'

const logger = createUniversalLogger(true)
const renderer_root = createUniversalRendererRoot({ logger })

renderer_root.render(BasicComponent, {})

window.addEventListener(
    'pagehide',
    () => {
        renderer_root.unmount()
    },
    { once: true },
)
