import UI from '../../src/UI'
import RendererDivs from '../../src/renderer/RendererDivs'
import RendererDom from '../../src/renderer/RendererDom'
import { getLayout, layoutNames, LAYOUTS } from './index'

export const SETUPS = {
    RendererDom: {
        elementType: 'div',
        renderer: RendererDom,
        attributes: {},
    },
    RendererDivs: {
        elementType: 'div',
        renderer: RendererDivs,
        attributes: {},
    },
}

export async function runLayout({ root, layout, renderers, logger = console }) {
    const createLayout = getLayout(layout)
    const results = []

    for (const rendererName of renderers) {
        const setup = getSetup(rendererName)
        const canvas = createCanvasElement(root, rendererName, setup)
        const Renderer = setup.renderer
        const renderer = new Renderer({ canvas })
        const ui = new UI({ renderer })
        await ui.init()

        ui.root.setStyle('width', `${canvas.clientWidth}px`)
        ui.root.setStyle('height', `${canvas.clientHeight}px`)
        const layoutResult = createLayout({ ui, rendererName })

        ui.update()

        const result = readPaintLayout(ui)
        const paintedRects = readPaintedRects({ canvas, nodes: ui.nodes })
        const paintSamples = readPaintSamples({
            canvas,
            nodes: ui.nodes,
            samples: layoutResult?.paintSamples ?? [],
        })
        logger.table(result)
        results.push({ rendererName, result, paintedRects, paintSamples })
    }

    return results
}

export async function runLayoutFromSearchParams({
    root,
    params,
    origin,
    logger = console,
}) {
    const layout = readLayoutName(params.get('layout'))
    const renderers = readRendererNames(params.get('renderers'), logger)

    logger.log(
        `Running: ${origin}/?layout=${layout}&renderers=${renderers.join(',')}`,
    )

    const results = await runLayout({ root, layout, renderers, logger })
    reportLayoutComparisons(compareLayoutResults(results), logger)

    return results
}

export function readLayoutName(layout) {
    if (layout == null || layout === '') {
        return Object.keys(LAYOUTS)[0]
    }

    getLayout(layout)
    return layout
}

export function readRendererNames(renderersParam, logger = console) {
    const requestedRenderers =
        renderersParam == null || renderersParam === ''
            ? defaultRendererNames
            : renderersParam.split(',')

    return requestedRenderers.filter((rendererName) => {
        if (hasOwn(SETUPS, rendererName)) {
            return true
        }

        logger.warn(
            `renderer '${rendererName}' not found. Available renderers:`,
            defaultRendererNames,
        )
        return false
    })
}

export function compareLayoutResults(results) {
    const comparisons = []

    for (let i = 0; i < results.length - 1; i++) {
        const a = results[i]
        const b = results[i + 1]

        if (a == null || b == null) {
            continue
        }

        comparisons.push({
            rendererA: a.rendererName,
            rendererB: b.rendererName,
            matches: paintLayoutResultsMatch(a.result, b.result),
        })
    }

    return comparisons
}

export function paintLayoutResultsMatch(
    a,
    b,
    tolerance = layoutComparisonTolerance,
) {
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

            return (
                Number.isFinite(aValue) &&
                Number.isFinite(bValue) &&
                Math.abs(aValue - bValue) <= tolerance
            )
        })
    })
}

export function reportLayoutComparisons(comparisons, logger = console) {
    for (const comparison of comparisons) {
        if (comparison.matches) {
            logger.log(
                `✅ Layout results match between '${comparison.rendererA}' and '${comparison.rendererB}'`,
            )
        } else {
            logger.error(
                `❌ Layout results differ between '${comparison.rendererA}' and '${comparison.rendererB}'`,
            )
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

function readPaintSamples({ canvas, nodes, samples }) {
    const canvasRect = canvas.getBoundingClientRect()
    const nodesList = [...nodes]
    const nodesByElementId = new Map(
        nodesList.map((node) => [`node-${node.id}`, node]),
    )

    return samples.map(({ name, x, y, expected }) => {
        const elements = document.elementsFromPoint(
            canvasRect.left + x,
            canvasRect.top + y,
        )
        const actualStack = elements
            .filter((element) => canvas.contains(element))
            .map((element) => nodesByElementId.get(element.id))
            .filter((node) => node != null)
            .map(readNodePath)
        const expectedStack = nodesList
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

function nodeContainsPoint(node, x, y) {
    const { layout } = node

    return (
        x >= layout.x &&
        x < layout.x + layout.width &&
        y >= layout.y &&
        y < layout.y + layout.height
    )
}

function getSetup(name) {
    if (hasOwn(SETUPS, name)) {
        return SETUPS[name]
    }

    throw new Error(
        `setup '${name}' not found. Available renderers: ${defaultRendererNames.join(', ')}`,
    )
}

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key)
}

export const defaultRendererNames = Object.keys(SETUPS)
export const defaultSetupsNames = defaultRendererNames
export const comparedLayoutKeys = [
    'width',
    'height',
    'x',
    'y',
    'centerX',
    'centerY',
]
export const comparedPaintedRectKeys = ['x', 'y', 'width', 'height']
export const layoutComparisonTolerance = 1

export { layoutNames }
