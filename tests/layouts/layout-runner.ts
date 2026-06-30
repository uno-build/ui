import UI from '../../src/UI'
import RendererDom from '../../src/renderer/RendererDom'
import RendererDivs from '../../src/renderer/RendererDivs'
import RendererWebGPU from '../../src/renderer/RendererWebGPU'
import { getLayout, layoutNames, LAYOUTS, resolveLayoutName } from './index'

export const SETUPS = {
    RendererDom: {
        elementType: 'div',
        renderer: RendererDom,
        attributes: {},
        inspectDomPaint: true,
        runOnTests: true,
        sourceOfTruth: true,
    },
    RendererDivs: {
        elementType: 'div',
        renderer: RendererDivs,
        attributes: {},
        inspectDomPaint: true,
        runOnTests: true,
    },
    RendererWebGPU: {
        elementType: 'canvas',
        renderer: RendererWebGPU,
        attributes: {},
        inspectDomPaint: false,
        runOnTests: false,
    },
}

export async function runLayout({ root, layout, renderers, logger = console }) {
    const createLayout = getLayout(layout)
    const results = []
    const rendered_layouts = []

    for (const rendererName of renderers) {
        const setup = getSetup(rendererName)
        const canvas = createCanvasElement(root, rendererName, setup)
        const Renderer = setup.renderer
        const renderer = new Renderer({ canvas })
        const ui = new UI({ renderer })
        await ui.init()

        syncRootSize({ ui, root, canvas })
        const layoutResult = await createLayout({ ui, rendererName })

        ui.update()
        observeRootSize({ ui, root, canvas })

        const result = readPaintLayout(ui)
        const paintedRects =
            setup.inspectDomPaint === false
                ? readLayoutRects({ nodes: ui.nodes })
                : readPaintedRects({ canvas, nodes: ui.nodes })
        const paintSamples =
            setup.inspectDomPaint === false
                ? []
                : readPaintSamples({
                      canvas,
                      nodes: ui.nodes,
                      samples: layoutResult?.paintSamples ?? [],
                  })

        logger.groupCollapsed?.(`${rendererName} layout`)
        logger.table(result)
        logger.groupEnd?.()

        results.push({ rendererName, result, paintedRects, paintSamples })
        rendered_layouts.push({ rendererName, ui })
    }

    ;(window as any).addRandomNode = createAddRandomNode(rendered_layouts)
    ;(window as any).removeRandomNode = createRemoveRandomNode(rendered_layouts)

    return results
}

function syncRootSize({ ui, root, canvas }) {
    ui.root.setStyle('width', `${root.clientWidth}px`)
    ui.root.setStyle('height', `${root.clientHeight}px`)

    if (canvas.tagName === 'CANVAS') {
        const device_pixel_ratio = window.devicePixelRatio
        canvas.width = Math.round(root.clientWidth * device_pixel_ratio)
        canvas.height = Math.round(root.clientHeight * device_pixel_ratio)
    }
}

function observeRootSize({ ui, root, canvas }) {
    let width = root.clientWidth
    let height = root.clientHeight

    const observer = new ResizeObserver(() => {
        if (root.clientWidth === width && root.clientHeight === height) {
            return
        }

        width = root.clientWidth
        height = root.clientHeight
        syncRootSize({ ui, root, canvas })
        ui.update()
    })

    observer.observe(root)
    ;(canvas as any).resizeObserver = observer
}

export async function runLayoutFromSearchParams({ root, params, origin, logger = console }) {
    const layout = readLayoutName(params.get('layout'))
    const renderers = readRendererNames(params.get('renderers'), logger)

    logger.log(`Running: ${origin}/?layout=${layout}&renderers=${renderers.join(',')}`)
    logger.log('Available layouts:', Object.keys(LAYOUTS))
    // logger.log('Available renderers:', Object.keys(SETUPS))

    const results = await runLayout({ root, layout, renderers, logger })
    reportLayoutComparisons(compareLayoutResults(results), logger)

    return results
}

