import { loadYoga } from 'yoga-layout/load'
import UIDom from '../../src/engine/dom'
import UIYoga from '../../src/engine/yoga'
import layoutBasic from './layouts/basic'
import layoutZIndex from './layouts/zindex'

const RENDERER = {
    absolute_divs: {
        type: 'div',
        engine: UIYoga,
        attributes: {},
    },
    html_dom: {
        type: 'div',
        engine: UIDom,
        attributes: {},
    },
    html_in_canvas: {
        type: 'canvas',
        engine: UIDom,
        attributes: {
            layoutsubtree: '',
        },
    },
}
const LAYOUTS = {
    basic: layoutBasic,
    zindex: layoutZIndex,
}
const Yoga = await loadYoga()
const params = new URLSearchParams(window.location.search)
const layout = params.get('layout') || 'basic'
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
renderers.forEach((renderer) => {
    const canvas = document.createElement(RENDERER[renderer].type)
    const UI = RENDERER[renderer].engine
    const ui = UI({ canvas, Yoga })
    document.getElementById('root').appendChild(canvas)
    canvas.id = renderer
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    Object.entries(RENDERER[renderer].attributes).forEach(([key, value]) => {
        canvas.setAttribute(key, value)
    })
    ui.root.setProperty('width', canvas.clientWidth)
    ui.root.setProperty('height', canvas.clientHeight)

    LAYOUTS[layout]({ ui, renderer })
})
