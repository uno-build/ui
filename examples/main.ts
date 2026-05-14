import UIDom from '../src/engine/dom'
import UIYoga from '../src/engine/yoga'
import layoutBasic from './layout-basic'
import layoutZIndex from './layout-zindex'

const ENGINE = {
    dom: UIDom,
    yoga: UIYoga,
}
const LAYOUTS = {
    basic: layoutBasic,
    zindex: layoutZIndex,
}
const params = new URLSearchParams(window.location.search)
const engines = params.get('engines') || Object.keys(ENGINE)
const layout = params.get('layout') || 'basic'

engines.forEach(async (engine) => {
    const UI = ENGINE[engine]
    const canvas = document.getElementById(engine)
    const ui = new UI({ canvas })
    await ui.init()
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    ui.root.setProperty('width', canvas.clientWidth)
    ui.root.setProperty('height', canvas.clientHeight)

    LAYOUTS[layout]({ ui, engine, layout })
})
