import UI from '../src/engine/dom'
import layoutBasic from './layout-basic'
import layoutZIndex from './layout-zindex'

const LAYOUTS = {
    basic: layoutBasic,
    zindex: layoutZIndex,
}

const params = new URLSearchParams(window.location.search)
const layout = params.get('layout') || 'basic'

const createLayout = LAYOUTS[layout]

const canvas = document.getElementById('html')
const ui = await new UI({ canvas })
canvas.width = canvas.clientWidth
canvas.height = canvas.clientHeight
ui.root.setProperty('width', canvas.clientWidth)
ui.root.setProperty('height', canvas.clientHeight)

console.log(`LAYOUT: ${layout}`)
LAYOUTS[layout]({ ui, engine: 'DOM', layout })
