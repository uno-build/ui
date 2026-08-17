import { createUniversalRendererRoot } from '../src/components/octane/index.js'
import { BasicComponent } from './octane.universal'

const renderer = createUniversalRendererRoot({ props: { a: 123 } })

renderer.render(BasicComponent, {})
// renderer.unmount()