export function readLayoutName(layout) {
    if (layout == null || layout === '') {
        return Object.keys(LAYOUTS)[0]
    }

    const layoutName = resolveLayoutName(layout)

    if (layoutName != null) {
        return layoutName
    }

    getLayout(layout)
    return layout
}

export function readRendererNames(renderersParam, logger = console) {
    const requestedRenderers =
        renderersParam == null || renderersParam === '' ? rendererNames : renderersParam.split(',')

    return requestedRenderers.filter((rendererName) => {
        if (hasOwn(SETUPS, rendererName)) {
            return true
        }

        logger.warn(`renderer '${rendererName}' not found. Available renderers:`, rendererNames)
        return false
    })
}

export function compareLayoutResults(results) {
    const comparisons = []
    const sourceOfTruth = results.find(({ rendererName }) => SETUPS[rendererName].sourceOfTruth === true)

    if (sourceOfTruth == null) {
        throw new Error('No source of truth renderer result was produced')
    }

    for (const result of results) {
        if (result.rendererName === sourceOfTruth.rendererName) {
            continue
        }

        comparisons.push({
            rendererA: sourceOfTruth.rendererName,
            rendererB: result.rendererName,
            matches: paintLayoutResultsMatch(sourceOfTruth.result, result.result),
        })
    }

    return comparisons
}

export function paintLayoutResultsMatch(a, b, tolerance = layoutComparisonTolerance) {
    if (a.length !== b.length) {
        return false
    }

    return a.every((aRow, index) => {
        const bRow = b[index]

        if (bRow == null || aRow.path !== bRow.path) {
            return false
        }

        return comparedLayoutKeys.every((key) => {
            const aValue = aRow[key]
            const bValue = bRow[key]

            return Number.isFinite(aValue) && Number.isFinite(bValue) && Math.abs(aValue - bValue) <= tolerance
        })
    })
}

export function reportLayoutComparisons(comparisons, logger = console) {
    for (const comparison of comparisons) {
        if (comparison.matches) {
            logger.log(`✅ Layout results match between '${comparison.rendererA}' and '${comparison.rendererB}'`)
        } else {
            logger.error(`❌ Layout results differ between '${comparison.rendererA}' and '${comparison.rendererB}'`)
        }
    }
}

function createCanvasElement(root, rendererName, setup) {
    const canvas = document.createElement(setup.elementType)

    root.appendChild(canvas)
    canvas.id = rendererName
    Object.assign(canvas.style, {
        display: 'flex',
        position: 'absolute',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
        zIndex: '0',
        opacity: '1',
    })

    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    Object.entries(setup.attributes).forEach(([key, value]) => {
        canvas.setAttribute(key, value)
    })

    return canvas
}

function readPaintLayout(ui) {
    return [...ui.nodes].map((node) => ({
        id: node.id,
        order: node.order,
        ...node.layout,
        path: node.path.join('.'),
    }))
}

