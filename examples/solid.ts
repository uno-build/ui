import { createSolidContainer, render } from '../src/components/solid/index.js'
import { BasicComponent } from './solid.universal.jsx'

const container = createSolidContainer({ a: 123 })

const dispose = render(BasicComponent, container)
// dispose()
