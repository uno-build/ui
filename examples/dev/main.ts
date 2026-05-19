import { loadYoga } from 'yoga-layout/load'
import deepEqual from 'fast-deep-equal'
import UIDom from '../../src/engine/dom/UIDom'
import UIYoga from '../../src/engine/yoga/UIYoga'
import layoutBasic from './layouts/basic'
import layoutRelative from './layouts/relative'
import layoutZIndex from './layouts/zindex'

const LAYOUTS = {
    basic: layoutBasic,
    relative: layoutRelative,
    zindex: layoutZIndex,
}
const RENDERER = {
    'yoga.divs': {
        element_type: 'div',
        engine: UIYoga,
        attributes: {},
    },
    // 'dom.htmlincanvas': {
    //     element_type: 'canvas',
    //     engine: UIDom,
    //     attributes: {
    //         layoutsubtree: '',
    //     },
    // },
    'dom.html': {
        element_type: 'div',
        engine: UIDom,
        attributes: {},
    },
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

const ui_instances = []
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
        ...node.paintLayout,
        path: node.path.join('.'),
    }))
    console.table(result)

    // Store results for comparison
    ui_instances.push({ ui, result, renderer_name })
}

for (let i = 0; i < ui_instances.length - 1; i++) {
    const a = ui_instances[i]
    const b = ui_instances[i + 1]
    if (deepEqual(a.result, b.result)) {
        console.log(
            `✅ Layout results match between '${a.renderer_name}' and '${b.renderer_name}'`,
        )
    } else {
        console.error(
            `❌ Layout results differ between '${a.renderer_name}' and '${b.renderer_name}'`,
        )
    }
}