function readPaintedRects({ canvas, nodes }) {
    const canvasRect = canvas.getBoundingClientRect()

    return [...nodes].map((node) => {
        const element = canvas.querySelector(`#node-${node.id}`)
        const path = node.path.join('.')

        if (element == null) {
            throw new Error(`Missing painted element for node '${path}'`)
        }

        const rect = element.getBoundingClientRect()

        return {
            id: node.id,
            path,
            x: Math.round(rect.left - canvasRect.left),
            y: Math.round(rect.top - canvasRect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
        }
    })
}

function readLayoutRects({ nodes }) {
    return [...nodes].map((node) => {
        const { layout } = node

        return {
            id: node.id,
            path: node.path.join('.'),
            x: Math.round(layout.x),
            y: Math.round(layout.y),
            width: Math.round(layout.width),
            height: Math.round(layout.height),
        }
    })
}

function readPaintSamples({ canvas, nodes, samples }) {
    const canvasRect = canvas.getBoundingClientRect()
    const nodesList = [...nodes]
    const nodesByElementId = new Map(nodesList.map((node) => [`node-${node.id}`, node]))

    return samples.map((sample) => {
        const { name, x, y, expected } = sample
        const elements = document.elementsFromPoint(canvasRect.left + x, canvasRect.top + y)
        const actualStack = elements
            .filter((element) => canvas.contains(element))
            .map((element) => nodesByElementId.get(element.id))
            .filter((node) => node != null)
            .map(readNodePath)
        const expectedStack =
            sample.expectedStack?.map(readNodePath) ??
            nodesList
                .filter((node) => nodeContainsPoint(node, x, y))
                .sort((a, b) => b.order - a.order)
                .map(readNodePath)

        return {
            name,
            x,
            y,
            expectedPath: readNodePath(expected),
            actualPath: actualStack[0] ?? null,
            expectedStack,
            actualStack,
        }
    })
}

function readNodePath(node) {
    return node.path.join('.')
}

function createAddRandomNode(rendered_layouts) {
    return function addRandomNode() {
        const parent = pickRandomNode(rendered_layouts[0].ui)
        const parent_path = parent.path
        const background_color = readRandomColor()
        const added_nodes = []

        for (const { rendererName, ui } of rendered_layouts) {
            const target_parent = findNodeByPath(ui, parent_path)
            const item = ui.create()
            item.setStyle('width', '24px')
            item.setStyle('height', '24px')
            item.setStyle('backgroundColor', background_color)

            target_parent.add(item)
            ui.update()

            added_nodes.push({
                rendererName,
                parentPath: readNodePath(target_parent),
                path: readNodePath(item),
                backgroundColor: background_color,
            })
        }

        return added_nodes
    }
}

function createRemoveRandomNode(rendered_layouts) {
    return function removeRandomNode() {
        const node = pickRandomDeepNode(rendered_layouts[0].ui)
        const node_path = node.path
        const removed_nodes = []

        for (const { rendererName, ui } of rendered_layouts) {
            const target_node = findNodeByPath(ui, node_path)

            target_node.parent.remove(target_node)
            ui.update()

            removed_nodes.push({
                rendererName,
                path: readNodePath(target_node),
            })
        }

        return removed_nodes
    }
}

function pickRandomNode(ui) {
    const nodes = [ui.root, ...ui.nodes]

    return nodes[Math.floor(Math.random() * nodes.length)]
}

function pickRandomDeepNode(ui) {
    const max_path_length = Math.max(...ui.nodes.map((node) => node.path.length))
    const nodes = ui.nodes.filter((node) => node.path.length >= max_path_length - 1)

    return nodes[Math.floor(Math.random() * nodes.length)]
}

function readRandomColor() {
    const value = Math.floor(Math.random() * 0x1000000)

    return `#${value.toString(16).padStart(6, '0')}`
}

function findNodeByPath(ui, path) {
    const path_key = path.join('.')

    if (path_key === '') {
        return ui.root
    }

    return ui.nodes.find((node) => readNodePath(node) === path_key)
}

function nodeContainsPoint(node, x, y) {
    const { layout } = node

    return x >= layout.x && x < layout.x + layout.width && y >= layout.y && y < layout.y + layout.height
}

function getSetup(name) {
    if (hasOwn(SETUPS, name)) {
        return SETUPS[name]
    }

    throw new Error(`setup '${name}' not found. Available renderers: ${rendererNames.join(', ')}`)
}

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key)
}

export const rendererNames = Object.keys(SETUPS)
export const defaultRendererNames = rendererNames.filter((rendererName) => SETUPS[rendererName].runOnTests !== false)
export const defaultSetupsNames = defaultRendererNames
export const comparedLayoutKeys = ['width', 'height', 'x', 'y', 'centerX', 'centerY']
export const comparedPaintedRectKeys = ['x', 'y', 'width', 'height']
export const layoutComparisonTolerance = 1

export { layoutNames }
