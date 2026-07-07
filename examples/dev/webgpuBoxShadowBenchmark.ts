import UI from '../../src/UI'
import RendererWebGPU from '../../src/renderer/RendererWebGPU'

const DEFAULT_NODES = 400
const DEFAULT_FRAMES = 60
const DEFAULT_WARMUP = 10
const CARD_WIDTH = 58
const CARD_HEIGHT = 38
const GAP = 18

const SCENES = [
    {
        name: 'unset',
        box_shadow: 'unset',
    },
    {
        name: 'small',
        box_shadow: '0px 2px 6px 0px #00000040',
    },
    {
        name: 'large',
        box_shadow: '0px 8px 22px 0px #00000040',
    },
    {
        name: 'mixed',
        box_shadow: null,
    },
]

export async function runWebGPUBoxShadowBenchmark({ root, params }) {
    const nodes = readNumber(params, 'nodes', DEFAULT_NODES)
    const frames = readNumber(params, 'frames', DEFAULT_FRAMES)
    const warmup = readNumber(params, 'warmup', DEFAULT_WARMUP)
    const scenes = []

    for (const scene of SCENES) {
        scenes.push(await runScene({ root, scene, nodes, frames, warmup }))
    }

    return {
        nodes,
        frames,
        warmup,
        scenes,
    }
}

async function runScene({ root, scene, nodes, frames, warmup }) {
    root.textContent = ''

    const canvas = document.createElement('canvas')
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    root.appendChild(canvas)

    syncCanvasSize({ root, canvas })

    const renderer = new RendererWebGPU({ canvas })
    const ui = new UI({ renderer })
    await ui.init()

    ui.root.style('width', `${root.clientWidth}px`)
    ui.root.style('height', `${root.clientHeight}px`)
    ui.root.style('backgroundColor', '#f6f7f9')

    createGrid({ ui, scene, nodes, width: root.clientWidth })

    for (let i = 0; i < warmup; i++) {
        ui.render()
        await (renderer as any).device.queue.onSubmittedWorkDone()
    }

    const render_times = []
    const submitted_times = []

    for (let i = 0; i < frames; i++) {
        const render_start = performance.now()
        ui.render()
        const render_end = performance.now()
        await (renderer as any).device.queue.onSubmittedWorkDone()
        const submitted_end = performance.now()

        render_times.push(render_end - render_start)
        submitted_times.push(submitted_end - render_start)
    }

    root.removeChild(canvas)

    return {
        scene: scene.name,
        renderAvgMs: round(average(render_times)),
        renderP95Ms: round(percentile(render_times, 0.95)),
        submittedAvgMs: round(average(submitted_times)),
        submittedP95Ms: round(percentile(submitted_times, 0.95)),
        submittedMinMs: round(Math.min(...submitted_times)),
        submittedMaxMs: round(Math.max(...submitted_times)),
    }
}

function createGrid({ ui, scene, nodes, width }) {
    const columns = Math.max(1, Math.floor((width - GAP) / (CARD_WIDTH + GAP)))

    for (let i = 0; i < nodes; i++) {
        const row = Math.floor(i / columns)
        const column = i % columns
        const node = ui.create()

        node.style('position', 'absolute')
        node.style('left', `${GAP + column * (CARD_WIDTH + GAP)}px`)
        node.style('top', `${GAP + row * (CARD_HEIGHT + GAP)}px`)
        node.style('width', `${CARD_WIDTH}px`)
        node.style('height', `${CARD_HEIGHT}px`)
        node.style('borderRadius', '6px')
        node.style('backgroundColor', i % 2 === 0 ? '#ffffff' : '#eef2ff')

        const box_shadow = readBoxShadow(scene, i)

        node.style('boxShadow', box_shadow)

        ui.root.add(node)
    }
}

function readBoxShadow(scene, index) {
    if (scene.box_shadow != null) {
        return scene.box_shadow
    }

    if (index % 3 === 0) {
        return 'unset'
    }

    return index % 3 === 1 ? '0px 2px 6px 0px #00000040' : '0px 8px 22px 0px #00000040'
}

function syncCanvasSize({ root, canvas }) {
    const device_pixel_ratio = window.devicePixelRatio

    canvas.width = Math.round(root.clientWidth * device_pixel_ratio)
    canvas.height = Math.round(root.clientHeight * device_pixel_ratio)
}

function readNumber(params, name, fallback) {
    const value = Number(params.get(name))

    if (Number.isFinite(value) === false || value <= 0) {
        return fallback
    }

    return Math.round(value)
}

function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length
}

function percentile(values, ratio) {
    const sorted_values = [...values].sort((a, b) => a - b)
    const index = Math.min(sorted_values.length - 1, Math.floor(sorted_values.length * ratio))

    return sorted_values[index]
}

function round(value) {
    return Math.round(value * 1000) / 1000
}
