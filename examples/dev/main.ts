import { loadYoga } from 'yoga-layout/load'
import UIDom from '../../src/engine/dom'
import UIYoga from '../../src/engine/yoga'
import layoutBasic from './layouts/basic'
import layoutZIndex from './layouts/zindex'

const RENDERER = {
    html_dom: {
        element_type: 'div',
        engine: UIDom,
        attributes: {},
    },
    html_in_canvas: {
        element_type: 'canvas',
        engine: UIDom,
        attributes: {
            layoutsubtree: '',
        },
    },
    absolute_divs: {
        element_type: 'div',
        engine: UIYoga,
        attributes: {},
    },
}
const LAYOUTS = {
    basic: layoutBasic,
    zindex: layoutZIndex,
}
const params = new URLSearchParams(window.location.search)
const layout = params.get('layout') || 'basic'
const createLayout = LAYOUTS[layout]
const renderers_params =
    params.get('renderers') === null || params.get('renderers') === ''
        ? Object.keys(RENDERER)
        : params.get('renderers').split(',')

const renderers = renderers_params.filter((renderer) => {
    if (RENDERER.hasOwnProperty(renderer)) {
        return true
    }
    console.warn(
        `renderer '${renderer}' not found. Available renderers:`,
        Object.keys(RENDERER),
    )
    return false
})

console.log(
    `Running: ${window.location.origin}/?layout=${layout}&renderers=${renderers.join(',')}`,
)
renderers.forEach(async (renderer) => {
    const canvas = document.createElement(RENDERER[renderer].element_type)
    const UI = RENDERER[renderer].engine
    const Yoga = await loadYoga()
    const ui = new UI({ canvas, Yoga })
    console.log(ui.Yoga)
    canvas.id = renderer
    canvas.style.opacity = '1'
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    Object.entries(RENDERER[renderer].attributes).forEach(([key, value]) => {
        canvas.setAttribute(key, value)
    })
    document.getElementById('root').appendChild(canvas)
    ui.root.setProperty('width', canvas.clientWidth)
    ui.root.setProperty('height', canvas.clientHeight)
    createLayout({ ui, renderer })
})
