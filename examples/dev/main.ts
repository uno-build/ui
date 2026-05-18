import { loadYoga } from 'yoga-layout/load'
import UIDom from '../../src/engine/dom/UIDom'
import UIYoga from '../../src/engine/yoga/UIYoga'
import layoutBasic from './layouts/basic'
import layoutZIndex from './layouts/zindex'

const RENDERER = {
    absolute_divs: {
        element_type: 'div',
        engine: UIYoga,
        attributes: {},
    },
    html_dom: {
        element_type: 'div',
        engine: UIDom,
        attributes: {},
    },
    // html_in_canvas: {
    //     element_type: 'canvas',
    //     engine: UIDom,
    //     attributes: {
    //         layoutsubtree: '',
    //     },
    // },
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

for (const renderer_name of renderers) {
    // Create canvas element
    const canvas = document.createElement(RENDERER[renderer_name].element_type)
    document.getElementById('root').appendChild(canvas)
    canvas.id = renderer_name
    canvas.style.opacity = '1'
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    Object.entries(RENDERER[renderer_name].attributes).forEach(
        ([key, value]) => {
            canvas.setAttribute(key, value)
        },
    )

    // Create UI engine
    const UI = RENDERER[renderer_name].engine
    const Yoga = await loadYoga()
    const ui = new UI({ canvas, Yoga })
    ui.root.setProperty('width', canvas.clientWidth)
    ui.root.setProperty('height', canvas.clientHeight)
    createLayout({ ui, renderer: renderer_name })

    ui.update()

    const result = [...ui.nodes].map((node) => ({
        width: node.layout.width,
        height: node.layout.height,
        x: node.layout.x,
        y: node.layout.y,
        path: node.path.join(','),
        zIndex: node.zIndex,
    }))
    console.table(result)
    console.log(JSON.stringify(result))
}
